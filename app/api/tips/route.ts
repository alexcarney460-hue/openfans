import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { tipsTable, usersTable, postsTable, creatorProfilesTable } from "@/utils/db/schema";
import { eq } from "drizzle-orm";
import { getAuthenticatedUser } from "@/utils/api/auth";
import { verifyTransaction } from "@/utils/solana/verify";
import { createNotification } from "@/utils/notifications";

/**
 * POST /api/tips
 * Send a tip to a creator, optionally on a specific post.
 *
 * Body:
 *   - creator_id: string (required)
 *   - post_id: number (optional)
 *   - amount_usdc: number (required, in cents, must be > 0)
 *   - payment_tx: string (required, Solana transaction signature)
 *   - message: string (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body", code: "INVALID_BODY" },
        { status: 400 },
      );
    }

    const { creator_id, post_id, amount_usdc, payment_tx, message } = body;

    // Validate required fields
    if (!creator_id || typeof creator_id !== "string") {
      return NextResponse.json(
        { error: "creator_id is required", code: "MISSING_CREATOR_ID" },
        { status: 400 },
      );
    }

    if (typeof amount_usdc !== "number" || amount_usdc <= 0) {
      return NextResponse.json(
        { error: "amount_usdc must be a positive number", code: "INVALID_AMOUNT" },
        { status: 400 },
      );
    }

    if (!payment_tx || typeof payment_tx !== "string" || payment_tx.trim().length === 0) {
      return NextResponse.json(
        { error: "payment_tx is required", code: "MISSING_PAYMENT_TX" },
        { status: 400 },
      );
    }

    // Check for transaction replay (duplicate payment_tx)
    const existingTx = await db
      .select({ id: tipsTable.id })
      .from(tipsTable)
      .where(eq(tipsTable.payment_tx, payment_tx.trim()))
      .limit(1);

    if (existingTx.length > 0) {
      return NextResponse.json(
        { error: "This transaction has already been used", code: "DUPLICATE_TX" },
        { status: 409 },
      );
    }

    // Cannot tip yourself
    if (creator_id === user.id) {
      return NextResponse.json(
        { error: "Cannot tip yourself", code: "SELF_TIP" },
        { status: 400 },
      );
    }

    // Verify creator exists
    const creatorResult = await db
      .select({
        id: usersTable.id,
        role: usersTable.role,
      })
      .from(usersTable)
      .where(eq(usersTable.id, creator_id))
      .limit(1);

    if (creatorResult.length === 0 || creatorResult[0].role !== "creator") {
      return NextResponse.json(
        { error: "Creator not found", code: "CREATOR_NOT_FOUND" },
        { status: 404 },
      );
    }

    // If post_id provided, verify it belongs to the creator
    if (post_id !== undefined && post_id !== null) {
      const parsedPostId = parseInt(String(post_id), 10);
      if (isNaN(parsedPostId)) {
        return NextResponse.json(
          { error: "Invalid post_id", code: "INVALID_POST_ID" },
          { status: 400 },
        );
      }

      const postResult = await db
        .select({ creator_id: postsTable.creator_id })
        .from(postsTable)
        .where(eq(postsTable.id, parsedPostId))
        .limit(1);

      if (postResult.length === 0) {
        return NextResponse.json(
          { error: "Post not found", code: "POST_NOT_FOUND" },
          { status: 404 },
        );
      }

      if (postResult[0].creator_id !== creator_id) {
        return NextResponse.json(
          { error: "Post does not belong to the specified creator", code: "POST_CREATOR_MISMATCH" },
          { status: 400 },
        );
      }
    }

    // Get creator wallet for verification
    const creatorProfile = await db
      .select({ payout_wallet: creatorProfilesTable.payout_wallet })
      .from(creatorProfilesTable)
      .where(eq(creatorProfilesTable.user_id, creator_id))
      .limit(1);

    const recipientWallet = creatorProfile[0]?.payout_wallet || "";

    // Verify the Solana transaction (placeholder)
    const isValid = await verifyTransaction(
      payment_tx.trim(),
      amount_usdc,
      recipientWallet,
    );

    if (!isValid) {
      return NextResponse.json(
        { error: "Transaction verification failed", code: "INVALID_TX" },
        { status: 400 },
      );
    }

    const newTip = await db
      .insert(tipsTable)
      .values({
        tipper_id: user.id,
        creator_id,
        post_id: post_id ? parseInt(String(post_id), 10) : null,
        amount_usdc,
        payment_tx: payment_tx.trim(),
        message: message ? String(message).slice(0, 500) : null,
      })
      .returning();

    // Notify the creator about the tip
    const tipperInfo = await db
      .select({ display_name: usersTable.display_name })
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .limit(1);
    const tipperName = tipperInfo[0]?.display_name ?? "Someone";
    const tipDollars = (amount_usdc / 100).toFixed(2);

    createNotification(
      creator_id,
      "new_tip",
      "You received a tip!",
      `${tipperName} tipped you $${tipDollars} USDC.`,
      String(newTip[0].id),
    );

    return NextResponse.json({ data: newTip[0] }, { status: 201 });
  } catch (error) {
    console.error("POST /api/tips error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
