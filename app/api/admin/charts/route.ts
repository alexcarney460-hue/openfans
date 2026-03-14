export const dynamic = "force-dynamic";
export const maxDuration = 30;

import { NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { sql } from "drizzle-orm";
import { getAuthenticatedAdmin } from "@/utils/api/auth";

/**
 * GET /api/admin/charts
 * Heavier chart queries split from the main analytics endpoint to prevent timeouts.
 * Returns user growth, revenue by day, category breakdown, and subscription status.
 */
export async function GET() {
  try {
    const { error: authError } = await getAuthenticatedAdmin();
    if (authError) return authError;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [userGrowthResult, revenueByDayResult, categoryResult, subStatusResult] =
      await Promise.all([
        // User growth: last 30 days grouped by day
        db.execute(sql`
          SELECT
            TO_CHAR(created_at::date, 'YYYY-MM-DD') AS date,
            COUNT(*)::int AS count
          FROM users_table
          WHERE created_at >= ${thirtyDaysAgo}
          GROUP BY created_at::date
          ORDER BY created_at::date ASC
        `),

        // Revenue by day: UNION ALL across subscriptions, tips, ppv_purchases
        db.execute(sql`
          SELECT date, SUM(revenue)::int AS revenue
          FROM (
            SELECT TO_CHAR(created_at::date, 'YYYY-MM-DD') AS date, COALESCE(SUM(price_usdc), 0) AS revenue
            FROM subscriptions
            WHERE created_at >= ${thirtyDaysAgo}
            GROUP BY created_at::date
            UNION ALL
            SELECT TO_CHAR(created_at::date, 'YYYY-MM-DD') AS date, COALESCE(SUM(amount_usdc), 0) AS revenue
            FROM tips
            WHERE created_at >= ${thirtyDaysAgo}
            GROUP BY created_at::date
            UNION ALL
            SELECT TO_CHAR(created_at::date, 'YYYY-MM-DD') AS date, COALESCE(SUM(amount_usdc), 0) AS revenue
            FROM ppv_purchases
            WHERE created_at >= ${thirtyDaysAgo}
            GROUP BY created_at::date
          ) combined
          GROUP BY date
          ORDER BY date ASC
        `),

        // Category breakdown: UNNEST(categories) from creator_profiles
        db.execute(sql`
          SELECT UNNEST(categories) AS category, COUNT(*)::int AS count
          FROM creator_profiles
          WHERE categories IS NOT NULL AND array_length(categories, 1) > 0
          GROUP BY category
          ORDER BY count DESC
        `),

        // Subscription status: GROUP BY status
        db.execute(sql`
          SELECT status, COUNT(*)::int AS count
          FROM subscriptions
          GROUP BY status
          ORDER BY count DESC
        `),
      ]);

    return NextResponse.json({
      data: {
        user_growth: (userGrowthResult as unknown as Array<{ date: string; count: number }>).map(
          (row) => ({ date: row.date, count: Number(row.count) }),
        ),
        revenue_by_day: (
          revenueByDayResult as unknown as Array<{ date: string; revenue: number }>
        ).map((row) => ({ date: row.date, revenue: Number(row.revenue) })),
        category_breakdown: (
          categoryResult as unknown as Array<{ category: string; count: number }>
        ).map((row) => ({ category: row.category, count: Number(row.count) })),
        subscription_status: (
          subStatusResult as unknown as Array<{ status: string; count: number }>
        ).map((row) => ({ status: row.status, count: Number(row.count) })),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("GET /api/admin/charts error:", message);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR", debug: message },
      { status: 500 },
    );
  }
}
