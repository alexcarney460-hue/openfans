export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { sql } from "drizzle-orm";
import { getAuthenticatedAdmin } from "@/utils/api/auth";
import {
  CREATOR_SHARE_RATE,
  DEFAULT_1099_THRESHOLD,
  formatTaxYear,
} from "@/utils/tax-calculations";

/**
 * GET /api/admin/tax/summary
 *
 * Aggregate taxable earnings for every creator in a given tax year.
 *
 * Query params:
 *   - year      (required)  Four-digit calendar year, e.g. 2026
 *   - threshold (optional)  1099-NEC threshold in USDC cents (default 60000 = $600)
 *   - page      (optional)  1-based page number (default 1)
 *   - limit     (optional)  Results per page, 1-200 (default 50)
 */
export async function GET(request: NextRequest) {
  try {
    const { error: authError } = await getAuthenticatedAdmin();
    if (authError) return authError;

    // --- Parse & validate query params ---
    const params = request.nextUrl.searchParams;

    const yearRaw = params.get("year");
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

    const threshold = parseInt(
      params.get("threshold") ?? String(DEFAULT_1099_THRESHOLD),
      10,
    );
    if (Number.isNaN(threshold) || threshold < 0) {
      return NextResponse.json(
        { error: "threshold must be a non-negative integer", code: "INVALID_THRESHOLD" },
        { status: 400 },
      );
    }

    const page = Math.max(parseInt(params.get("page") ?? "1", 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(params.get("limit") ?? "50", 10) || 50, 1),
      200,
    );
    const offset = (page - 1) * limit;

    const { start, end } = formatTaxYear(year);

    // --- Aggregate earnings across all three revenue streams ---
    // Each CTE sums per-creator earnings within the tax year window.
    // PPV requires a join through posts to resolve creator_id.
    const rows = await db.execute(sql`
      WITH sub_earnings AS (
        SELECT
          creator_id,
          COALESCE(SUM(price_usdc), 0)::int AS total
        FROM subscriptions
        WHERE created_at >= ${start.toISOString()}
          AND created_at <= ${end.toISOString()}
        GROUP BY creator_id
      ),
      tip_earnings AS (
        SELECT
          creator_id,
          COALESCE(SUM(amount_usdc), 0)::int AS total
        FROM tips
        WHERE created_at >= ${start.toISOString()}
          AND created_at <= ${end.toISOString()}
        GROUP BY creator_id
      ),
      ppv_earnings AS (
        SELECT
          p.creator_id,
          COALESCE(SUM(pp.amount_usdc), 0)::int AS total
        FROM ppv_purchases pp
        INNER JOIN posts p ON pp.post_id = p.id
        WHERE pp.created_at >= ${start.toISOString()}
          AND pp.created_at <= ${end.toISOString()}
        GROUP BY p.creator_id
      ),
      payout_totals AS (
        SELECT
          creator_id,
          COALESCE(SUM(amount_usdc), 0)::int AS total
        FROM payouts
        WHERE status = 'completed'
          AND created_at >= ${start.toISOString()}
          AND created_at <= ${end.toISOString()}
        GROUP BY creator_id
      ),
      combined AS (
        SELECT creator_id FROM sub_earnings
        UNION
        SELECT creator_id FROM tip_earnings
        UNION
        SELECT creator_id FROM ppv_earnings
      ),
      summary AS (
        SELECT
          c.creator_id                                               AS user_id,
          u.username,
          u.display_name,
          u.email,
          COALESCE(se.total, 0)                                      AS subscription_earnings,
          COALESCE(te.total, 0)                                      AS tip_earnings,
          COALESCE(pe.total, 0)                                      AS ppv_earnings,
          (COALESCE(se.total, 0)
            + COALESCE(te.total, 0)
            + COALESCE(pe.total, 0))                                 AS gross_earnings_usdc,
          FLOOR(
            (COALESCE(se.total, 0)
              + COALESCE(te.total, 0)
              + COALESCE(pe.total, 0)) * ${CREATOR_SHARE_RATE}
          )::int                                                     AS net_earnings_usdc,
          COALESCE(pt.total, 0)                                      AS total_payouts_usdc,
          CASE
            WHEN cp.verification_status = 'verified' THEN true
            ELSE false
          END                                                        AS has_tax_info
        FROM combined c
        INNER JOIN users_table u       ON u.id = c.creator_id
        LEFT  JOIN sub_earnings se     ON se.creator_id = c.creator_id
        LEFT  JOIN tip_earnings te     ON te.creator_id = c.creator_id
        LEFT  JOIN ppv_earnings pe     ON pe.creator_id = c.creator_id
        LEFT  JOIN payout_totals pt    ON pt.creator_id = c.creator_id
        LEFT  JOIN creator_profiles cp ON cp.user_id    = c.creator_id
        WHERE (COALESCE(se.total, 0)
              + COALESCE(te.total, 0)
              + COALESCE(pe.total, 0)) > 0
      )
      SELECT
        s.*,
        s.net_earnings_usdc >= ${threshold} AS is_above_threshold,
        COUNT(*) OVER ()::int              AS _total_count
      FROM summary s
      ORDER BY s.net_earnings_usdc DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `);

    const totalCount = rows.length > 0 ? (rows[0] as Record<string, unknown>)._total_count as number : 0;

    const creators = rows.map((row: Record<string, unknown>) => ({
      user_id: row.user_id,
      username: row.username,
      display_name: row.display_name,
      email: row.email,
      gross_earnings_usdc: Number(row.gross_earnings_usdc),
      net_earnings_usdc: Number(row.net_earnings_usdc),
      subscription_earnings: Number(row.subscription_earnings),
      tip_earnings: Number(row.tip_earnings),
      ppv_earnings: Number(row.ppv_earnings),
      total_payouts_usdc: Number(row.total_payouts_usdc),
      has_tax_info: Boolean(row.has_tax_info),
      is_above_threshold: Boolean(row.is_above_threshold),
    }));

    return NextResponse.json({
      data: {
        year,
        threshold,
        creators,
        pagination: {
          page,
          limit,
          total: totalCount,
          total_pages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error) {
    console.error("GET /api/admin/tax/summary error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
