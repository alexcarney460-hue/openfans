import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import {
  postsTable,
  ppvPurchasesTable,
  creatorProfilesTable,
  notificationsTable,
  walletsTable,
  walletTransactionsTable,
} from "@/utils/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getAuthenticatedUser } from "@/utils/api/auth";
import { verifyTransaction } from "@/utils/solana/verify";
import { checkRateLimit, getRateLimitKey } from "@/utils/rate-limit";

const PLATFORM_FEE_PERCENT = 5;

/**
 * POST /api/posts/[postId]/unlock
 * Record a PPV purchase after on-chain USDC payment.
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
    const rateLimited = checkRateLimit(request, getRateLimitKey(request, user.id), "posts/unlock", 10, 60_000);
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
      .where(eq(postsTable.id, postId))
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

    // Get creator wallet for on-chain verification
    const creatorProfile = await db
      .select({ payout_wallet: creatorProfilesTable.payout_wallet })
      .from(creatorProfilesTable)
      .where(eq(creatorProfilesTable.user_id, post.creator_id))
      .limit(1);

    const recipientWallet = creatorProfile[0]?.payout_wallet || "";

    // Verify the Solana transaction on-chain
    const verification = await verifyTransaction(
      payment_tx.trim(),
      post.ppv_price_usdc,
      recipientWallet,
    );

    if (!verification.verified) {
      return NextResponse.json(
        { error: verification.error ?? "Transaction verification failed", code: "INVALID_TX" },
        { status: 400 },
      );
    }

    // Record the PPV purchase
    const [purchase] = await db
      .insert(ppvPurchasesTable)
      .values({
        post_id: postId,
        buyer_id: user.id,
        amount_usdc: post.ppv_price_usdc,
        payment_tx: payment_tx.trim(),
      })
      .returning();

    // Atomic wallet balance updates for buyer and creator
    // Buyer: ppv_charge (debit) -- atomic debit with insufficient-balance guard
    const buyerUpdated = await db
      .update(walletsTable)
      .set({
        balance_usdc: sql`${walletsTable.balance_usdc} - ${post.ppv_price_usdc}`,
        updated_at: new Date(),
      })
      .where(
        sql`${walletsTable.user_id} = ${user.id} AND ${walletsTable.balance_usdc} >= ${post.ppv_price_usdc}`,
      )
      .returning();

    if (buyerUpdated.length === 0) {
      // Rollback the PPV purchase record since payment failed
      await db
        .delete(ppvPurchasesTable)
        .where(eq(ppvPurchasesTable.id, purchase.id));

      return NextResponse.json(
        {
          error: "Insufficient wallet balance for this purchase",
          code: "INSUFFICIENT_BALANCE",
        },
        { status: 400 },
      );
    }

    await db.insert(walletTransactionsTable).values({
      wallet_id: buyerUpdated[0].id,
      user_id: user.id,
      type: "ppv_charge",
      amount_usdc: -post.ppv_price_usdc,
      balance_after: buyerUpdated[0].balance_usdc,
      description: `PPV unlock: "${post.title ?? "Untitled"}"`,
      reference_id: payment_tx.trim(),
      related_user_id: post.creator_id,
    });

    // Creator: ppv_received (credit, minus platform fee) -- atomic credit
    const platformFee = Math.round(
      (post.ppv_price_usdc * PLATFORM_FEE_PERCENT) / 100,
    );
    const creatorAmount = post.ppv_price_usdc - platformFee;

    const creatorUpdated = await db
      .update(walletsTable)
      .set({
        balance_usdc: sql`${walletsTable.balance_usdc} + ${creatorAmount}`,
        updated_at: new Date(),
      })
      .where(eq(walletsTable.user_id, post.creator_id))
      .returning();

    if (creatorUpdated.length > 0) {
      await db.insert(walletTransactionsTable).values({
        wallet_id: creatorUpdated[0].id,
        user_id: post.creator_id,
        type: "ppv_received",
        amount_usdc: creatorAmount,
        balance_after: creatorUpdated[0].balance_usdc,
        description: `PPV sale: "${post.title ?? "Untitled"}" (5% fee: $${(platformFee / 100).toFixed(2)})`,
        reference_id: payment_tx.trim(),
        related_user_id: user.id,
      });
    }

    // Send notification to the creator
    await db.insert(notificationsTable).values({
      user_id: post.creator_id,
      type: "ppv_purchase",
      title: "New PPV Purchase",
      body: `Someone unlocked your post "${post.title ?? "Untitled"}" for $${(post.ppv_price_usdc / 100).toFixed(2)}`,
      reference_id: String(purchase.id),
    });

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
