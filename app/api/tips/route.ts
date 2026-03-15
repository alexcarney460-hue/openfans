export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import {
  tipsTable,
  usersTable,
  postsTable,
  creatorProfilesTable,
  walletsTable,
  walletTransactionsTable,
} from "@/utils/db/schema";
import { eq, sql } from "drizzle-orm";
import { getAuthenticatedUser } from "@/utils/api/auth";
import { verifyTransaction } from "@/utils/solana/verify";
import { createNotification } from "@/utils/notifications";
import { sendNewTipEmail } from "@/utils/email";
import { isValidAmount } from "@/utils/validation";
import { checkRateLimit, getRateLimitKey } from "@/utils/rate-limit";
import { processReferralCommission } from "@/utils/referral-commission";
import { getCreatorFeeConfig, calculateFeeSplit } from "@/utils/fees";

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

    // Rate limit: 10 requests per minute per user (financial endpoint)
    const rateLimited = await checkRateLimit(request, getRateLimitKey(request, user.id), "tips", 10, 60_000);
    if (rateLimited) return rateLimited;

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

    if (typeof amount_usdc !== "number" || !isValidAmount(amount_usdc)) {
      return NextResponse.json(
        { error: "amount_usdc must be a positive integer not exceeding 1000000 (i.e. $10,000)", code: "INVALID_AMOUNT" },
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

    // Verify the Solana transaction on-chain against the PLATFORM wallet
    const platformWallet = process.env.NEXT_PUBLIC_PLATFORM_WALLET || "";
    if (!platformWallet) {
      return NextResponse.json(
        { error: "Platform wallet not configured", code: "CONFIG_ERROR" },
        { status: 500 },
      );
    }

    const verification = await verifyTransaction(
      payment_tx.trim(),
      amount_usdc,
      platformWallet,
    );

    if (!verification.verified) {
      return NextResponse.json(
        { error: verification.error ?? "Transaction verification failed", code: "INVALID_TX" },
        { status: 400 },
      );
    }

    // Look up creator's fee rate (adult = 10%, non-adult = 5%)
    const feeConfig = await getCreatorFeeConfig(creator_id);

    // Calculate platform fee and creator share
    const { platformFee, creatorAmount } = calculateFeeSplit(amount_usdc, feeConfig.feePercent);

    // Wrap tip insert + wallet credit + transaction records + earnings update
    // in a single database transaction to prevent double-spend.
    let newTip;
    try {
      newTip = await db.transaction(async (tx) => {
        // Check global transaction uniqueness (cross-table replay prevention)
        const txUsed = await tx.execute(sql`
          SELECT payment_tx FROM used_payment_transactions WHERE payment_tx = ${payment_tx.trim()}
        `);
        if ((txUsed as unknown as Array<unknown>).length > 0) {
          throw new Error("DUPLICATE_TX");
        }
        await tx.execute(sql`
          INSERT INTO used_payment_transactions (payment_tx, type, user_id) VALUES (${payment_tx.trim()}, 'tip', ${user.id})
        `);

        // Insert tip record inside the transaction
        const [tip] = await tx
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

        // Get or create creator wallet, then credit with creatorAmount
        const existingCreatorWallet = await tx
          .select()
          .from(walletsTable)
          .where(eq(walletsTable.user_id, creator_id))
          .limit(1);

        let creatorWallet = existingCreatorWallet[0];
        if (!creatorWallet) {
          const [newWallet] = await tx
            .insert(walletsTable)
            .values({ user_id: creator_id, balance_usdc: 0 })
            .returning();
          creatorWallet = newWallet;
        }

        // Atomic credit to creator wallet
        const [updatedCreatorWallet] = await tx
          .update(walletsTable)
          .set({
            balance_usdc: sql`${walletsTable.balance_usdc} + ${creatorAmount}`,
            updated_at: new Date(),
          })
          .where(eq(walletsTable.user_id, creator_id))
          .returning();

        if (!updatedCreatorWallet) {
          throw new Error("Failed to credit creator wallet");
        }

        // Record wallet transaction for creator
        await tx.insert(walletTransactionsTable).values({
          wallet_id: updatedCreatorWallet.id,
          user_id: creator_id,
          type: "tip_received",
          amount_usdc: creatorAmount,
          balance_after: updatedCreatorWallet.balance_usdc,
          description: `Tip received (${feeConfig.feePercent}% fee: $${(platformFee / 100).toFixed(2)})`,
          reference_id: payment_tx.trim(),
          related_user_id: user.id,
        });

        // Record platform fee transaction
        await tx.insert(walletTransactionsTable).values({
          wallet_id: updatedCreatorWallet.id,
          user_id: creator_id,
          type: "platform_fee",
          amount_usdc: -platformFee,
          balance_after: updatedCreatorWallet.balance_usdc,
          description: `Platform fee (${feeConfig.feePercent}%) on tip`,
          reference_id: payment_tx.trim(),
          related_user_id: user.id,
        });

        // Update creator's total_earnings_usdc
        await tx
          .update(creatorProfilesTable)
          .set({
            total_earnings_usdc: sql`${creatorProfilesTable.total_earnings_usdc} + ${creatorAmount}`,
          })
          .where(eq(creatorProfilesTable.user_id, creator_id));

        return tip;
      });
    } catch (err) {
      if (err instanceof Error && err.message === "DUPLICATE_TX") {
        return NextResponse.json(
          { error: "This transaction has already been used", code: "DUPLICATE_TX" },
          { status: 409 },
        );
      }
      throw err;
    }

    // Process referral commission if the creator was referred by someone
    processReferralCommission(
      creator_id,
      "tip",
      creatorAmount,
      payment_tx.trim(),
      user.id,
    );

    // Notify the creator about the tip
    const tipperInfo = await db
      .select({ display_name: usersTable.display_name })
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .limit(1);
    const tipperName = tipperInfo[0]?.display_name ?? "Someone";
    const tipDollars = (creatorAmount / 100).toFixed(2);

    createNotification(
      creator_id,
      "new_tip",
      "You received a tip!",
      `${tipperName} tipped you $${tipDollars} USDC.`,
      String(newTip.id),
    );

    // Send email notification to the creator (fire-and-forget)
    const creatorEmail = await db
      .select({ email: usersTable.email })
      .from(usersTable)
      .where(eq(usersTable.id, creator_id))
      .limit(1);
    if (creatorEmail[0]?.email) {
      sendNewTipEmail(creatorEmail[0].email, tipperInfo[0]?.display_name ?? "Someone", tipDollars);
    }

    return NextResponse.json({ data: newTip }, { status: 201 });
  } catch (error) {
    console.error("POST /api/tips error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
