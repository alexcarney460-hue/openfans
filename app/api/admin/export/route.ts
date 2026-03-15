export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { sql } from "drizzle-orm";
import { getAuthenticatedAdmin } from "@/utils/api/auth";

/**
 * GET /api/admin/export?type=revenue|users|payouts&from=YYYY-MM-DD&to=YYYY-MM-DD
 * Export platform data as CSV for admin download.
 */
export async function GET(request: NextRequest) {
  try {
    const { error: authError } = await getAuthenticatedAdmin();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "revenue";
    const from = searchParams.get("from") || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const to = searchParams.get("to") || new Date().toISOString().slice(0, 10);

    let rows: Record<string, unknown>[];
    let filename: string;

    switch (type) {
      case "revenue": {
        const result = await db.execute(sql`
          (
            SELECT
              'subscription' AS type,
              s.id::text,
              u_sub.username AS subscriber,
              u_cre.username AS creator,
              s.price_usdc AS amount_cents,
              s.tier,
              s.payment_tx AS tx_hash,
              s.created_at::text AS date
            FROM subscriptions s
            JOIN users_table u_sub ON u_sub.id = s.subscriber_id
            JOIN users_table u_cre ON u_cre.id = s.creator_id
            WHERE s.created_at >= ${from}::date AND s.created_at < (${to}::date + 1)
          )
          UNION ALL
          (
            SELECT
              'tip' AS type,
              t.id::text,
              u_tip.username AS subscriber,
              u_cre.username AS creator,
              t.amount_usdc AS amount_cents,
              NULL AS tier,
              t.payment_tx AS tx_hash,
              t.created_at::text AS date
            FROM tips t
            JOIN users_table u_tip ON u_tip.id = t.tipper_id
            JOIN users_table u_cre ON u_cre.id = t.creator_id
            WHERE t.created_at >= ${from}::date AND t.created_at < (${to}::date + 1)
          )
          UNION ALL
          (
            SELECT
              'ppv' AS type,
              pp.id::text,
              u_buy.username AS subscriber,
              u_cre.username AS creator,
              pp.amount_usdc AS amount_cents,
              NULL AS tier,
              pp.payment_tx AS tx_hash,
              pp.created_at::text AS date
            FROM ppv_purchases pp
            JOIN users_table u_buy ON u_buy.id = pp.buyer_id
            JOIN posts p ON p.id = pp.post_id
            JOIN users_table u_cre ON u_cre.id = p.creator_id
            WHERE pp.created_at >= ${from}::date AND pp.created_at < (${to}::date + 1)
          )
          ORDER BY date DESC
        `);
        rows = result as Record<string, unknown>[];
        filename = `revenue-${from}-to-${to}.csv`;
        break;
      }

      case "users": {
        const result = await db.execute(sql`
          SELECT
            u.id::text,
            u.username,
            u.display_name,
            u.email,
            u.role,
            u.is_verified::text AS verified,
            u.is_suspended::text AS suspended,
            u.created_at::text AS joined
          FROM users_table u
          WHERE u.created_at >= ${from}::date AND u.created_at < (${to}::date + 1)
          ORDER BY u.created_at DESC
        `);
        rows = result as Record<string, unknown>[];
        filename = `users-${from}-to-${to}.csv`;
        break;
      }

      case "payouts": {
        const result = await db.execute(sql`
          SELECT
            p.id::text,
            u.username AS creator,
            p.amount_usdc AS amount_cents,
            p.wallet_address,
            p.status,
            p.payment_tx AS tx_hash,
            p.created_at::text AS date
          FROM payouts p
          JOIN users_table u ON u.id = p.creator_id
          WHERE p.created_at >= ${from}::date AND p.created_at < (${to}::date + 1)
          ORDER BY p.created_at DESC
        `);
        rows = result as Record<string, unknown>[];
        filename = `payouts-${from}-to-${to}.csv`;
        break;
      }

      default:
        return NextResponse.json(
          { error: "Invalid export type. Use: revenue, users, or payouts", code: "INVALID_TYPE" },
          { status: 400 },
        );
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "No data found for the given date range", code: "NO_DATA" },
        { status: 404 },
      );
    }

    // Build CSV
    const headers = Object.keys(rows[0]);
    const csvLines = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((h) => {
            const val = row[h];
            if (val === null || val === undefined) return "";
            const str = String(val);
            return str.includes(",") || str.includes('"') || str.includes("\n")
              ? `"${str.replace(/"/g, '""')}"`
              : str;
          })
          .join(","),
      ),
    ];

    return new NextResponse(csvLines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/export error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
