export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { complianceRecordsTable, usersTable } from "@/utils/db/schema";
import { eq, ilike, or, sql } from "drizzle-orm";
import { getAuthenticatedAdmin } from "@/utils/api/auth";

/**
 * GET /api/admin/compliance
 * List all 2257 compliance records with creator info.
 *
 * Query params:
 *   - search: filter by creator legal name, display name, or username
 *   - format: "csv" to download as CSV for audit export
 */
export async function GET(request: NextRequest) {
  try {
    const { error: authError } = await getAuthenticatedAdmin();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const format = searchParams.get("format");

    // Alias the users table for the admin who verified
    const adminAlias = sql`admin_users`;

    const results = await db
      .select({
        id: complianceRecordsTable.id,
        creator_id: complianceRecordsTable.creator_id,
        legal_name: complianceRecordsTable.legal_name,
        date_of_birth: complianceRecordsTable.date_of_birth,
        document_type: complianceRecordsTable.document_type,
        document_url: complianceRecordsTable.document_url,
        selfie_url: complianceRecordsTable.selfie_url,
        verified_at: complianceRecordsTable.verified_at,
        verified_by: complianceRecordsTable.verified_by,
        is_active: complianceRecordsTable.is_active,
        created_at: complianceRecordsTable.created_at,
        // Creator info
        display_name: usersTable.display_name,
        username: usersTable.username,
        email: usersTable.email,
        avatar_url: usersTable.avatar_url,
        // Admin display name via raw SQL (self-join workaround)
        admin_display_name: sql<string | null>`(
          SELECT display_name FROM users_table WHERE id = ${complianceRecordsTable.verified_by}
        )`,
      })
      .from(complianceRecordsTable)
      .innerJoin(usersTable, eq(complianceRecordsTable.creator_id, usersTable.id))
      .where(
        search
          ? or(
              ilike(complianceRecordsTable.legal_name, `%${search}%`),
              ilike(usersTable.display_name, `%${search}%`),
              ilike(usersTable.username, `%${search}%`),
            )
          : undefined,
      )
      .orderBy(sql`${complianceRecordsTable.created_at} DESC`);

    // CSV export for audits
    if (format === "csv") {
      const csvSafe = (value: string | null | undefined): string => {
        if (!value) return '""';
        const escaped = value.replace(/"/g, '""');
        return `"${escaped}"`;
      };

      const headers = [
        "ID",
        "Creator ID",
        "Legal Name",
        "Date of Birth",
        "Document Type",
        "Document URL",
        "Selfie URL",
        "Verified At",
        "Verified By (Admin)",
        "Active",
        "Created At",
        "Display Name",
        "Username",
        "Email",
      ];

      const csvRows = [headers.join(",")];

      for (const r of results) {
        const row = [
          csvSafe(String(r.id)),
          csvSafe(r.creator_id),
          csvSafe(r.legal_name),
          csvSafe(r.date_of_birth),
          csvSafe(r.document_type),
          csvSafe(r.document_url),
          csvSafe(r.selfie_url),
          csvSafe(r.verified_at ? new Date(r.verified_at).toISOString() : null),
          csvSafe(r.admin_display_name || r.verified_by || null),
          csvSafe(r.is_active ? "Yes" : "No"),
          csvSafe(r.created_at ? new Date(r.created_at).toISOString() : null),
          csvSafe(r.display_name),
          csvSafe(r.username),
          csvSafe(r.email),
        ];
        csvRows.push(row.join(","));
      }

      const csvContent = csvRows.join("\n");

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="2257-compliance-records-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json({ data: results });
  } catch (err) {
    console.error("GET /api/admin/compliance error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
