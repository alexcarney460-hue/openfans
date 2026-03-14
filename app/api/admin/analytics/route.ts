export const dynamic = "force-dynamic";

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
 * Platform-wide analytics — uses a single raw SQL query for speed.
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

    // Single consolidated query for all scalar metrics
    const [metrics] = await db.execute(sql`
      SELECT
        (SELECT COUNT(*) FROM users_table)::int AS total_users,
        (SELECT COUNT(*) FROM users_table WHERE role = 'creator')::int AS total_creators,
        (SELECT COUNT(*) FROM users_table WHERE role = 'subscriber')::int AS total_subscribers,
        (SELECT COUNT(*) FROM users_table WHERE created_at >= ${startOfMonth})::int AS users_this_month,
        (SELECT COUNT(*) FROM users_table WHERE created_at >= ${startOfLastMonth} AND created_at < ${startOfMonth})::int AS users_last_month,
        (SELECT COUNT(*) FROM users_table WHERE created_at >= ${sevenDaysAgo})::int AS users_last_7d,
        (SELECT COUNT(*) FROM subscriptions WHERE status = 'active')::int AS active_subscriptions,
        (SELECT COUNT(*) FROM posts)::int AS total_posts,
        (SELECT COUNT(*) FROM posts WHERE created_at >= ${startOfMonth})::int AS posts_this_month,
        COALESCE((SELECT SUM(price_usdc) FROM subscriptions), 0)::int AS sub_revenue_all,
        COALESCE((SELECT SUM(amount_usdc) FROM tips), 0)::int AS tip_revenue_all,
        COALESCE((SELECT SUM(amount_usdc) FROM ppv_purchases), 0)::int AS ppv_revenue_all,
        COALESCE((SELECT SUM(price_usdc) FROM subscriptions WHERE created_at >= ${startOfMonth}), 0)::int AS sub_revenue_month,
        COALESCE((SELECT SUM(amount_usdc) FROM tips WHERE created_at >= ${startOfMonth}), 0)::int AS tip_revenue_month,
        COALESCE((SELECT SUM(amount_usdc) FROM ppv_purchases WHERE created_at >= ${startOfMonth}), 0)::int AS ppv_revenue_month,
        COALESCE((SELECT SUM(price_usdc) FROM subscriptions WHERE created_at >= ${startOfLastMonth} AND created_at < ${startOfMonth}), 0)::int AS sub_revenue_last_month,
        COALESCE((SELECT SUM(amount_usdc) FROM tips WHERE created_at >= ${startOfLastMonth} AND created_at < ${startOfMonth}), 0)::int AS tip_revenue_last_month,
        COALESCE((SELECT SUM(amount_usdc) FROM ppv_purchases WHERE created_at >= ${startOfLastMonth} AND created_at < ${startOfMonth}), 0)::int AS ppv_revenue_last_month,
        COALESCE((SELECT SUM(price_usdc) FROM subscriptions WHERE created_at >= ${startOfToday}), 0)::int AS sub_revenue_today,
        COALESCE((SELECT SUM(amount_usdc) FROM tips WHERE created_at >= ${startOfToday}), 0)::int AS tip_revenue_today,
        COALESCE((SELECT SUM(amount_usdc) FROM ppv_purchases WHERE created_at >= ${startOfToday}), 0)::int AS ppv_revenue_today,
        COALESCE((SELECT SUM(amount_usdc) FROM payouts WHERE status = 'completed'), 0)::int AS total_payouts,
        COALESCE((SELECT SUM(amount_usdc) FROM payouts WHERE status = 'pending'), 0)::int AS pending_payouts,
        COALESCE((SELECT SUM(balance_usdc) FROM wallets), 0)::int AS platform_wallet_balance,
        COALESCE((SELECT SUM(amount_usdc) FROM wallet_transactions WHERE type = 'platform_fee'), 0)::int AS fees_all_time,
        COALESCE((SELECT SUM(amount_usdc) FROM wallet_transactions WHERE type = 'platform_fee' AND created_at >= ${startOfMonth}), 0)::int AS fees_this_month,
        COALESCE((SELECT SUM(amount_usdc) FROM wallet_transactions WHERE type = 'platform_fee' AND created_at >= ${startOfToday}), 0)::int AS fees_today,
        (SELECT COUNT(*) FROM analytics_events WHERE created_at >= ${startOfToday})::int AS events_today,
        (SELECT COUNT(*) FROM analytics_events WHERE created_at >= ${sevenDaysAgo})::int AS events_this_week
    `);

    const m = metrics as Record<string, number>;

    // Smaller parallel batch for list/chart queries
    const [
      userGrowthResult,
      revenueByDayResult,
      topCreatorsResult,
      categoryBreakdownResult,
      subStatusBreakdownResult,
      recentTransactionsResult,
      eventsByTypeResult,
    ] = await Promise.all([
      db.execute(sql`
        SELECT DATE(created_at) AS date, COUNT(*)::int AS count
        FROM users_table WHERE created_at >= ${thirtyDaysAgo}
        GROUP BY DATE(created_at) ORDER BY date ASC
      `),
      db.execute(sql`
        SELECT DATE(created_at) AS date, COALESCE(SUM(amount), 0)::int AS revenue
        FROM (
          SELECT created_at, price_usdc AS amount FROM subscriptions WHERE created_at >= ${thirtyDaysAgo}
          UNION ALL
          SELECT created_at, amount_usdc AS amount FROM tips WHERE created_at >= ${thirtyDaysAgo}
          UNION ALL
          SELECT created_at, amount_usdc AS amount FROM ppv_purchases WHERE created_at >= ${thirtyDaysAgo}
        ) combined
        GROUP BY DATE(created_at) ORDER BY date ASC
      `),
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
      db.execute(sql`
        SELECT UNNEST(categories) AS category, COUNT(*)::int AS count
        FROM creator_profiles WHERE array_length(categories, 1) > 0
        GROUP BY category ORDER BY count DESC LIMIT 20
      `),
      db.execute(sql`SELECT status, COUNT(*)::int AS count FROM subscriptions GROUP BY status`),
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

    const totalRevenueAllTime = m.sub_revenue_all + m.tip_revenue_all + m.ppv_revenue_all;
    const thisMonthRevenue = m.sub_revenue_month + m.tip_revenue_month + m.ppv_revenue_month;
    const lastMonthRevenue = m.sub_revenue_last_month + m.tip_revenue_last_month + m.ppv_revenue_last_month;
    const dailyTotalRevenue = m.sub_revenue_today + m.tip_revenue_today + m.ppv_revenue_today;
    const dailyCreatorEarnings = dailyTotalRevenue - m.fees_today;

    const platformWalletAddress = process.env.NEXT_PUBLIC_PLATFORM_WALLET;

    return NextResponse.json({
      data: {
        overview: {
          total_users: m.total_users,
          total_creators: m.total_creators,
          total_subscribers: m.total_subscribers,
          users_this_month: m.users_this_month,
          users_last_month: m.users_last_month,
          users_last_7d: m.users_last_7d,
          active_subscriptions: m.active_subscriptions,
          total_posts: m.total_posts,
          posts_this_month: m.posts_this_month,
        },
        revenue: {
          all_time_usdc: totalRevenueAllTime,
          this_month_usdc: thisMonthRevenue,
          last_month_usdc: lastMonthRevenue,
          subscription_revenue_usdc: m.sub_revenue_all,
          tip_revenue_usdc: m.tip_revenue_all,
          ppv_revenue_usdc: m.ppv_revenue_all,
          platform_fee_all_time_usdc: m.fees_all_time,
          platform_fee_this_month_usdc: m.fees_this_month,
          total_payouts_usdc: m.total_payouts,
          pending_payouts_usdc: m.pending_payouts,
          platform_wallet_balance_usdc: m.platform_wallet_balance,
          daily_platform_fees_usdc: m.fees_today,
          daily_creator_earnings_usdc: dailyCreatorEarnings,
          hot_wallet_balance_usdc: 0,
          hot_wallet_configured: !!platformWalletAddress,
        },
        charts: {
          user_growth: userGrowthResult,
          revenue_by_day: revenueByDayResult,
        },
        top_creators: topCreatorsResult,
        category_breakdown: categoryBreakdownResult,
        subscription_status: subStatusBreakdownResult,
        recent_transactions: recentTransactionsResult,
        engagement: {
          events_today: m.events_today,
          events_this_week: m.events_this_week,
          events_by_type: (eventsByTypeResult as unknown as Array<{ event_type: string; count: number }>).map((row) => ({
            event_type: row.event_type,
            count: Number(row.count),
          })),
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack?.split("\n").slice(0, 3).join(" | ") : "";
    console.error("GET /api/admin/analytics error:", message, stack);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR", debug: message },
      { status: 500 },
    );
  }
}
