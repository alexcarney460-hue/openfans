export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { sql } from "drizzle-orm";
import { getAuthenticatedUser, getAuthenticatedAdmin } from "@/utils/api/auth";

// ---------------------------------------------------------------------------
// GET /api/support/[id]
// Get ticket detail with messages. Users can only see their own tickets.
// Admins can see any ticket.
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const ticketId = parseInt(params.id, 10);
    if (isNaN(ticketId)) {
      return NextResponse.json(
        { error: "Invalid ticket id", code: "INVALID_ID" },
        { status: 400 },
      );
    }

    // Fetch ticket
    const ticketResult = await db.execute(sql`
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
        u.avatar_url AS user_avatar_url
      FROM support_tickets st
      JOIN users_table u ON u.id = st.user_id
      WHERE st.id = ${ticketId}
    `);

    const ticket = (ticketResult as unknown as Array<Record<string, unknown>>)[0];

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    // Check authorization: user must own the ticket or be admin
    if (ticket.user_id !== user.id) {
      const { error: adminError } = await getAuthenticatedAdmin();
      if (adminError) {
        return NextResponse.json(
          { error: "Forbidden", code: "FORBIDDEN" },
          { status: 403 },
        );
      }
    }

    // Fetch messages
    const messages = await db.execute(sql`
      SELECT
        sm.id,
        sm.ticket_id,
        sm.sender_id,
        sm.body,
        sm.is_staff,
        sm.created_at,
        u.username AS sender_username,
        u.display_name AS sender_display_name,
        u.avatar_url AS sender_avatar_url
      FROM support_messages sm
      JOIN users_table u ON u.id = sm.sender_id
      WHERE sm.ticket_id = ${ticketId}
      ORDER BY sm.created_at ASC
    `);

    return NextResponse.json({
      data: {
        ticket,
        messages,
      },
    });
  } catch (error) {
    console.error("GET /api/support/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/support/[id]
// Update ticket status (admin only).
//
// Body:
//   - status: string (open, in_progress, resolved, closed)
//   - priority: string (optional: low, medium, high)
// ---------------------------------------------------------------------------

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { error: adminError } = await getAuthenticatedAdmin();
    if (adminError) return adminError;

    const ticketId = parseInt(params.id, 10);
    if (isNaN(ticketId)) {
      return NextResponse.json(
        { error: "Invalid ticket id", code: "INVALID_ID" },
        { status: 400 },
      );
    }

    const reqBody = await request.json().catch(() => null);
    if (!reqBody) {
      return NextResponse.json(
        { error: "Invalid JSON body", code: "INVALID_BODY" },
        { status: 400 },
      );
    }

    const { status, priority } = reqBody;

    const VALID_STATUSES = ["open", "in_progress", "resolved", "closed"];
    const VALID_PRIORITIES = ["low", "medium", "high"];

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${VALID_STATUSES.join(", ")}`, code: "INVALID_STATUS" },
        { status: 400 },
      );
    }

    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return NextResponse.json(
        { error: `priority must be one of: ${VALID_PRIORITIES.join(", ")}`, code: "INVALID_PRIORITY" },
        { status: 400 },
      );
    }

    // Build dynamic update
    const setClauses: ReturnType<typeof sql>[] = [];
    if (status) setClauses.push(sql`status = ${status}`);
    if (priority) setClauses.push(sql`priority = ${priority}`);
    setClauses.push(sql`updated_at = NOW()`);

    const setFragment = sql.join(setClauses, sql`, `);

    const result = await db.execute(sql`
      UPDATE support_tickets
      SET ${setFragment}
      WHERE id = ${ticketId}
      RETURNING id, subject, category, status, priority, created_at, updated_at
    `);

    const updated = (result as unknown as Array<Record<string, unknown>>)[0];
    if (!updated) {
      return NextResponse.json(
        { error: "Ticket not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("PATCH /api/support/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
