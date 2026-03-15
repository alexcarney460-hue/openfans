export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { sql } from "drizzle-orm";
import { getAuthenticatedUser, getAuthenticatedAdmin } from "@/utils/api/auth";

// ---------------------------------------------------------------------------
// POST /api/support/[id]/messages
// Add a reply to a support ticket.
//
// Body:
//   - body: string (required, max 5000 chars)
//
// Users can reply to their own tickets. Admins can reply to any ticket.
// When an admin replies, is_staff is set to true and the ticket status
// is automatically set to "in_progress" if it was "open".
// ---------------------------------------------------------------------------

export async function POST(
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

    const reqBody = await request.json().catch(() => null);
    if (!reqBody) {
      return NextResponse.json(
        { error: "Invalid JSON body", code: "INVALID_BODY" },
        { status: 400 },
      );
    }

    const { body } = reqBody;

    // Validate body
    if (!body || typeof body !== "string" || body.trim().length === 0) {
      return NextResponse.json(
        { error: "body is required", code: "MISSING_BODY" },
        { status: 400 },
      );
    }
    if (body.trim().length > 5000) {
      return NextResponse.json(
        { error: "body must be 5000 characters or fewer", code: "BODY_TOO_LONG" },
        { status: 400 },
      );
    }

    // Fetch ticket to verify access
    const ticketResult = await db.execute(sql`
      SELECT id, user_id, status
      FROM support_tickets
      WHERE id = ${ticketId}
    `);

    const ticket = (ticketResult as unknown as Array<{ id: number; user_id: string; status: string }>)[0];

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    // Determine if the sender is staff
    let isStaff = false;
    if (ticket.user_id !== user.id) {
      // Not the ticket owner — must be admin
      const { error: adminError } = await getAuthenticatedAdmin();
      if (adminError) {
        return NextResponse.json(
          { error: "Forbidden", code: "FORBIDDEN" },
          { status: 403 },
        );
      }
      isStaff = true;
    }

    // Prevent replying to closed tickets
    if (ticket.status === "closed") {
      return NextResponse.json(
        { error: "Cannot reply to a closed ticket", code: "TICKET_CLOSED" },
        { status: 400 },
      );
    }

    // Insert message
    const messageResult = await db.execute(sql`
      INSERT INTO support_messages (ticket_id, sender_id, body, is_staff)
      VALUES (${ticketId}, ${user.id}, ${body.trim()}, ${isStaff})
      RETURNING id, ticket_id, sender_id, body, is_staff, created_at
    `);

    // Update ticket's updated_at timestamp. If admin is replying and ticket is
    // "open", auto-advance to "in_progress".
    if (isStaff && ticket.status === "open") {
      await db.execute(sql`
        UPDATE support_tickets
        SET status = 'in_progress', updated_at = NOW()
        WHERE id = ${ticketId}
      `);
    } else {
      await db.execute(sql`
        UPDATE support_tickets
        SET updated_at = NOW()
        WHERE id = ${ticketId}
      `);
    }

    const message = (messageResult as unknown as Array<Record<string, unknown>>)[0];

    return NextResponse.json({ data: message }, { status: 201 });
  } catch (error) {
    console.error("POST /api/support/[id]/messages error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
