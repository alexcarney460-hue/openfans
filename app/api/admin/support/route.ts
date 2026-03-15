export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { sql } from "drizzle-orm";
import { getAuthenticatedAdmin } from "@/utils/api/auth";

// ---------------------------------------------------------------------------
// GET /api/admin/support
// List all support tickets (admin only).
//
// Query params:
//   - status: filter by status (open, in_progress, resolved, closed)
//   - priority: filter by priority (low, medium, high)
//   - page: page number (default 1)
//   - limit: results per page (default 20, max 50)
//   - search: search in subject text
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const { error: adminError } = await getAuthenticatedAdmin();
    if (adminError) return adminError;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status")?.trim() || null;
    const priority = searchParams.get("priority")?.trim() || null;
    const search = searchParams.get("search")?.trim() || null;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));
    const offset = (page - 1) * limit;

    // Build WHERE conditions
    const conditions: ReturnType<typeof sql>[] = [sql`1 = 1`];

    if (status) {
      conditions.push(sql`st.status = ${status}`);
    }
    if (priority) {
      conditions.push(sql`st.priority = ${priority}`);
    }
    if (search) {
      conditions.push(sql`st.subject ILIKE ${"%" + search + "%"}`);
    }

    const whereClause = sql.join(conditions, sql` AND `);

    const tickets = await db.execute(sql`
      SELECT
        st.id,
        st.user_id,
        st.subject,
        st.category,
        st.status,
        st.priority,
        st.created_at,
        st.updated_at,
        u.username AS user_username,
        u.display_name AS user_display_name,
        u.avatar_url AS user_avatar_url,
        (
          SELECT COUNT(*)::int
          FROM support_messages sm
          WHERE sm.ticket_id = st.id
        ) AS message_count,
        (
          SELECT COUNT(*)::int
          FROM support_messages sm
          WHERE sm.ticket_id = st.id AND sm.is_staff = false
        ) AS user_message_count
      FROM support_tickets st
      JOIN users_table u ON u.id = st.user_id
      WHERE ${whereClause}
      ORDER BY
        CASE st.status
          WHEN 'open' THEN 0
          WHEN 'in_progress' THEN 1
          WHEN 'resolved' THEN 2
          WHEN 'closed' THEN 3
        END ASC,
        CASE st.priority
          WHEN 'high' THEN 0
          WHEN 'medium' THEN 1
          WHEN 'low' THEN 2
        END ASC,
        st.updated_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `);

    const countResult = await db.execute(sql`
      SELECT COUNT(*)::int AS total
      FROM support_tickets st
      WHERE ${whereClause}
    `);

    const total = (countResult as unknown as Array<{ total: number }>)[0]?.total ?? 0;

    // Summary counts
    const summaryResult = await db.execute(sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'open')::int AS open_count,
        COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress_count,
        COUNT(*) FILTER (WHERE status = 'resolved')::int AS resolved_count,
        COUNT(*) FILTER (WHERE status = 'closed')::int AS closed_count,
        COUNT(*)::int AS total_count
      FROM support_tickets
    `);

    const summary = (summaryResult as unknown as Array<Record<string, number>>)[0];

    return NextResponse.json({
      data: {
        tickets,
        total,
        page,
        limit,
        summary,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/support error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
