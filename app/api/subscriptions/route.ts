export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import {
  subscriptionsTable,
  usersTable,
  creatorProfilesTable,
} from "@/utils/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getAuthenticatedUser } from "@/utils/api/auth";
import { verifyTransaction } from "@/utils/solana/verify";
import { createNotification } from "@/utils/notifications";
import { isValidAmount } from "@/utils/validation";
import { checkRateLimit, getRateLimitKey } from "@/utils/rate-limit";

const VALID_TIERS = ["basic", "premium", "vip"] as const;
type SubscriptionTier = (typeof VALID_TIERS)[number];

/**
 * GET /api/subscriptions
 * List the authenticated user's active subscriptions.
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const subs = await db
      .select({
        id: subscriptionsTable.id,
        creator_id: subscriptionsTable.creator_id,
        tier: subscriptionsTable.tier,
        price_usdc: subscriptionsTable.price_usdc,
        status: subscriptionsTable.status,
        started_at: subscriptionsTable.started_at,
        expires_at: subscriptionsTable.expires_at,
        created_at: subscriptionsTable.created_at,
        // Creator info
        creator_username: usersTable.username,
        creator_display_name: usersTable.display_name,
        creator_avatar_url: usersTable.avatar_url,
      })
      .from(subscriptionsTable)
      .innerJoin(usersTable, eq(subscriptionsTable.creator_id, usersTable.id))
      .where(
        and(
          eq(subscriptionsTable.subscriber_id, user.id),
          eq(subscriptionsTable.status, "active"),
        ),
      )
      .orderBy(desc(subscriptionsTable.created_at));

    return NextResponse.json({ data: subs });
  } catch (error) {
    console.error("GET /api/subscriptions error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/subscriptions
 * Create a subscription after payment is verified.
 *
 * Body:
 *   - creator_id: string (required)
 *   - tier: "basic" | "premium" | "vip" (required)
 *   - payment_tx: string (Solana transaction signature, required)
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    // Rate limit: 10 requests per minute per user (financial endpoint)
    const rateLimited = checkRateLimit(request, getRateLimitKey(request, user.id), "subscriptions", 10, 60_000);
    if (rateLimited) return rateLimited;

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body", code: "INVALID_BODY" },
        { status: 400 },
      );
    }

    const { creator_id, tier, payment_tx } = body;

    // Validate required fields
    if (!creator_id || typeof creator_id !== "string") {
      return NextResponse.json(
        { error: "creator_id is required", code: "MISSING_CREATOR_ID" },
        { status: 400 },
      );
    }

    if (!tier || !VALID_TIERS.includes(tier)) {
      return NextResponse.json(
        {
          error: `tier must be one of: ${VALID_TIERS.join(", ")}`,
          code: "INVALID_TIER",
        },
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
      .select({ id: subscriptionsTable.id })
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.payment_tx, payment_tx.trim()))
      .limit(1);

    if (existingTx.length > 0) {
      return NextResponse.json(
        { error: "This transaction has already been used", code: "DUPLICATE_TX" },
        { status: 409 },
      );
    }

    // Cannot subscribe to yourself
    if (creator_id === user.id) {
      return NextResponse.json(
        { error: "Cannot subscribe to yourself", code: "SELF_SUBSCRIBE" },
        { status: 400 },
      );
    }

    // Verify creator exists and get their profile for pricing
    const creatorProfile = await db
      .select({
        user_id: creatorProfilesTable.user_id,
        subscription_price_usdc: creatorProfilesTable.subscription_price_usdc,
        payout_wallet: creatorProfilesTable.payout_wallet,
      })
      .from(creatorProfilesTable)
      .where(eq(creatorProfilesTable.user_id, creator_id))
      .limit(1);

    if (creatorProfile.length === 0) {
      return NextResponse.json(
        { error: "Creator not found", code: "CREATOR_NOT_FOUND" },
        { status: 404 },
      );
    }

    // Check for existing active subscription
    const existingSub = await db
      .select({ id: subscriptionsTable.id })
      .from(subscriptionsTable)
      .where(
        and(
          eq(subscriptionsTable.subscriber_id, user.id),
          eq(subscriptionsTable.creator_id, creator_id),
          eq(subscriptionsTable.status, "active"),
        ),
      )
      .limit(1);

    if (existingSub.length > 0) {
      return NextResponse.json(
        {
          error: "You already have an active subscription to this creator",
          code: "ALREADY_SUBSCRIBED",
        },
        { status: 409 },
      );
    }

    // Validate subscription price is within safe bounds
    const priceUsdc = creatorProfile[0].subscription_price_usdc;
    if (!isValidAmount(priceUsdc)) {
      return NextResponse.json(
        { error: "Subscription price is outside the valid range", code: "INVALID_AMOUNT" },
        { status: 400 },
      );
    }

    // Verify the Solana transaction on-chain
    const recipientWallet = creatorProfile[0].payout_wallet || "";
    const verification = await verifyTransaction(
      payment_tx.trim(),
      priceUsdc,
      recipientWallet,
    );

    if (!verification.verified) {
      return NextResponse.json(
        { error: verification.error ?? "Transaction verification failed", code: "INVALID_TX" },
        { status: 400 },
      );
    }

    // Set expiry to 30 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const newSub = await db
      .insert(subscriptionsTable)
      .values({
        subscriber_id: user.id,
        creator_id,
        tier: tier as SubscriptionTier,
        price_usdc: priceUsdc,
        payment_tx: payment_tx.trim(),
        status: "active",
        expires_at: expiresAt,
      })
      .returning();

    // Notify the creator about the new subscriber
    const subscriberInfo = await db
      .select({ display_name: usersTable.display_name })
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .limit(1);
    const subscriberName = subscriberInfo[0]?.display_name ?? "Someone";

    createNotification(
      creator_id,
      "new_subscriber",
      "New subscriber!",
      `${subscriberName} just subscribed to your content.`,
      String(newSub[0].id),
    );

    return NextResponse.json({ data: newSub[0] }, { status: 201 });
  } catch (error) {
    console.error("POST /api/subscriptions error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
