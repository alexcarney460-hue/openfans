export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { sql } from "drizzle-orm";
import { getAuthenticatedAdmin } from "@/utils/api/auth";

import { PLATFORM_FEE_RATE, CREATOR_SHARE_RATE } from "@/utils/tax-calculations";
const DEFAULT_THRESHOLD_CENTS = 60000; // $600
const MIN_TAX_YEAR = 2020;
const MAX_TAX_YEAR = 2030;

/**
 * Escape a value for CSV output.
 * Wraps in double-quotes if the value contains commas, quotes, or newlines.
 * Inner double-quotes are doubled per RFC 4180.
 */
function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Format cents as a USD dollar string with 2 decimal places.
 */
function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

interface CreatorEarningsRow {
  creator_id: string;
  display_name: string;
  legal_name: string | null;
  tax_id_last4: string | null;
  business_type: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string | null;
  gross_earnings_cents: string; // bigint comes back as string
}

/**
 * GET /api/admin/tax/export?year=2025&format=csv&threshold=60000&include_below_threshold=false
 *
 * Generates a 1099-NEC data export CSV for the given tax year.
 * Only accessible by admins.
 *
 * - Aggregates creator earnings from subscriptions, tips, and PPV purchases
 * - LEFT JOINs creator_tax_info for legal name, TIN last-4, and address
 * - Applies 95% creator share (5% platform fee)
 * - Filters by $600 threshold by default (IRS 1099-NEC requirement)
 * - NEVER includes full SSN/EIN -- only last 4 digits
 */
export async function GET(request: NextRequest) {
  try {
    const { error: authError } = await getAuthenticatedAdmin();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);

    // --- Parse and validate parameters ---

    const yearParam = searchParams.get("year");
    if (!yearParam) {
      return NextResponse.json(
        { error: "Missing required parameter: year", code: "MISSING_YEAR" },
        { status: 400 },
      );
    }

    const year = parseInt(yearParam, 10);
    if (isNaN(year) || year < MIN_TAX_YEAR || year > MAX_TAX_YEAR) {
      return NextResponse.json(
        {
          error: `Invalid year. Must be between ${MIN_TAX_YEAR} and ${MAX_TAX_YEAR}`,
          code: "INVALID_YEAR",
        },
        { status: 400 },
      );
    }

    const format = searchParams.get("format") || "csv";
    if (format !== "csv") {
      return NextResponse.json(
        { error: "Only CSV format is currently supported", code: "INVALID_FORMAT" },
        { status: 400 },
      );
    }

    const thresholdParam = searchParams.get("threshold");
    const thresholdCents = thresholdParam !== null
      ? parseInt(thresholdParam, 10)
      : DEFAULT_THRESHOLD_CENTS;

    if (isNaN(thresholdCents) || thresholdCents < 0) {
      return NextResponse.json(
        { error: "Invalid threshold. Must be a non-negative integer (cents)", code: "INVALID_THRESHOLD" },
        { status: 400 },
      );
    }

    const includeBelowThreshold = searchParams.get("include_below_threshold") === "true";

    // Date boundaries for the tax year
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year + 1}-01-01`;

    // Net earnings threshold in cents (creator share only)
    const netThresholdCents = Math.floor(thresholdCents * CREATOR_SHARE_RATE);

    // --- Query: aggregate all creator earnings for the year ---
    // Uses a CTE to UNION ALL three revenue sources, then aggregates per creator.
    // LEFT JOINs creator_tax_info for tax reporting fields.

    const thresholdCondition = includeBelowThreshold
      ? sql``
      : sql`HAVING SUM(e.amount_cents) * ${CREATOR_SHARE_RATE} >= ${netThresholdCents}`;

    const result = await db.execute(sql`
      WITH earnings AS (
        SELECT
          s.creator_id,
          s.price_usdc AS amount_cents
        FROM subscriptions s
        WHERE s.created_at >= ${yearStart}::date
          AND s.created_at < ${yearEnd}::date

        UNION ALL

        SELECT
          t.creator_id,
          t.amount_usdc AS amount_cents
        FROM tips t
        WHERE t.created_at >= ${yearStart}::date
          AND t.created_at < ${yearEnd}::date

        UNION ALL

        SELECT
          p.creator_id AS creator_id,
          pp.amount_usdc AS amount_cents
        FROM ppv_purchases pp
        JOIN posts p ON p.id = pp.post_id
        WHERE pp.created_at >= ${yearStart}::date
          AND pp.created_at < ${yearEnd}::date
      )
      SELECT
        e.creator_id,
        u.display_name,
        cti.legal_name,
        cti.tax_id_last4,
        cti.business_type,
        cti.address_line1,
        cti.address_line2,
        cti.city,
        cti.state,
        cti.zip_code,
        cti.country,
        SUM(e.amount_cents)::bigint AS gross_earnings_cents
      FROM earnings e
      JOIN users_table u ON u.id = e.creator_id
      LEFT JOIN creator_tax_info cti ON cti.user_id = e.creator_id
      GROUP BY
        e.creator_id,
        u.display_name,
        cti.legal_name,
        cti.tax_id_last4,
        cti.business_type,
        cti.address_line1,
        cti.address_line2,
        cti.city,
        cti.state,
        cti.zip_code,
        cti.country
      ${thresholdCondition}
      ORDER BY SUM(e.amount_cents) DESC
    `);

    const rows = result as unknown as CreatorEarningsRow[];

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        {
          error: `No creator earnings data found for tax year ${year}`,
          code: "NO_DATA",
        },
        { status: 404 },
      );
    }

    // --- Build CSV ---

    const platformName = process.env.PLATFORM_NAME || "OpenFans Inc";
    const platformEin = process.env.PLATFORM_EIN || "";

    const csvHeaders = [
      "tax_year",
      "payer_name",
      "payer_ein",
      "recipient_name",
      "recipient_tin_last4",
      "recipient_business_type",
      "recipient_address",
      "nonemployee_compensation_usd",
      "gross_earnings_usd",
      "platform_fees_usd",
      "has_complete_tax_info",
    ];

    const csvRows = rows.map((row) => {
      const grossCents = Number(row.gross_earnings_cents);
      const netCents = Math.round(grossCents * CREATOR_SHARE_RATE);
      const feeCents = grossCents - netCents;

      const recipientName = row.legal_name || row.display_name;
      const tinLast4 = row.tax_id_last4 || "N/A";
      const businessType = row.business_type || "";

      // Format address from available fields
      const addressParts = [
        row.address_line1,
        row.address_line2,
        row.city,
        row.state && row.zip_code ? `${row.state} ${row.zip_code}` : (row.state || row.zip_code),
        row.country,
      ].filter(Boolean);
      const recipientAddress = addressParts.join(", ");

      const hasCompleteTaxInfo = Boolean(
        row.legal_name &&
        row.tax_id_last4 &&
        row.address_line1 &&
        row.city &&
        row.state &&
        row.zip_code,
      );

      return [
        year,
        csvEscape(platformName),
        csvEscape(platformEin),
        csvEscape(recipientName),
        csvEscape(tinLast4),
        csvEscape(businessType),
        csvEscape(recipientAddress),
        centsToDollars(netCents),
        centsToDollars(grossCents),
        centsToDollars(feeCents),
        hasCompleteTaxInfo ? "true" : "false",
      ].join(",");
    });

    const csvContent = [csvHeaders.join(","), ...csvRows].join("\n");
    const filename = `1099-nec-data-${year}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/admin/tax/export error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
