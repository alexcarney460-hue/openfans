import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import {
  postsTable,
  ppvPurchasesTable,
  notificationsTable,
  walletsTable,
  walletTransactionsTable,
} from "@/utils/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthenticatedUser } from "@/utils/api/auth";

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
  { params }: { params: { postId: string } },
) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const postId = parseInt(params.postId, 10);
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

    // Record wallet transactions for buyer and creator
    // Buyer: ppv_charge (debit)
    const buyerWallet = await db
      .select()
      .from(walletsTable)
      .where(eq(walletsTable.user_id, user.id))
      .limit(1);

    if (buyerWallet.length > 0) {
      const newBalance = buyerWallet[0].balance_usdc - post.ppv_price_usdc;
      await db.insert(walletTransactionsTable).values({
        wallet_id: buyerWallet[0].id,
        user_id: user.id,
        type: "ppv_charge",
        amount_usdc: -post.ppv_price_usdc,
        balance_after: newBalance,
        description: `PPV unlock: "${post.title ?? "Untitled"}"`,
        reference_id: payment_tx.trim(),
        related_user_id: post.creator_id,
      });
    }

    // Creator: ppv_received (credit, minus platform fee)
    const platformFee = Math.round(
      (post.ppv_price_usdc * PLATFORM_FEE_PERCENT) / 100,
    );
    const creatorAmount = post.ppv_price_usdc - platformFee;

    const creatorWallet = await db
      .select()
      .from(walletsTable)
      .where(eq(walletsTable.user_id, post.creator_id))
      .limit(1);

    if (creatorWallet.length > 0) {
      const newCreatorBalance = creatorWallet[0].balance_usdc + creatorAmount;
      await db.insert(walletTransactionsTable).values({
        wallet_id: creatorWallet[0].id,
        user_id: post.creator_id,
        type: "ppv_received",
        amount_usdc: creatorAmount,
        balance_after: newCreatorBalance,
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
