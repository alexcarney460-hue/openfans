export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import {
  usersTable,
  creatorProfilesTable,
  subscriptionsTable,
  tipsTable,
  postsTable,
  payoutsTable,
  ppvPurchasesTable,
  walletsTable,
  walletTransactionsTable,
  analyticsEventsTable,
} from "@/utils/db/schema";
import { eq, sql, gte, and, count } from "drizzle-orm";
import { getAuthenticatedAdmin } from "@/utils/api/auth";
import { getOnChainUsdcBalance } from "@/utils/solana/balance";

/**
 * GET /api/admin/analytics
 * Platform-wide analytics for the admin dashboard.
 * Requires admin role.
 */
export async function GET() {
  try {
    const { error: authError } = await getAuthenticatedAdmin();
    if (authError) return authError;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Run all queries in parallel
    const [
      totalUsersResult,
      totalCreatorsResult,
      totalSubscribersResult,
      usersThisMonthResult,
      usersLastMonthResult,
      activeSubscriptionsResult,
      totalPostsResult,
      postsThisMonthResult,
      subRevenueAllTimeResult,
      tipRevenueAllTimeResult,
      ppvRevenueAllTimeResult,
      subRevenueThisMonthResult,
      tipRevenueThisMonthResult,
      ppvRevenueThisMonthResult,
      subRevenueLastMonthResult,
      tipRevenueLastMonthResult,
      totalPayoutsResult,
      pendingPayoutsResult,
      platformWalletBalanceResult,
      userGrowthResult,
      revenueByDayResult,
      topCreatorsResult,
      categoryBreakdownResult,
      subStatusBreakdownResult,
      recentTransactionsResult,
      usersLast7dResult,
      dailySubRevenueResult,
      dailyTipRevenueResult,
      dailyPpvRevenueResult,
      ppvRevenueLastMonthResult,
      actualPlatformFeesAllTimeResult,
      actualPlatformFeesThisMonthResult,
      actualPlatformFeesTodayResult,
      eventsTodayResult,
      eventsThisWeekResult,
      eventsByTypeTodayResult,
    ] = await Promise.all([
      // Total users
      db.select({ count: count() }).from(usersTable),

      // Total creators
      db.select({ count: count() }).from(usersTable).where(eq(usersTable.role, "creator")),

      // Total subscribers (role = subscriber)
      db.select({ count: count() }).from(usersTable).where(eq(usersTable.role, "subscriber")),

      // Users this month
      db.select({ count: count() }).from(usersTable).where(gte(usersTable.created_at, startOfMonth)),

      // Users last month
      db.select({ count: count() }).from(usersTable).where(
        and(gte(usersTable.created_at, startOfLastMonth), sql`${usersTable.created_at} < ${startOfMonth}`),
      ),

      // Active subscriptions
      db.select({ count: count() }).from(subscriptionsTable).where(eq(subscriptionsTable.status, "active")),

      // Total posts
      db.select({ count: count() }).from(postsTable),

      // Posts this month
      db.select({ count: count() }).from(postsTable).where(gte(postsTable.created_at, startOfMonth)),

      // All-time revenue: subscriptions
      db.select({ total: sql<number>`COALESCE(SUM(${subscriptionsTable.price_usdc}), 0)::int` }).from(subscriptionsTable),

      // All-time revenue: tips
      db.select({ total: sql<number>`COALESCE(SUM(${tipsTable.amount_usdc}), 0)::int` }).from(tipsTable),

      // All-time revenue: PPV
      db.select({ total: sql<number>`COALESCE(SUM(${ppvPurchasesTable.amount_usdc}), 0)::int` }).from(ppvPurchasesTable),

      // This month revenue: subscriptions
      db.select({ total: sql<number>`COALESCE(SUM(${subscriptionsTable.price_usdc}), 0)::int` })
        .from(subscriptionsTable).where(gte(subscriptionsTable.created_at, startOfMonth)),

      // This month revenue: tips
      db.select({ total: sql<number>`COALESCE(SUM(${tipsTable.amount_usdc}), 0)::int` })
        .from(tipsTable).where(gte(tipsTable.created_at, startOfMonth)),

      // This month revenue: PPV
      db.select({ total: sql<number>`COALESCE(SUM(${ppvPurchasesTable.amount_usdc}), 0)::int` })
        .from(ppvPurchasesTable).where(gte(ppvPurchasesTable.created_at, startOfMonth)),

      // Last month revenue: subscriptions
      db.select({ total: sql<number>`COALESCE(SUM(${subscriptionsTable.price_usdc}), 0)::int` })
        .from(subscriptionsTable).where(
          and(gte(subscriptionsTable.created_at, startOfLastMonth), sql`${subscriptionsTable.created_at} < ${startOfMonth}`),
        ),

      // Last month revenue: tips
      db.select({ total: sql<number>`COALESCE(SUM(${tipsTable.amount_usdc}), 0)::int` })
        .from(tipsTable).where(
          and(gte(tipsTable.created_at, startOfLastMonth), sql`${tipsTable.created_at} < ${startOfMonth}`),
        ),

      // Total payouts completed
      db.select({ total: sql<number>`COALESCE(SUM(${payoutsTable.amount_usdc}), 0)::int` })
        .from(payoutsTable).where(eq(payoutsTable.status, "completed")),

      // Pending payouts
      db.select({ total: sql<number>`COALESCE(SUM(${payoutsTable.amount_usdc}), 0)::int` })
        .from(payoutsTable).where(eq(payoutsTable.status, "pending")),

      // Total platform wallet balance
      db.select({ total: sql<number>`COALESCE(SUM(${walletsTable.balance_usdc}), 0)::int` }).from(walletsTable),

      // User growth — last 30 days grouped by day
      db.execute(sql`
        SELECT
          DATE(created_at) AS date,
          COUNT(*) AS count
        FROM users_table
        WHERE created_at >= ${thirtyDaysAgo}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `),

      // Revenue by day — last 30 days (subscriptions + tips + PPV)
      db.execute(sql`
        SELECT DATE(created_at) AS date, COALESCE(SUM(amount), 0)::int AS revenue
        FROM (
          SELECT created_at, price_usdc AS amount FROM subscriptions WHERE created_at >= ${thirtyDaysAgo}
          UNION ALL
          SELECT created_at, amount_usdc AS amount FROM tips WHERE created_at >= ${thirtyDaysAgo}
          UNION ALL
          SELECT created_at, amount_usdc AS amount FROM ppv_purchases WHERE created_at >= ${thirtyDaysAgo}
        ) combined
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `),

      // Top 10 creators by earnings
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

      // Category breakdown
      db.execute(sql`
        SELECT
          UNNEST(categories) AS category,
          COUNT(*) AS count
        FROM creator_profiles
        WHERE array_length(categories, 1) > 0
        GROUP BY category
        ORDER BY count DESC
        LIMIT 20
      `),

      // Subscription status breakdown
      db.execute(sql`
        SELECT status, COUNT(*) AS count
        FROM subscriptions
        GROUP BY status
      `),

      // Recent platform transactions (last 20)
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

      // Users last 7 days
      db.select({ count: count() }).from(usersTable).where(gte(usersTable.created_at, sevenDaysAgo)),

      // Today's subscription revenue
      db.select({ total: sql<number>`COALESCE(SUM(${subscriptionsTable.price_usdc}), 0)::int` })
        .from(subscriptionsTable).where(gte(subscriptionsTable.created_at, startOfToday)),

      // Today's tip revenue
      db.select({ total: sql<number>`COALESCE(SUM(${tipsTable.amount_usdc}), 0)::int` })
        .from(tipsTable).where(gte(tipsTable.created_at, startOfToday)),

      // Today's PPV revenue
      db.select({ total: sql<number>`COALESCE(SUM(${ppvPurchasesTable.amount_usdc}), 0)::int` })
        .from(ppvPurchasesTable).where(gte(ppvPurchasesTable.created_at, startOfToday)),

      // Last month revenue: PPV
      db.select({ total: sql<number>`COALESCE(SUM(${ppvPurchasesTable.amount_usdc}), 0)::int` })
        .from(ppvPurchasesTable).where(
          and(gte(ppvPurchasesTable.created_at, startOfLastMonth), sql`${ppvPurchasesTable.created_at} < ${startOfMonth}`),
        ),

      // Actual platform fees collected all-time (from wallet_transactions ledger)
      db.select({
        total: sql<number>`COALESCE(SUM(${walletTransactionsTable.amount_usdc}), 0)::int`,
      })
        .from(walletTransactionsTable)
        .where(eq(walletTransactionsTable.type, 'platform_fee')),

      // Actual platform fees collected this month
      db.select({
        total: sql<number>`COALESCE(SUM(${walletTransactionsTable.amount_usdc}), 0)::int`,
      })
        .from(walletTransactionsTable)
        .where(and(
          eq(walletTransactionsTable.type, 'platform_fee'),
          gte(walletTransactionsTable.created_at, startOfMonth),
        )),

      // Actual platform fees collected today
      db.select({
        total: sql<number>`COALESCE(SUM(${walletTransactionsTable.amount_usdc}), 0)::int`,
      })
        .from(walletTransactionsTable)
        .where(and(
          eq(walletTransactionsTable.type, 'platform_fee'),
          gte(walletTransactionsTable.created_at, startOfToday),
        )),

      // Analytics events today
      db.select({ count: count() })
        .from(analyticsEventsTable)
        .where(gte(analyticsEventsTable.created_at, startOfToday)),

      // Analytics events this week
      db.select({ count: count() })
        .from(analyticsEventsTable)
        .where(gte(analyticsEventsTable.created_at, sevenDaysAgo)),

      // Analytics events by type today
      db.select({
        event_type: analyticsEventsTable.event_type,
        count: count(),
      })
        .from(analyticsEventsTable)
        .where(gte(analyticsEventsTable.created_at, startOfToday))
        .groupBy(analyticsEventsTable.event_type)
        .orderBy(sql`count(*) DESC`),
    ]);

    const totalRevenueAllTime =
      (subRevenueAllTimeResult[0]?.total ?? 0) +
      (tipRevenueAllTimeResult[0]?.total ?? 0) +
      (ppvRevenueAllTimeResult[0]?.total ?? 0);

    const thisMonthRevenue =
      (subRevenueThisMonthResult[0]?.total ?? 0) +
      (tipRevenueThisMonthResult[0]?.total ?? 0) +
      (ppvRevenueThisMonthResult[0]?.total ?? 0);

    const lastMonthRevenue =
      (subRevenueLastMonthResult[0]?.total ?? 0) +
      (tipRevenueLastMonthResult[0]?.total ?? 0) +
      (ppvRevenueLastMonthResult[0]?.total ?? 0);

    // Actual platform fees collected (from wallet_transactions ledger)
    const platformFeeAllTime = actualPlatformFeesAllTimeResult[0]?.total ?? 0;
    const platformFeeThisMonth = actualPlatformFeesThisMonthResult[0]?.total ?? 0;

    // Daily earnings (today)
    const dailyTotalRevenue =
      (dailySubRevenueResult[0]?.total ?? 0) +
      (dailyTipRevenueResult[0]?.total ?? 0) +
      (dailyPpvRevenueResult[0]?.total ?? 0);
    const dailyPlatformFees = actualPlatformFeesTodayResult[0]?.total ?? 0;
    const dailyCreatorEarnings = dailyTotalRevenue - dailyPlatformFees;

    // On-chain hot wallet balance (non-blocking — don't let RPC delays kill the response)
    const platformWalletAddress = process.env.NEXT_PUBLIC_PLATFORM_WALLET;
    let hotWalletBalanceUsdc = 0;
    const hotWalletConfigured = !!platformWalletAddress;
    if (platformWalletAddress) {
      try {
        hotWalletBalanceUsdc = await getOnChainUsdcBalance(platformWalletAddress);
      } catch {
        // Silently fall back to 0 — RPC may be slow or rate-limited
      }
    }

    return NextResponse.json({
      data: {
        overview: {
          total_users: totalUsersResult[0]?.count ?? 0,
          total_creators: totalCreatorsResult[0]?.count ?? 0,
          total_subscribers: totalSubscribersResult[0]?.count ?? 0,
          users_this_month: usersThisMonthResult[0]?.count ?? 0,
          users_last_month: usersLastMonthResult[0]?.count ?? 0,
          users_last_7d: usersLast7dResult[0]?.count ?? 0,
          active_subscriptions: activeSubscriptionsResult[0]?.count ?? 0,
          total_posts: totalPostsResult[0]?.count ?? 0,
          posts_this_month: postsThisMonthResult[0]?.count ?? 0,
        },
        revenue: {
          all_time_usdc: totalRevenueAllTime,
          this_month_usdc: thisMonthRevenue,
          last_month_usdc: lastMonthRevenue,
          subscription_revenue_usdc: subRevenueAllTimeResult[0]?.total ?? 0,
          tip_revenue_usdc: tipRevenueAllTimeResult[0]?.total ?? 0,
          ppv_revenue_usdc: ppvRevenueAllTimeResult[0]?.total ?? 0,
          platform_fee_all_time_usdc: platformFeeAllTime,
          platform_fee_this_month_usdc: platformFeeThisMonth,
          total_payouts_usdc: totalPayoutsResult[0]?.total ?? 0,
          pending_payouts_usdc: pendingPayoutsResult[0]?.total ?? 0,
          platform_wallet_balance_usdc: platformWalletBalanceResult[0]?.total ?? 0,
          daily_platform_fees_usdc: dailyPlatformFees,
          daily_creator_earnings_usdc: dailyCreatorEarnings,
          hot_wallet_balance_usdc: hotWalletBalanceUsdc,
          hot_wallet_configured: hotWalletConfigured,
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
          events_today: eventsTodayResult[0]?.count ?? 0,
          events_this_week: eventsThisWeekResult[0]?.count ?? 0,
          events_by_type: eventsByTypeTodayResult.map((row) => ({
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
