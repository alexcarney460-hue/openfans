export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { usersTable } from "@/utils/db/schema";
import { sql, ilike, or, eq } from "drizzle-orm";
import { getAuthenticatedAdmin } from "@/utils/api/auth";

/**
 * GET /api/admin/users
 * List all users with optional search and status filter.
 *
 * Query params:
 *   - search: string (filter by username or email, case-insensitive)
 *   - status: "all" | "active" | "suspended" (default: "all")
 */
export async function GET(request: NextRequest) {
  try {
    const { error: authError } = await getAuthenticatedAdmin();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() ?? "";
    const status = searchParams.get("status") ?? "all";

    // Pagination: clamp limit to 1-100, default 50; page starts at 1
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "50", 10) || 50, 1), 100);
    const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10) || 1, 1);
    const offset = (page - 1) * limit;

    const conditions = [];

    // Search filter
    if (search.length > 0) {
      const pattern = `%${search}%`;
      conditions.push(
        or(
          ilike(usersTable.username, pattern),
          ilike(usersTable.email, pattern),
          ilike(usersTable.display_name, pattern),
        ),
      );
    }

    // Status filter
    if (status === "active") {
      conditions.push(eq(usersTable.is_suspended, false));
    } else if (status === "suspended") {
      conditions.push(eq(usersTable.is_suspended, true));
    }

    const whereClause =
      conditions.length > 0
        ? sql`${sql.join(
            conditions.map((c) => sql`(${c})`),
            sql` AND `,
          )}`
        : undefined;

    // Get total count for pagination metadata
    const [countResult] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(usersTable)
      .where(whereClause);
    const total = countResult?.count ?? 0;

    const users = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        email: usersTable.email,
        display_name: usersTable.display_name,
        avatar_url: usersTable.avatar_url,
        role: usersTable.role,
        is_suspended: usersTable.is_suspended,
        suspended_at: usersTable.suspended_at,
        suspension_reason: usersTable.suspension_reason,
        created_at: usersTable.created_at,
      })
      .from(usersTable)
      .where(whereClause)
      .orderBy(sql`${usersTable.created_at} DESC`)
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data: {
        users,
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("GET /api/admin/users error:", message);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
