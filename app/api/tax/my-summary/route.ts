export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import {
  usersTable,
  creatorProfilesTable,
  subscriptionsTable,
  tipsTable,
  ppvPurchasesTable,
  postsTable,
  payoutsTable,
} from "@/utils/db/schema";
import { eq, sql } from "drizzle-orm";
import { getAuthenticatedUser } from "@/utils/api/auth";

import { PLATFORM_FEE_RATE, CREATOR_SHARE_RATE, DEFAULT_1099_THRESHOLD, calculateCreatorShare } from "@/utils/tax-calculations";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

interface MonthlyBreakdown {
  readonly month: string;
  readonly month_number: number;
  readonly subscriptions: number;
  readonly tips: number;
  readonly ppv: number;
  readonly total: number;
  readonly net: number;
}

interface QuarterlySummary {
  readonly quarter: string;
  readonly subscriptions: number;
  readonly tips: number;
  readonly ppv: number;
  readonly total: number;
  readonly net: number;
}

/**
 * GET /api/tax/my-summary
 *
 * Returns the authenticated creator's tax earnings summary for a given year.
 * Query params:
 *   - year: tax year (default: current year)
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

    if (
      userResult.length === 0 ||
      (userResult[0].role !== "creator" && userResult[0].role !== "admin")
    ) {
      return NextResponse.json(
        { error: "Only creators can view tax summary", code: "NOT_CREATOR" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const currentYear = new Date().getFullYear();
    const year = parseInt(searchParams.get("year") || String(currentYear), 10);

    if (isNaN(year) || year < 2020 || year > currentYear + 1) {
      return NextResponse.json(
        { error: "Invalid year parameter", code: "INVALID_YEAR" },
        { status: 400 },
      );
    }

    const yearStart = new Date(`${year}-01-01T00:00:00Z`);
    const yearEnd = new Date(`${year + 1}-01-01T00:00:00Z`);

    // Fetch monthly subscription earnings
    const monthlySubscriptions = await db.execute(sql`
      SELECT
        EXTRACT(MONTH FROM ${subscriptionsTable.created_at})::int AS month_num,
        COALESCE(SUM(${subscriptionsTable.price_usdc}), 0)::int AS total
      FROM ${subscriptionsTable}
      WHERE ${subscriptionsTable.creator_id} = ${user.id}
        AND ${subscriptionsTable.created_at} >= ${yearStart.toISOString()}
        AND ${subscriptionsTable.created_at} < ${yearEnd.toISOString()}
      GROUP BY month_num
    `);

    // Fetch monthly tip earnings
    const monthlyTips = await db.execute(sql`
      SELECT
        EXTRACT(MONTH FROM ${tipsTable.created_at})::int AS month_num,
        COALESCE(SUM(${tipsTable.amount_usdc}), 0)::int AS total
      FROM ${tipsTable}
      WHERE ${tipsTable.creator_id} = ${user.id}
        AND ${tipsTable.created_at} >= ${yearStart.toISOString()}
        AND ${tipsTable.created_at} < ${yearEnd.toISOString()}
      GROUP BY month_num
    `);

    // Fetch monthly PPV earnings (creator is the post owner)
    const monthlyPpv = await db.execute(sql`
      SELECT
        EXTRACT(MONTH FROM pp.created_at)::int AS month_num,
        COALESCE(SUM(pp.amount_usdc), 0)::int AS total
      FROM ${ppvPurchasesTable} pp
      INNER JOIN ${postsTable} p ON p.id = pp.post_id
      WHERE p.creator_id = ${user.id}
        AND pp.created_at >= ${yearStart.toISOString()}
        AND pp.created_at < ${yearEnd.toISOString()}
      GROUP BY month_num
    `);

    // Fetch total payouts for the year
    const yearPayouts = await db.execute(sql`
      SELECT COALESCE(SUM(${payoutsTable.amount_usdc}), 0)::int AS total
      FROM ${payoutsTable}
      WHERE ${payoutsTable.creator_id} = ${user.id}
        AND ${payoutsTable.status} = 'completed'
        AND ${payoutsTable.created_at} >= ${yearStart.toISOString()}
        AND ${payoutsTable.created_at} < ${yearEnd.toISOString()}
    `);

    // Check if creator has tax info on file (legal_name as proxy for W-9 submission)
    const profileResult = await db
      .select({ legal_name: creatorProfilesTable.legal_name })
      .from(creatorProfilesTable)
      .where(eq(creatorProfilesTable.user_id, user.id))
      .limit(1);

    const hasLegalName = Boolean(
      profileResult[0]?.legal_name && profileResult[0].legal_name.trim().length > 0,
    );

    // Build lookup maps from query results
    const subsByMonth = new Map<number, number>();
    for (const row of monthlySubscriptions as unknown as Array<{ month_num: number; total: number }>) {
      subsByMonth.set(Number(row.month_num), Number(row.total));
    }

    const tipsByMonth = new Map<number, number>();
    for (const row of monthlyTips as unknown as Array<{ month_num: number; total: number }>) {
      tipsByMonth.set(Number(row.month_num), Number(row.total));
    }

    const ppvByMonth = new Map<number, number>();
    for (const row of monthlyPpv as unknown as Array<{ month_num: number; total: number }>) {
      ppvByMonth.set(Number(row.month_num), Number(row.total));
    }

    // Build monthly breakdown (all 12 months)
    const monthlyBreakdown: MonthlyBreakdown[] = MONTH_NAMES.map((name, idx) => {
      const monthNum = idx + 1;
      const subscriptions = subsByMonth.get(monthNum) ?? 0;
      const tips = tipsByMonth.get(monthNum) ?? 0;
      const ppv = ppvByMonth.get(monthNum) ?? 0;
      const total = subscriptions + tips + ppv;
      const net = calculateCreatorShare(total);

      return {
        month: name,
        month_number: monthNum,
        subscriptions,
        tips,
        ppv,
        total,
        net,
      };
    });

    // Build quarterly summaries
    const quarterlySummaries: QuarterlySummary[] = [0, 1, 2, 3].map((q) => {
      const quarterMonths = monthlyBreakdown.slice(q * 3, q * 3 + 3);
      return {
        quarter: `Q${q + 1}`,
        subscriptions: quarterMonths.reduce((sum, m) => sum + m.subscriptions, 0),
        tips: quarterMonths.reduce((sum, m) => sum + m.tips, 0),
        ppv: quarterMonths.reduce((sum, m) => sum + m.ppv, 0),
        total: quarterMonths.reduce((sum, m) => sum + m.total, 0),
        net: quarterMonths.reduce((sum, m) => sum + m.net, 0),
      };
    });

    // Annual totals
    const grossEarnings = monthlyBreakdown.reduce((sum, m) => sum + m.total, 0);
    const netEarnings = calculateCreatorShare(grossEarnings);
    const platformFees = grossEarnings - netEarnings;
    const totalPayouts = Number((yearPayouts as unknown as Array<{ total: number }>)[0]?.total ?? 0);

    return NextResponse.json({
      data: {
        year,
        annual: {
          gross_earnings: grossEarnings,
          net_earnings: netEarnings,
          platform_fees: platformFees,
          total_payouts: totalPayouts,
        },
        monthly: monthlyBreakdown,
        quarterly: quarterlySummaries,
        is_above_threshold: netEarnings >= DEFAULT_1099_THRESHOLD,
        has_tax_info: hasLegalName,
      },
    });
  } catch (error) {
    console.error("GET /api/tax/my-summary error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
