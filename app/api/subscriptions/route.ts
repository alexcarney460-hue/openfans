export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import {
  subscriptionsTable,
  usersTable,
  creatorProfilesTable,
  walletsTable,
  walletTransactionsTable,
  promotionsTable,
} from "@/utils/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { getAuthenticatedUser } from "@/utils/api/auth";
import { verifyTransaction } from "@/utils/solana/verify";
import { createNotification } from "@/utils/notifications";
import { sendNewSubscriberEmail } from "@/utils/email";
import { isValidAmount } from "@/utils/validation";
import { checkRateLimit, getRateLimitKey } from "@/utils/rate-limit";
import { processReferralCommission } from "@/utils/referral-commission";
import { getCreatorFeeConfig, calculateFeeSplit } from "@/utils/fees";

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
        auto_renew: subscriptionsTable.auto_renew,
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
    const rateLimited = await checkRateLimit(request, getRateLimitKey(request, user.id), "subscriptions", 10, 60_000);
    if (rateLimited) return rateLimited;

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body", code: "INVALID_BODY" },
        { status: 400 },
      );
    }

    const { creator_id, tier, payment_tx, promo_code } = body;

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
        premium_price_usdc: creatorProfilesTable.premium_price_usdc,
        vip_price_usdc: creatorProfilesTable.vip_price_usdc,
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

    // Validate that the requested tier is offered by the creator
    const profile = creatorProfile[0];
    const tierPriceMap: Record<string, number | null> = {
      basic: profile.subscription_price_usdc,
      premium: profile.premium_price_usdc,
      vip: profile.vip_price_usdc,
    };

    const tierPrice = tierPriceMap[tier];
    if (tierPrice === null || tierPrice === undefined) {
      return NextResponse.json(
        { error: `This creator does not offer a ${tier} tier`, code: "TIER_NOT_OFFERED" },
        { status: 400 },
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

    // Use the tier-specific price
    const basePriceUsdc = tierPrice;
    if (!isValidAmount(basePriceUsdc)) {
      return NextResponse.json(
        { error: "Subscription price is outside the valid range", code: "INVALID_AMOUNT" },
        { status: 400 },
      );
    }

    // ── Promo code validation ──────────────────────────────────────────
    let validatedPromo: {
      id: number;
      type: "discount" | "free_trial";
      discount_percent: number | null;
      trial_days: number | null;
    } | null = null;

    if (promo_code && typeof promo_code === "string" && promo_code.trim().length > 0) {
      const normalizedCode = promo_code.trim().toUpperCase();

      const promos = await db
        .select()
        .from(promotionsTable)
        .where(
          and(
            eq(promotionsTable.creator_id, creator_id),
            eq(promotionsTable.code, normalizedCode),
          ),
        )
        .limit(1);

      if (promos.length === 0) {
        return NextResponse.json(
          { error: "Invalid promo code", code: "INVALID_PROMO" },
          { status: 400 },
        );
      }

      const promo = promos[0];

      if (!promo.is_active) {
        return NextResponse.json(
          { error: "This promo code is no longer active", code: "PROMO_INACTIVE" },
          { status: 400 },
        );
      }

      if (promo.expires_at && new Date(promo.expires_at).getTime() < Date.now()) {
        return NextResponse.json(
          { error: "This promo code has expired", code: "PROMO_EXPIRED" },
          { status: 400 },
        );
      }

      if (promo.max_uses !== null && promo.current_uses >= promo.max_uses) {
        return NextResponse.json(
          { error: "This promo code has reached its maximum uses", code: "PROMO_MAXED" },
          { status: 400 },
        );
      }

      validatedPromo = {
        id: promo.id,
        type: promo.type as "discount" | "free_trial",
        discount_percent: promo.discount_percent,
        trial_days: promo.trial_days,
      };
    }

    // ── Calculate effective price and expiry ────────────────────────────
    const isFreeTrial = validatedPromo?.type === "free_trial";
    let priceUsdc: number;
    const expiresAt = new Date();

    if (isFreeTrial) {
      priceUsdc = 0;
      const trialDays = validatedPromo!.trial_days ?? 7;
      expiresAt.setDate(expiresAt.getDate() + trialDays);
    } else if (validatedPromo?.type === "discount" && validatedPromo.discount_percent) {
      priceUsdc = Math.round(basePriceUsdc * (100 - validatedPromo.discount_percent) / 100);
      expiresAt.setDate(expiresAt.getDate() + 30);
    } else {
      priceUsdc = basePriceUsdc;
      expiresAt.setDate(expiresAt.getDate() + 30);
    }

    // ── On-chain verification (skip for free trials) ───────────────────
    if (!isFreeTrial) {
      const platformWallet = process.env.NEXT_PUBLIC_PLATFORM_WALLET || "";
      if (!platformWallet) {
        return NextResponse.json(
          { error: "Platform wallet not configured", code: "CONFIG_ERROR" },
          { status: 500 },
        );
      }

      const verification = await verifyTransaction(
        payment_tx.trim(),
        priceUsdc,
        platformWallet,
      );

      if (!verification.verified) {
        return NextResponse.json(
          { error: verification.error ?? "Transaction verification failed", code: "INVALID_TX" },
          { status: 400 },
        );
      }
    }

    // Look up creator's fee rate BEFORE transaction (read-only, safe outside tx)
    const feeConfig = await getCreatorFeeConfig(creator_id);
    const { platformFee, creatorAmount } = priceUsdc > 0
      ? calculateFeeSplit(priceUsdc, feeConfig.feePercent)
      : { platformFee: 0, creatorAmount: 0 };

    // Wrap subscription insert + promo counter + wallet credit in a single transaction
    let newSub;
    try {
      newSub = await db.transaction(async (tx) => {
      // Check global transaction uniqueness (cross-table replay prevention)
      const txUsed = await tx.execute(sql`
        SELECT payment_tx FROM used_payment_transactions WHERE payment_tx = ${payment_tx.trim()}
      `);
      if ((txUsed as unknown as Array<unknown>).length > 0) {
        throw new Error("DUPLICATE_TX");
      }
      await tx.execute(sql`
        INSERT INTO used_payment_transactions (payment_tx, type, user_id) VALUES (${payment_tx.trim()}, 'subscription', ${user.id})
      `);

      // 1. Insert subscription record
      const [sub] = await tx
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

      // 2. Increment promo usage counter atomically
      if (validatedPromo) {
        const lockedRows = await tx.execute(sql`
          SELECT current_uses, max_uses FROM promotions WHERE id = ${validatedPromo.id} FOR UPDATE
        `);
        const lockedPromo = lockedRows[0] as { current_uses: number; max_uses: number | null } | undefined;
        if (lockedPromo && lockedPromo.max_uses !== null && lockedPromo.current_uses >= lockedPromo.max_uses) {
          throw new Error("PROMO_MAXED");
        }
        await tx.update(promotionsTable).set({ current_uses: sql`current_uses + 1` }).where(eq(promotionsTable.id, validatedPromo.id));
      }

      // 3. Credit creator wallet (if paid subscription)
      if (creatorAmount > 0) {
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
          type: "subscription_received",
          amount_usdc: creatorAmount,
          balance_after: updatedCreatorWallet.balance_usdc,
          description: `Subscription received (${feeConfig.feePercent}% fee: $${(platformFee / 100).toFixed(2)})`,
          reference_id: payment_tx.trim(),
          related_user_id: user.id,
        });

        // Record platform fee transaction
        if (platformFee > 0) {
          await tx.insert(walletTransactionsTable).values({
            wallet_id: updatedCreatorWallet.id,
            user_id: creator_id,
            type: "platform_fee",
            amount_usdc: -platformFee,
            balance_after: updatedCreatorWallet.balance_usdc,
            description: `Platform fee (${feeConfig.feePercent}%) on subscription`,
            reference_id: payment_tx.trim(),
            related_user_id: user.id,
          });
        }

        // Update creator's total_earnings_usdc
        await tx
          .update(creatorProfilesTable)
          .set({
            total_earnings_usdc: sql`${creatorProfilesTable.total_earnings_usdc} + ${creatorAmount}`,
          })
          .where(eq(creatorProfilesTable.user_id, creator_id));
      }

      return sub;
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
    if (creatorAmount > 0) {
      processReferralCommission(
        creator_id,
        "subscription",
        creatorAmount,
        payment_tx.trim(),
        user.id,
      );
    }

    // Notify the creator about the new subscriber
    const subscriberInfo = await db
      .select({ display_name: usersTable.display_name, username: usersTable.username })
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .limit(1);
    const subscriberName = subscriberInfo[0]?.display_name ?? "Someone";
    const subscriberUsername = subscriberInfo[0]?.username ?? "someone";

    createNotification(
      creator_id,
      "new_subscriber",
      "New subscriber!",
      `${subscriberName} just subscribed to your content.`,
      String(newSub.id),
    );

    // Send email notification to the creator (fire-and-forget)
    const creatorInfo = await db
      .select({ email: usersTable.email })
      .from(usersTable)
      .where(eq(usersTable.id, creator_id))
      .limit(1);
    if (creatorInfo[0]?.email) {
      sendNewSubscriberEmail(creatorInfo[0].email, subscriberUsername);
    }

    return NextResponse.json({ data: newSub }, { status: 201 });
  } catch (error) {
    console.error("POST /api/subscriptions error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
