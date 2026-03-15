export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import {
  subscriptionsTable,
  walletsTable,
  walletTransactionsTable,
  creatorProfilesTable,
  usersTable,
} from "@/utils/db/schema";
import { eq, and, sql, lte, gte } from "drizzle-orm";
import { createNotification } from "@/utils/notifications";
import { processReferralCommission } from "@/utils/referral-commission";
import { getCreatorFeeConfig, calculateFeeSplit } from "@/utils/fees";

/**
 * GET /api/cron/renew-subscriptions
 *
 * Cron-compatible endpoint that processes subscription auto-renewals.
 * Finds active subscriptions expiring within the next 24 hours where
 * auto_renew=true, attempts to charge the subscriber's internal wallet
 * balance, and either extends or expires the subscription.
 *
 * Protected by CRON_SECRET to prevent unauthorized invocation.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find all active subscriptions expiring in the next 24 hours with auto_renew=true
    const expiringSubscriptions = await db
      .select({
        id: subscriptionsTable.id,
        subscriber_id: subscriptionsTable.subscriber_id,
        creator_id: subscriptionsTable.creator_id,
        price_usdc: subscriptionsTable.price_usdc,
        tier: subscriptionsTable.tier,
        expires_at: subscriptionsTable.expires_at,
      })
      .from(subscriptionsTable)
      .where(
        and(
          eq(subscriptionsTable.status, "active"),
          eq(subscriptionsTable.auto_renew, true),
          lte(subscriptionsTable.expires_at, next24Hours),
          gte(subscriptionsTable.expires_at, now),
        ),
      );

    const results = {
      processed: 0,
      renewed: 0,
      expired: 0,
      errors: 0,
    };

    for (const sub of expiringSubscriptions) {
      results.processed++;

      // Free trials ($0 subs) should not auto-renew — expire them instead
      if (sub.price_usdc === 0) {
        try {
          await expireSubscription(sub);
          results.expired++;
        } catch (error) {
          console.error(`Error expiring free trial subscription ${sub.id}:`, error);
          results.errors++;
        }
        continue;
      }

      try {
        await processRenewal(sub);
        results.renewed++;
      } catch (error) {
        // If processRenewal throws with a specific "insufficient_balance" marker,
        // treat as expired (already handled inside processRenewal).
        if (error instanceof InsufficientBalanceError) {
          results.expired++;
        } else {
          console.error(`Error processing renewal for subscription ${sub.id}:`, error);
          results.errors++;
        }
      }
    }

    // Also expire any subscriptions that are past their expires_at and still marked active
    // (safety net for subscriptions that slipped through)
    const expiredCount = await expireOverdueSubscriptions(now);
    results.expired += expiredCount;

    return NextResponse.json({
      success: true,
      results,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Cron renew-subscriptions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

class InsufficientBalanceError extends Error {
  constructor() {
    super("Insufficient balance");
    this.name = "InsufficientBalanceError";
  }
}

interface SubscriptionToRenew {
  id: number;
  subscriber_id: string;
  creator_id: string;
  price_usdc: number;
  tier: string;
  expires_at: Date;
}

/**
 * Process a single subscription renewal:
 * 1. Check subscriber wallet balance
 * 2. If sufficient: deduct, credit creator (minus fee), extend 30 days, notify
 * 3. If insufficient: mark expired, notify both parties
 */
async function processRenewal(sub: SubscriptionToRenew): Promise<void> {
  // Look up creator's fee rate before entering the transaction (read-only query)
  const feeConfig = await getCreatorFeeConfig(sub.creator_id);

  await db.transaction(async (tx) => {
    // Lock the subscription row to prevent concurrent processing / double-charge
    const lockedRows = await tx.execute(sql`
      SELECT * FROM subscriptions WHERE id = ${sub.id} FOR UPDATE
    `);
    const lockedSub = lockedRows[0];

    // Check it's still active and not already renewed
    if (!lockedSub || lockedSub.status !== "active") return;

    // Get subscriber wallet
    const subscriberWallets = await tx
      .select()
      .from(walletsTable)
      .where(eq(walletsTable.user_id, sub.subscriber_id))
      .limit(1);

    const subscriberWallet = subscriberWallets[0];

    // No wallet or insufficient balance -> expire
    if (!subscriberWallet || subscriberWallet.balance_usdc < sub.price_usdc) {
      await expireSubscription(sub, tx);
      throw new InsufficientBalanceError();
    }

    // Calculate fee split using creator's content-type-based rate
    const { platformFee, creatorAmount } = calculateFeeSplit(sub.price_usdc, feeConfig.feePercent);

    // Atomically deduct from subscriber wallet (with balance check to prevent race conditions)
    const [updatedSubscriberWallet] = await tx
      .update(walletsTable)
      .set({
        balance_usdc: sql`${walletsTable.balance_usdc} - ${sub.price_usdc}`,
        updated_at: new Date(),
      })
      .where(
        and(
          eq(walletsTable.user_id, sub.subscriber_id),
          gte(walletsTable.balance_usdc, sub.price_usdc),
        ),
      )
      .returning();

    // If the atomic update returned nothing, balance was insufficient (race condition)
    if (!updatedSubscriberWallet) {
      await expireSubscription(sub, tx);
      throw new InsufficientBalanceError();
    }

    // Record subscriber charge transaction
    await tx.insert(walletTransactionsTable).values({
      wallet_id: updatedSubscriberWallet.id,
      user_id: sub.subscriber_id,
      type: "subscription_charge",
      amount_usdc: -sub.price_usdc,
      balance_after: updatedSubscriberWallet.balance_usdc,
      description: `Auto-renewal: subscription to creator`,
      reference_id: String(sub.id),
      related_user_id: sub.creator_id,
    });

    // Credit creator wallet
    const existingCreatorWallet = await tx
      .select()
      .from(walletsTable)
      .where(eq(walletsTable.user_id, sub.creator_id))
      .limit(1);

    if (!existingCreatorWallet[0]) {
      await tx
        .insert(walletsTable)
        .values({ user_id: sub.creator_id, balance_usdc: 0 })
        .returning();
    }

    const [updatedCreatorWallet] = await tx
      .update(walletsTable)
      .set({
        balance_usdc: sql`${walletsTable.balance_usdc} + ${creatorAmount}`,
        updated_at: new Date(),
      })
      .where(eq(walletsTable.user_id, sub.creator_id))
      .returning();

    // Record creator received transaction
    if (updatedCreatorWallet) {
      await tx.insert(walletTransactionsTable).values({
        wallet_id: updatedCreatorWallet.id,
        user_id: sub.creator_id,
        type: "subscription_received",
        amount_usdc: creatorAmount,
        balance_after: updatedCreatorWallet.balance_usdc,
        description: `Auto-renewal received (${feeConfig.feePercent}% fee: $${(platformFee / 100).toFixed(2)})`,
        reference_id: String(sub.id),
        related_user_id: sub.subscriber_id,
      });

      // Record platform fee transaction
      await tx.insert(walletTransactionsTable).values({
        wallet_id: updatedCreatorWallet.id,
        user_id: sub.creator_id,
        type: "platform_fee",
        amount_usdc: -platformFee,
        balance_after: updatedCreatorWallet.balance_usdc,
        description: `Platform fee (${feeConfig.feePercent}%) on auto-renewal`,
        reference_id: String(sub.id),
        related_user_id: sub.subscriber_id,
      });
    }

    // Update creator total earnings
    await tx
      .update(creatorProfilesTable)
      .set({
        total_earnings_usdc: sql`${creatorProfilesTable.total_earnings_usdc} + ${creatorAmount}`,
      })
      .where(eq(creatorProfilesTable.user_id, sub.creator_id));

    // Extend subscription by 30 days from current expires_at
    const newExpiresAt = new Date(sub.expires_at);
    newExpiresAt.setDate(newExpiresAt.getDate() + 30);

    await tx
      .update(subscriptionsTable)
      .set({ expires_at: newExpiresAt })
      .where(eq(subscriptionsTable.id, sub.id));
  });

  // Process referral commission (fire-and-forget, outside transaction)
  const { creatorAmount: creatorAmountForCommission } = calculateFeeSplit(sub.price_usdc, feeConfig.feePercent);
  if (creatorAmountForCommission > 0) {
    processReferralCommission(
      sub.creator_id,
      "subscription",
      creatorAmountForCommission,
      `renewal-${sub.id}`,
      sub.subscriber_id,
    );
  }

  // Notify subscriber about successful renewal (outside transaction -- non-critical)
  const creatorInfo = await db
    .select({ username: usersTable.username, display_name: usersTable.display_name })
    .from(usersTable)
    .where(eq(usersTable.id, sub.creator_id))
    .limit(1);

  const priceDisplay = (sub.price_usdc / 100).toFixed(2);

  createNotification(
    sub.subscriber_id,
    "subscription_renewed",
    "Subscription renewed",
    `Your subscription to @${creatorInfo[0]?.username ?? "creator"} was renewed for $${priceDisplay} USDC.`,
    String(sub.id),
  );
}

/**
 * Mark a subscription as expired and notify both subscriber and creator.
 */
async function expireSubscription(sub: SubscriptionToRenew, txOrDb: typeof db = db): Promise<void> {
  await txOrDb
    .update(subscriptionsTable)
    .set({ status: "expired" })
    .where(eq(subscriptionsTable.id, sub.id));

  // Get user info for notification messages
  const [subscriberInfo, creatorInfo] = await Promise.all([
    txOrDb
      .select({ display_name: usersTable.display_name, username: usersTable.username })
      .from(usersTable)
      .where(eq(usersTable.id, sub.subscriber_id))
      .limit(1),
    txOrDb
      .select({ display_name: usersTable.display_name, username: usersTable.username })
      .from(usersTable)
      .where(eq(usersTable.id, sub.creator_id))
      .limit(1),
  ]);

  const creatorName = creatorInfo[0]?.username ?? "creator";
  const subscriberName = subscriberInfo[0]?.display_name ?? "A subscriber";

  // Notify subscriber
  createNotification(
    sub.subscriber_id,
    "subscription_expired",
    "Subscription expired",
    `Your subscription to @${creatorName} has expired due to insufficient balance. Top up your wallet to resubscribe.`,
    String(sub.id),
  );

  // Notify creator
  createNotification(
    sub.creator_id,
    "subscription_expired",
    "Subscriber lost",
    `${subscriberName}'s subscription to your content has expired.`,
    String(sub.id),
  );
}

/**
 * Safety net: expire any subscriptions that are past their expires_at
 * but still marked as active (e.g. if previous cron runs missed them).
 */
async function expireOverdueSubscriptions(now: Date): Promise<number> {
  const overdue = await db
    .select({ id: subscriptionsTable.id })
    .from(subscriptionsTable)
    .where(
      and(
        eq(subscriptionsTable.status, "active"),
        lte(subscriptionsTable.expires_at, now),
      ),
    );

  if (overdue.length === 0) return 0;

  await db
    .update(subscriptionsTable)
    .set({ status: "expired" })
    .where(
      and(
        eq(subscriptionsTable.status, "active"),
        lte(subscriptionsTable.expires_at, now),
      ),
    );

  return overdue.length;
}
