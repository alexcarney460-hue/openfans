export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import {
  postsTable,
  ppvPurchasesTable,
  creatorProfilesTable,
  notificationsTable,
  usersTable,
  walletsTable,
  walletTransactionsTable,
} from "@/utils/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getAuthenticatedUser } from "@/utils/api/auth";
import { verifyTransaction } from "@/utils/solana/verify";
import { sendPpvPurchaseEmail } from "@/utils/email";
import { checkRateLimit, getRateLimitKey } from "@/utils/rate-limit";
import { getCreatorFeeConfig, calculateFeeSplit } from "@/utils/fees";

/**
 * POST /api/posts/[postId]/unlock
 * Record a PPV purchase after on-chain USDC payment to the platform wallet.
 *
 * The buyer pays on-chain to the platform wallet. The platform credits
 * the creator's internal wallet after deducting a dynamic fee based on
 * content type (5% for non-adult, 10% for adult creators).
 * The buyer's internal wallet is NOT debited — they already paid on-chain.
 *
 * Body:
 *   - payment_tx: string (Solana transaction signature)
 *
 * Returns the full unlocked post on success.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    // Rate limit: 10 requests per minute per user (financial endpoint)
    const rateLimited = await checkRateLimit(request, getRateLimitKey(request, user.id), "posts/unlock", 10, 60_000);
    if (rateLimited) return rateLimited;

    const postId = parseInt(params.id, 10);
    if (isNaN(postId)) {
      return NextResponse.json(
        { error: "Invalid post ID", code: "INVALID_POST_ID" },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body", code: "INVALID_BODY" },
        { status: 400 },
      );
    }

    const { payment_tx } = body;
    if (!payment_tx || typeof payment_tx !== "string" || payment_tx.trim().length === 0) {
      return NextResponse.json(
        { error: "payment_tx is required", code: "MISSING_PAYMENT_TX" },
        { status: 400 },
      );
    }

    // Check for transaction replay (duplicate payment_tx)
    const existingTx = await db
      .select({ id: ppvPurchasesTable.id })
      .from(ppvPurchasesTable)
      .where(eq(ppvPurchasesTable.payment_tx, payment_tx.trim()))
      .limit(1);

    if (existingTx.length > 0) {
      return NextResponse.json(
        { error: "This transaction has already been used", code: "DUPLICATE_TX" },
        { status: 409 },
      );
    }

    // Fetch the post
    const postResults = await db
      .select()
      .from(postsTable)
      .where(eq(postsTable.id, Number(postId)))
      .limit(1);

    if (postResults.length === 0) {
      return NextResponse.json(
        { error: "Post not found", code: "POST_NOT_FOUND" },
        { status: 404 },
      );
    }

    const post = postResults[0];

    if (post.ppv_price_usdc === null) {
      return NextResponse.json(
        { error: "This post is not available for PPV purchase", code: "NOT_PPV_POST" },
        { status: 400 },
      );
    }

    // Check if already purchased
    const existingPurchase = await db
      .select({ id: ppvPurchasesTable.id })
      .from(ppvPurchasesTable)
      .where(
        and(
          eq(ppvPurchasesTable.post_id, postId),
          eq(ppvPurchasesTable.buyer_id, user.id),
        ),
      )
      .limit(1);

    if (existingPurchase.length > 0) {
      return NextResponse.json(
        { error: "You have already purchased this post", code: "ALREADY_PURCHASED" },
        { status: 409 },
      );
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
      post.ppv_price_usdc,
      platformWallet,
    );

    if (!verification.verified) {
      return NextResponse.json(
        { error: verification.error ?? "Transaction verification failed", code: "INVALID_TX" },
        { status: 400 },
      );
    }

    // Look up creator's fee rate (adult = 10%, non-adult = 5%)
    const feeConfig = await getCreatorFeeConfig(post.creator_id);

    // Calculate platform fee and creator share
    const { platformFee, creatorAmount } = calculateFeeSplit(post.ppv_price_usdc, feeConfig.feePercent);

    // Wrap PPV purchase insert + wallet credit + transaction records + earnings
    // update in a single database transaction to prevent double-spend.
    let purchase;
    try {
      purchase = await db.transaction(async (tx) => {
        // Check global transaction uniqueness (cross-table replay prevention)
        const txUsed = await tx.execute(sql`
          SELECT payment_tx FROM used_payment_transactions WHERE payment_tx = ${payment_tx.trim()}
        `);
        if ((txUsed as unknown as Array<unknown>).length > 0) {
          throw new Error("DUPLICATE_TX");
        }
        await tx.execute(sql`
          INSERT INTO used_payment_transactions (payment_tx, type, user_id) VALUES (${payment_tx.trim()}, 'ppv_unlock', ${user.id})
        `);

        // Record the PPV purchase inside the transaction
        const ppvResult = await tx.execute(sql`
          INSERT INTO ppv_purchases (post_id, buyer_id, amount_usdc, payment_tx)
          VALUES (${Number(postId)}, ${user.id}, ${post.ppv_price_usdc}, ${payment_tx.trim()})
          RETURNING *
        `);
        const ppvPurchase = (ppvResult as unknown as Array<Record<string, unknown>>)[0];

        // Get or create creator wallet, then credit with creatorAmount
        const existingCreatorWallet = await tx
          .select()
          .from(walletsTable)
          .where(eq(walletsTable.user_id, post.creator_id))
          .limit(1);

        let creatorWallet = existingCreatorWallet[0];
        if (!creatorWallet) {
          const [newWallet] = await tx
            .insert(walletsTable)
            .values({ user_id: post.creator_id, balance_usdc: 0 })
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
          .where(eq(walletsTable.user_id, post.creator_id))
          .returning();

        if (!updatedCreatorWallet) {
          throw new Error("Failed to credit creator wallet");
        }

        // Record wallet transaction for creator
        await tx.insert(walletTransactionsTable).values({
          wallet_id: updatedCreatorWallet.id,
          user_id: post.creator_id,
          type: "ppv_received",
          amount_usdc: creatorAmount,
          balance_after: updatedCreatorWallet.balance_usdc,
          description: `PPV sale: "${post.title ?? "Untitled"}" (${feeConfig.feePercent}% fee: $${(platformFee / 100).toFixed(2)})`,
          reference_id: payment_tx.trim(),
          related_user_id: user.id,
        });

        // Record platform fee transaction
        await tx.insert(walletTransactionsTable).values({
          wallet_id: updatedCreatorWallet.id,
          user_id: post.creator_id,
          type: "platform_fee",
          amount_usdc: -platformFee,
          balance_after: updatedCreatorWallet.balance_usdc,
          description: `Platform fee (${feeConfig.feePercent}%) on PPV sale`,
          reference_id: payment_tx.trim(),
          related_user_id: user.id,
        });

        // Update creator's total_earnings_usdc
        await tx
          .update(creatorProfilesTable)
          .set({
            total_earnings_usdc: sql`${creatorProfilesTable.total_earnings_usdc} + ${creatorAmount}`,
          })
          .where(eq(creatorProfilesTable.user_id, post.creator_id));

        return ppvPurchase;
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

    // Send notification to the creator
    const ppvDollars = (post.ppv_price_usdc / 100).toFixed(2);
    await db.insert(notificationsTable).values({
      user_id: post.creator_id,
      type: "ppv_purchase",
      title: "New PPV Purchase",
      body: `Someone unlocked your post "${post.title ?? "Untitled"}" for $${ppvDollars}`,
      reference_id: String(purchase.id),
    });

    // Send email notification to the creator (fire-and-forget)
    const creatorInfo = await db
      .select({ email: usersTable.email })
      .from(usersTable)
      .where(eq(usersTable.id, post.creator_id))
      .limit(1);
    if (creatorInfo[0]?.email) {
      sendPpvPurchaseEmail(creatorInfo[0].email, post.title ?? "Untitled", ppvDollars);
    }

    // Return the full unlocked post
    return NextResponse.json({
      data: {
        ...post,
        is_locked: false,
        is_ppv: true,
        has_purchased: true,
      },
    });
  } catch (error) {
    console.error("POST /api/posts/[postId]/unlock error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
