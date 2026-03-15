export const dynamic = "force-dynamic";
export const maxDuration = 30;

import { NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import {
  usersTable,
  creatorProfilesTable,
  walletTransactionsTable,
} from "@/utils/db/schema";
import { eq, sql } from "drizzle-orm";
import { getAuthenticatedAdmin } from "@/utils/api/auth";

/**
 * GET /api/admin/analytics
 * Platform-wide analytics. Uses sequential simple queries to stay within timeout.
 */
export async function GET() {
  try {
    const { error: authError } = await getAuthenticatedAdmin();
    if (authError) return authError;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Batch 1: Core counts (fast, single table scans)
    const [counts] = await db.execute(sql`
      SELECT
        (SELECT COUNT(*) FROM users_table)::int AS total_users,
        (SELECT COUNT(*) FROM users_table WHERE role = 'creator')::int AS total_creators,
        (SELECT COUNT(*) FROM users_table WHERE role = 'subscriber')::int AS total_subscribers,
        (SELECT COUNT(*) FROM posts)::int AS total_posts,
        (SELECT COUNT(*) FROM subscriptions WHERE status = 'active')::int AS active_subscriptions
    `);
    const c = counts as Record<string, number>;

    // Batch 2: Time-based user counts
    const [userCounts] = await db.execute(sql`
      SELECT
        COUNT(*) FILTER (WHERE created_at >= ${startOfMonth})::int AS users_this_month,
        COUNT(*) FILTER (WHERE created_at >= ${startOfLastMonth} AND created_at < ${startOfMonth})::int AS users_last_month,
        COUNT(*) FILTER (WHERE created_at >= ${sevenDaysAgo})::int AS users_last_7d
      FROM users_table
    `);
    const uc = userCounts as Record<string, number>;

    // Batch 3: Revenue (all from one scan per table)
    const [subRev] = await db.execute(sql`
      SELECT
        COALESCE(SUM(price_usdc), 0)::int AS all_time,
        COALESCE(SUM(price_usdc) FILTER (WHERE created_at >= ${startOfMonth}), 0)::int AS this_month,
        COALESCE(SUM(price_usdc) FILTER (WHERE created_at >= ${startOfLastMonth} AND created_at < ${startOfMonth}), 0)::int AS last_month,
        COALESCE(SUM(price_usdc) FILTER (WHERE created_at >= ${startOfToday}), 0)::int AS today,
        COUNT(*) FILTER (WHERE created_at >= ${startOfMonth})::int AS posts_this_month
      FROM subscriptions
    `);
    const [tipRev] = await db.execute(sql`
      SELECT
        COALESCE(SUM(amount_usdc), 0)::int AS all_time,
        COALESCE(SUM(amount_usdc) FILTER (WHERE created_at >= ${startOfMonth}), 0)::int AS this_month,
        COALESCE(SUM(amount_usdc) FILTER (WHERE created_at >= ${startOfLastMonth} AND created_at < ${startOfMonth}), 0)::int AS last_month,
        COALESCE(SUM(amount_usdc) FILTER (WHERE created_at >= ${startOfToday}), 0)::int AS today
      FROM tips
    `);
    const [ppvRev] = await db.execute(sql`
      SELECT
        COALESCE(SUM(amount_usdc), 0)::int AS all_time,
        COALESCE(SUM(amount_usdc) FILTER (WHERE created_at >= ${startOfMonth}), 0)::int AS this_month,
        COALESCE(SUM(amount_usdc) FILTER (WHERE created_at >= ${startOfLastMonth} AND created_at < ${startOfMonth}), 0)::int AS last_month,
        COALESCE(SUM(amount_usdc) FILTER (WHERE created_at >= ${startOfToday}), 0)::int AS today
      FROM ppv_purchases
    `);
    const sr = subRev as Record<string, number>;
    const tr = tipRev as Record<string, number>;
    const pr = ppvRev as Record<string, number>;

    // Batch 4: Payouts + wallets + fees
    const [finance] = await db.execute(sql`
      SELECT
        COALESCE((SELECT SUM(amount_usdc) FROM payouts WHERE status = 'completed'), 0)::int AS total_payouts,
        COALESCE((SELECT SUM(amount_usdc) FROM payouts WHERE status = 'pending'), 0)::int AS pending_payouts,
        COALESCE((SELECT SUM(balance_usdc) FROM wallets), 0)::int AS platform_wallet_balance,
        COALESCE((SELECT SUM(amount_usdc) FROM wallet_transactions WHERE type = 'platform_fee'), 0)::int AS fees_all_time,
        COALESCE((SELECT SUM(amount_usdc) FROM wallet_transactions WHERE type = 'platform_fee' AND created_at >= ${startOfMonth}), 0)::int AS fees_this_month,
        COALESCE((SELECT SUM(amount_usdc) FROM wallet_transactions WHERE type = 'platform_fee' AND created_at >= ${startOfToday}), 0)::int AS fees_today
    `);
    const f = finance as Record<string, number>;

    // Batch 5: Engagement
    const [engagement] = await db.execute(sql`
      SELECT
        COUNT(*) FILTER (WHERE created_at >= ${startOfToday})::int AS events_today,
        COUNT(*) FILTER (WHERE created_at >= ${sevenDaysAgo})::int AS events_this_week
      FROM analytics_events
    `);
    const eg = engagement as Record<string, number>;

    // Batch 6: Lists (parallel — these are small result sets)
    const [
      topCreatorsResult,
      recentTransactionsResult,
      eventsByTypeResult,
    ] = await Promise.all([
      db.select({
        user_id: creatorProfilesTable.user_id,
        username: usersTable.username,
        display_name: usersTable.display_name,
        avatar_url: usersTable.avatar_url,
        is_verified: usersTable.is_verified,
        total_subscribers: creatorProfilesTable.total_subscribers,
        total_earnings_usdc: creatorProfilesTable.total_earnings_usdc,
        categories: creatorProfilesTable.categories,
      })
        .from(creatorProfilesTable)
        .innerJoin(usersTable, eq(usersTable.id, creatorProfilesTable.user_id))
        .orderBy(sql`${creatorProfilesTable.total_earnings_usdc} DESC`)
        .limit(10),
      db.select({
        id: walletTransactionsTable.id,
        type: walletTransactionsTable.type,
        amount_usdc: walletTransactionsTable.amount_usdc,
        description: walletTransactionsTable.description,
        status: walletTransactionsTable.status,
        created_at: walletTransactionsTable.created_at,
        username: usersTable.username,
      })
        .from(walletTransactionsTable)
        .innerJoin(usersTable, eq(usersTable.id, walletTransactionsTable.user_id))
        .orderBy(sql`${walletTransactionsTable.created_at} DESC`)
        .limit(20),
      db.execute(sql`
        SELECT event_type, COUNT(*)::int AS count
        FROM analytics_events WHERE created_at >= ${startOfToday}
        GROUP BY event_type ORDER BY count DESC
      `),
    ]);

    // Compute totals
    const totalRevenueAllTime = sr.all_time + tr.all_time + pr.all_time;
    const thisMonthRevenue = sr.this_month + tr.this_month + pr.this_month;
    const lastMonthRevenue = sr.last_month + tr.last_month + pr.last_month;
    const dailyTotalRevenue = sr.today + tr.today + pr.today;
    const dailyCreatorEarnings = dailyTotalRevenue - f.fees_today;
    const postsThisMonth = (await db.execute(sql`SELECT COUNT(*)::int AS c FROM posts WHERE created_at >= ${startOfMonth}`))[0] as Record<string, number>;

    return NextResponse.json({
      data: {
        overview: {
          total_users: c.total_users,
          total_creators: c.total_creators,
          total_subscribers: c.total_subscribers,
          users_this_month: uc.users_this_month,
          users_last_month: uc.users_last_month,
          users_last_7d: uc.users_last_7d,
          active_subscriptions: c.active_subscriptions,
          total_posts: c.total_posts,
          posts_this_month: postsThisMonth.c,
        },
        revenue: {
          all_time_usdc: totalRevenueAllTime,
          this_month_usdc: thisMonthRevenue,
          last_month_usdc: lastMonthRevenue,
          subscription_revenue_usdc: sr.all_time,
          tip_revenue_usdc: tr.all_time,
          ppv_revenue_usdc: pr.all_time,
          platform_fee_all_time_usdc: f.fees_all_time,
          platform_fee_this_month_usdc: f.fees_this_month,
          total_payouts_usdc: f.total_payouts,
          pending_payouts_usdc: f.pending_payouts,
          platform_wallet_balance_usdc: f.platform_wallet_balance,
          daily_platform_fees_usdc: f.fees_today,
          daily_creator_earnings_usdc: dailyCreatorEarnings,
          hot_wallet_balance_usdc: 0,
          hot_wallet_configured: !!process.env.NEXT_PUBLIC_PLATFORM_WALLET,
        },
        charts: {
          user_growth: [],
          revenue_by_day: [],
        },
        top_creators: topCreatorsResult,
        category_breakdown: [],
        subscription_status: [],
        recent_transactions: recentTransactionsResult,
        engagement: {
          events_today: eg.events_today,
          events_this_week: eg.events_this_week,
          events_by_type: (eventsByTypeResult as unknown as Array<{ event_type: string; count: number }>).map((row) => ({
            event_type: row.event_type,
            count: Number(row.count),
          })),
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("GET /api/admin/analytics error:", message);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
