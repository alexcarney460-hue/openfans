export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { sql } from "drizzle-orm";
import { getAuthenticatedAdmin } from "@/utils/api/auth";
import {
  CREATOR_SHARE_RATE,
  DEFAULT_1099_THRESHOLD,
  formatTaxYear,
  calculateCreatorShare,
  isAboveThreshold,
} from "@/utils/tax-calculations";

interface MonthlyBreakdown {
  month: number;
  month_name: string;
  subscriptions: number;
  tips: number;
  ppv: number;
  total: number;
  gross_earnings_usdc: number;
  net: number;
  net_earnings_usdc: number;
}

interface QuarterlyTotal {
  quarter: number;
  subscriptions: number;
  tips: number;
  ppv: number;
  total: number;
  net: number;
}

interface PayoutRecord {
  id: number;
  amount_usdc: number;
  status: string;
  payment_tx: string | null;
  created_at: string;
}

/**
 * GET /api/admin/tax/creator/[id]
 *
 * Detailed per-creator tax breakdown for a given year.
 * Returns monthly and quarterly earnings, plus payout history.
 *
 * Query params:
 *   - year (required) Four-digit calendar year
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { error: authError } = await getAuthenticatedAdmin();
    if (authError) return authError;

    const creatorId = params.id;
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!creatorId || !UUID_RE.test(creatorId)) {
      return NextResponse.json(
        { error: "Invalid creator ID format", code: "INVALID_ID" },
        { status: 400 },
      );
    }

    const yearRaw = request.nextUrl.searchParams.get("year");
    if (!yearRaw) {
      return NextResponse.json(
        { error: "Missing required query parameter: year", code: "MISSING_YEAR" },
        { status: 400 },
      );
    }

    const year = parseInt(yearRaw, 10);
    if (Number.isNaN(year) || year < 2000 || year > 2100) {
      return NextResponse.json(
        { error: "year must be an integer between 2000 and 2100", code: "INVALID_YEAR" },
        { status: 400 },
      );
    }

    const { start, end } = formatTaxYear(year);

    // --- Fetch creator info ---
    const creatorRows = await db.execute(sql`
      SELECT
        u.id         AS user_id,
        u.username,
        u.display_name,
        u.email,
        CASE
          WHEN cp.verification_status = 'verified' THEN true
          ELSE false
        END          AS has_tax_info
      FROM users_table u
      LEFT JOIN creator_profiles cp ON cp.user_id = u.id
      WHERE u.id = ${creatorId}
      LIMIT 1
    `);

    if (creatorRows.length === 0) {
      return NextResponse.json(
        { error: "Creator not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    const creator = creatorRows[0] as Record<string, unknown>;

    // --- Monthly earnings breakdown ---
    // Subscription earnings by month
    const subMonthly = await db.execute(sql`
      SELECT
        EXTRACT(MONTH FROM created_at)::int AS month,
        COALESCE(SUM(price_usdc), 0)::int   AS total
      FROM subscriptions
      WHERE creator_id = ${creatorId}
        AND created_at >= ${start.toISOString()}
        AND created_at <= ${end.toISOString()}
      GROUP BY EXTRACT(MONTH FROM created_at)
      ORDER BY month
    `);

    // Tip earnings by month
    const tipMonthly = await db.execute(sql`
      SELECT
        EXTRACT(MONTH FROM created_at)::int AS month,
        COALESCE(SUM(amount_usdc), 0)::int  AS total
      FROM tips
      WHERE creator_id = ${creatorId}
        AND created_at >= ${start.toISOString()}
        AND created_at <= ${end.toISOString()}
      GROUP BY EXTRACT(MONTH FROM created_at)
      ORDER BY month
    `);

    // PPV earnings by month (join through posts)
    const ppvMonthly = await db.execute(sql`
      SELECT
        EXTRACT(MONTH FROM pp.created_at)::int AS month,
        COALESCE(SUM(pp.amount_usdc), 0)::int  AS total
      FROM ppv_purchases pp
      INNER JOIN posts p ON pp.post_id = p.id
      WHERE p.creator_id = ${creatorId}
        AND pp.created_at >= ${start.toISOString()}
        AND pp.created_at <= ${end.toISOString()}
      GROUP BY EXTRACT(MONTH FROM pp.created_at)
      ORDER BY month
    `);

    // Build lookup maps for each revenue stream
    const subByMonth = new Map<number, number>();
    for (const row of subMonthly as unknown as Array<Record<string, unknown>>) {
      subByMonth.set(Number(row.month), Number(row.total));
    }

    const tipByMonth = new Map<number, number>();
    for (const row of tipMonthly as unknown as Array<Record<string, unknown>>) {
      tipByMonth.set(Number(row.month), Number(row.total));
    }

    const ppvByMonth = new Map<number, number>();
    for (const row of ppvMonthly as unknown as Array<Record<string, unknown>>) {
      ppvByMonth.set(Number(row.month), Number(row.total));
    }

    // Assemble 12-month breakdown
    const monthly: MonthlyBreakdown[] = [];
    const MONTH_NAMES = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    for (let m = 1; m <= 12; m++) {
      const subscriptions = subByMonth.get(m) ?? 0;
      const tips = tipByMonth.get(m) ?? 0;
      const ppv = ppvByMonth.get(m) ?? 0;
      const total = subscriptions + tips + ppv;
      monthly.push({
        month: m,
        month_name: MONTH_NAMES[m],
        subscriptions,
        tips,
        ppv,
        total,
        gross_earnings_usdc: total,
        net: calculateCreatorShare(total),
        net_earnings_usdc: calculateCreatorShare(total),
      });
    }

    // Quarterly totals (Q1 = months 1-3, Q2 = 4-6, etc.)
    const quarterly: QuarterlyTotal[] = [];
    for (let q = 0; q < 4; q++) {
      const qMonths = monthly.slice(q * 3, q * 3 + 3);
      const subscriptions = qMonths.reduce((s, m) => s + m.subscriptions, 0);
      const tips = qMonths.reduce((s, m) => s + m.tips, 0);
      const ppv = qMonths.reduce((s, m) => s + m.ppv, 0);
      const total = subscriptions + tips + ppv;
      quarterly.push({
        quarter: q + 1,
        subscriptions,
        tips,
        ppv,
        total,
        net: calculateCreatorShare(total),
      });
    }

    // Annual totals
    const grossEarnings = monthly.reduce((s, m) => s + m.total, 0);
    const netEarnings = calculateCreatorShare(grossEarnings);

    // --- Payout history for the year ---
    const payoutRows = await db.execute(sql`
      SELECT
        id,
        amount_usdc,
        status,
        payment_tx,
        created_at
      FROM payouts
      WHERE creator_id = ${creatorId}
        AND created_at >= ${start.toISOString()}
        AND created_at <= ${end.toISOString()}
      ORDER BY created_at DESC
    `);

    const payouts: PayoutRecord[] = (payoutRows as unknown as Array<Record<string, unknown>>).map((row) => ({
      id: Number(row.id),
      amount_usdc: Number(row.amount_usdc),
      status: String(row.status),
      payment_tx: row.payment_tx ? String(row.payment_tx) : null,
      created_at: String(row.created_at),
    }));

    const totalPayouts = payouts
      .filter((p) => p.status === "completed")
      .reduce((s, p) => s + p.amount_usdc, 0);

    return NextResponse.json({
      data: {
        year,
        creator: {
          user_id: creator.user_id,
          username: creator.username,
          display_name: creator.display_name,
          email: creator.email,
          has_tax_info: Boolean(creator.has_tax_info),
        },
        annual: {
          gross_earnings_usdc: grossEarnings,
          net_earnings_usdc: netEarnings,
          total_payouts_usdc: totalPayouts,
          is_above_threshold: isAboveThreshold(netEarnings),
        },
        monthly,
        quarterly,
        payouts,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/tax/creator/[id] error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
