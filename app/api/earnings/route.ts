export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import {
  usersTable,
  creatorProfilesTable,
  subscriptionsTable,
  tipsTable,
  payoutsTable,
} from "@/utils/db/schema";
import { eq, and, sql, desc, gte } from "drizzle-orm";
import { getAuthenticatedUser } from "@/utils/api/auth";

const CREATOR_SHARE_MULTIPLIER = 0.95; // 5% platform fee

/**
 * GET /api/earnings
 * Get earnings summary for the authenticated creator.
 * Returns total earnings, this month's earnings, pending payout,
 * and recent transaction history.
 *
 * Query params:
 *   - page: page number for transaction history (default 1)
 *   - limit: results per page (default 20, max 50)
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    // Verify user is a creator
    const userResult = await db
      .select({ role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .limit(1);

    if (userResult.length === 0 || (userResult[0].role !== "creator" && userResult[0].role !== "admin")) {
      return NextResponse.json(
        { error: "Only creators can view earnings", code: "NOT_CREATOR" },
        { status: 403 },
      );
    }

    // Get creator profile for cached total
    const profileResult = await db
      .select({
        total_earnings_usdc: creatorProfilesTable.total_earnings_usdc,
      })
      .from(creatorProfilesTable)
      .where(eq(creatorProfilesTable.user_id, user.id))
      .limit(1);

    const totalEarningsCached = profileResult[0]?.total_earnings_usdc ?? 0;

    // Calculate this month's earnings from subscriptions
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthSubEarnings = await db
      .select({
        total: sql<number>`COALESCE(SUM(${subscriptionsTable.price_usdc}), 0)::int`,
      })
      .from(subscriptionsTable)
      .where(
        and(
          eq(subscriptionsTable.creator_id, user.id),
          gte(subscriptionsTable.created_at, startOfMonth),
        ),
      );

    const monthTipEarnings = await db
      .select({
        total: sql<number>`COALESCE(SUM(${tipsTable.amount_usdc}), 0)::int`,
      })
      .from(tipsTable)
      .where(
        and(
          eq(tipsTable.creator_id, user.id),
          gte(tipsTable.created_at, startOfMonth),
        ),
      );

    const thisMonthEarnings = Math.round(
      ((monthSubEarnings[0]?.total ?? 0) + (monthTipEarnings[0]?.total ?? 0)) *
        CREATOR_SHARE_MULTIPLIER,
    );

    // Calculate all-time earnings from subscriptions + tips
    const allTimeSubEarnings = await db
      .select({
        total: sql<number>`COALESCE(SUM(${subscriptionsTable.price_usdc}), 0)::int`,
      })
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.creator_id, user.id));

    const allTimeTipEarnings = await db
      .select({
        total: sql<number>`COALESCE(SUM(${tipsTable.amount_usdc}), 0)::int`,
      })
      .from(tipsTable)
      .where(eq(tipsTable.creator_id, user.id));

    const totalEarningsCalc = Math.round(
      ((allTimeSubEarnings[0]?.total ?? 0) + (allTimeTipEarnings[0]?.total ?? 0)) *
        CREATOR_SHARE_MULTIPLIER,
    );

    // Get total paid out
    const totalPaidOut = await db
      .select({
        total: sql<number>`COALESCE(SUM(${payoutsTable.amount_usdc}), 0)::int`,
      })
      .from(payoutsTable)
      .where(
        and(
          eq(payoutsTable.creator_id, user.id),
          eq(payoutsTable.status, "completed"),
        ),
      );

    const pendingPayout = totalEarningsCalc - (totalPaidOut[0]?.total ?? 0);

    // Transaction history: union of subscriptions, tips, and payouts
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));
    const offset = (page - 1) * limit;

    const transactions = await db.execute(sql`
      (
        SELECT
          'subscription' AS type,
          s.id,
          s.subscriber_id AS from_user_id,
          u.username AS from_username,
          s.price_usdc AS amount_usdc,
          s.tier,
          s.payment_tx,
          s.created_at
        FROM subscriptions s
        JOIN users_table u ON u.id = s.subscriber_id
        WHERE s.creator_id = ${user.id}
      )
      UNION ALL
      (
        SELECT
          'tip' AS type,
          t.id,
          t.tipper_id AS from_user_id,
          u.username AS from_username,
          t.amount_usdc,
          NULL AS tier,
          t.payment_tx,
          t.created_at
        FROM tips t
        JOIN users_table u ON u.id = t.tipper_id
        WHERE t.creator_id = ${user.id}
      )
      UNION ALL
      (
        SELECT
          'payout' AS type,
          p.id,
          NULL AS from_user_id,
          NULL AS from_username,
          -p.amount_usdc AS amount_usdc,
          NULL AS tier,
          p.payment_tx,
          p.created_at
        FROM payouts p
        WHERE p.creator_id = ${user.id}
      )
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `);

    return NextResponse.json({
      data: {
        total_earnings_usdc: totalEarningsCalc,
        this_month_earnings_usdc: thisMonthEarnings,
        pending_payout_usdc: Math.max(0, pendingPayout),
        total_paid_out_usdc: totalPaidOut[0]?.total ?? 0,
      },
      transactions,
      meta: { page, limit },
    });
  } catch (error) {
    console.error("GET /api/earnings error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
