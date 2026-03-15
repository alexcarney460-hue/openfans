export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { walletsTable, walletTransactionsTable, creatorProfilesTable, usersTable } from "@/utils/db/schema";
// Note: some wallet_transactions inserts use raw SQL to support stream-specific
// transaction types not yet in the Drizzle enum (schema.ts not modified per spec).
import { eq, sql } from "drizzle-orm";
import { getAuthenticatedUser } from "@/utils/api/auth";
import { generateViewerToken, generatePublisherToken } from "@/utils/streaming/livekit";
import { UUID_REGEX } from "@/utils/streaming/constants";

const PLATFORM_FEE_PERCENT = 10; // Higher fee for live streams — covers streaming infrastructure costs
const LIVEKIT_URL = process.env.LIVEKIT_URL ?? "";

/**
 * POST /api/streams/[id]/join
 *
 * Pay the ticket price and receive a LiveKit token to join a live stream.
 * Creator joining their own stream: FREE, receives a publisher token.
 * Everyone else must pay — no free access for subscribers.
 *
 * Returns: { token: string, livekit_url: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const streamId = params.id;
    if (!UUID_REGEX.test(streamId)) {
      return NextResponse.json(
        { error: "Invalid stream ID", code: "INVALID_STREAM_ID" },
        { status: 400 },
      );
    }

    // Fetch stream
    const streamRows = await db.execute(sql`
      SELECT id, creator_id, title, status, ticket_price
      FROM live_streams
      WHERE id = ${streamId}
      LIMIT 1
    `);

    if (streamRows.length === 0) {
      return NextResponse.json(
        { error: "Stream not found", code: "STREAM_NOT_FOUND" },
        { status: 404 },
      );
    }

    const stream = streamRows[0] as {
      id: string;
      creator_id: string;
      title: string;
      status: string;
      ticket_price: number;
    };

    if (stream.status !== "live") {
      return NextResponse.json(
        { error: "Stream is not currently live", code: "STREAM_NOT_LIVE" },
        { status: 400 },
      );
    }

    // Fetch user info for token name
    const userRows = await db
      .select({ username: usersTable.username })
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .limit(1);

    const username = userRows[0]?.username ?? "anonymous";

    // Creator joins their own stream for free with publisher token (no timer)
    if (stream.creator_id === user.id) {
      const token = await generatePublisherToken(stream.id, user.id, username);
      return NextResponse.json({ token, livekit_url: LIVEKIT_URL, is_creator: true });
    }

    // Check if user has a valid (non-expired) purchase for this stream
    // Each purchase grants 20 minutes of viewing
    const VIEWING_WINDOW_MINUTES = 20;
    const existingPurchase = await db.execute(sql`
      SELECT id, created_at FROM live_stream_purchases
      WHERE stream_id = ${streamId}
        AND buyer_id = ${user.id}
        AND created_at > NOW() - INTERVAL '${sql.raw(String(VIEWING_WINDOW_MINUTES))} minutes'
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (existingPurchase.length > 0) {
      // Still within viewing window — issue a fresh viewer token
      const purchase = existingPurchase[0] as Record<string, unknown>;
      const token = await generateViewerToken(stream.id, user.id, username);
      return NextResponse.json({
        token,
        livekit_url: LIVEKIT_URL,
        purchased_at: purchase.created_at,
        viewing_window_minutes: VIEWING_WINDOW_MINUTES,
      });
    }

    // Must pay: atomic wallet debit (WHERE balance_usdc >= amount)
    const ticketPrice = stream.ticket_price as number;

    const debitResult = await db
      .update(walletsTable)
      .set({
        balance_usdc: sql`${walletsTable.balance_usdc} - ${ticketPrice}`,
        updated_at: new Date(),
      })
      .where(
        sql`${walletsTable.user_id} = ${user.id}
            AND ${walletsTable.balance_usdc} >= ${ticketPrice}`,
      )
      .returning();

    if (debitResult.length === 0) {
      return NextResponse.json(
        { error: "Insufficient balance", code: "INSUFFICIENT_BALANCE" },
        { status: 402 },
      );
    }

    const buyerWallet = debitResult[0];

    // Record buyer debit transaction (raw SQL — "stream_ticket" type not in Drizzle enum)
    await db.execute(sql`
      INSERT INTO wallet_transactions (wallet_id, user_id, type, amount_usdc, balance_after, description, reference_id, related_user_id)
      VALUES (
        ${buyerWallet.id}, ${user.id}, 'stream_ticket', ${-ticketPrice},
        ${buyerWallet.balance_usdc}, ${"Stream ticket: \"" + stream.title + "\""}, ${streamId}, ${stream.creator_id}
      )
    `);

    // Record purchase
    const purchaseTx = crypto.randomUUID();
    await db.execute(sql`
      INSERT INTO live_stream_purchases (stream_id, buyer_id, amount_usdc, payment_tx)
      VALUES (${streamId}, ${user.id}, ${ticketPrice}, ${purchaseTx})
    `);

    // Credit creator (95%)
    const platformFee = Math.round((ticketPrice * PLATFORM_FEE_PERCENT) / 100);
    const creatorAmount = ticketPrice - platformFee;

    // Ensure creator wallet exists
    const existingCreatorWallet = await db
      .select()
      .from(walletsTable)
      .where(eq(walletsTable.user_id, stream.creator_id))
      .limit(1);

    if (existingCreatorWallet.length === 0) {
      await db
        .insert(walletsTable)
        .values({ user_id: stream.creator_id, balance_usdc: 0 })
        .returning();
    }

    // Atomic credit to creator wallet
    const [updatedCreatorWallet] = await db
      .update(walletsTable)
      .set({
        balance_usdc: sql`${walletsTable.balance_usdc} + ${creatorAmount}`,
        updated_at: new Date(),
      })
      .where(eq(walletsTable.user_id, stream.creator_id))
      .returning();

    if (updatedCreatorWallet) {
      const feeDescription = `Stream ticket sale: "${stream.title}" (5% fee: $${(platformFee / 100).toFixed(2)})`;

      // Creator earnings transaction (raw SQL — "stream_ticket_received" type not in Drizzle enum)
      await db.execute(sql`
        INSERT INTO wallet_transactions (wallet_id, user_id, type, amount_usdc, balance_after, description, reference_id, related_user_id)
        VALUES (
          ${updatedCreatorWallet.id}, ${stream.creator_id}, 'stream_ticket_received', ${creatorAmount},
          ${updatedCreatorWallet.balance_usdc}, ${feeDescription}, ${purchaseTx}, ${user.id}
        )
      `);

      // Platform fee transaction record
      await db.insert(walletTransactionsTable).values({
        wallet_id: updatedCreatorWallet.id,
        user_id: stream.creator_id,
        type: "platform_fee",
        amount_usdc: -platformFee,
        balance_after: updatedCreatorWallet.balance_usdc,
        description: `Platform fee (10%) on stream ticket sale`,
        reference_id: purchaseTx,
        related_user_id: user.id,
      });
    }

    // Update creator total earnings
    await db
      .update(creatorProfilesTable)
      .set({
        total_earnings_usdc: sql`${creatorProfilesTable.total_earnings_usdc} + ${creatorAmount}`,
      })
      .where(eq(creatorProfilesTable.user_id, stream.creator_id));

    // Generate viewer token
    const token = await generateViewerToken(stream.id, user.id, username);
    const now = new Date().toISOString();

    return NextResponse.json({
      token,
      livekit_url: LIVEKIT_URL,
      purchased_at: now,
      viewing_window_minutes: VIEWING_WINDOW_MINUTES,
    });
  } catch (err) {
    console.error("POST /api/streams/[id]/join error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
