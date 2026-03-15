export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { sql } from "drizzle-orm";
import { getAuthenticatedUser } from "@/utils/api/auth";

// ---------------------------------------------------------------------------
// Allowed values
// ---------------------------------------------------------------------------

const VALID_CATEGORIES = [
  "account",
  "billing",
  "content",
  "technical",
  "other",
] as const;

const VALID_PRIORITIES = ["low", "medium", "high"] as const;

// ---------------------------------------------------------------------------
// GET /api/support
// List the authenticated user's support tickets.
//
// Query params:
//   - status: filter by status (open, in_progress, resolved, closed)
//   - page: page number (default 1)
//   - limit: results per page (default 20, max 50)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status")?.trim() || null;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));
    const offset = (page - 1) * limit;

    const statusCondition = status
      ? sql`AND st.status = ${status}`
      : sql``;

    const tickets = await db.execute(sql`
      SELECT
        st.id,
        st.subject,
        st.category,
        st.status,
        st.priority,
        st.created_at,
        st.updated_at,
        (
          SELECT COUNT(*)::int
          FROM support_messages sm
          WHERE sm.ticket_id = st.id
        ) AS message_count
      FROM support_tickets st
      WHERE st.user_id = ${user.id}
        ${statusCondition}
      ORDER BY st.updated_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `);

    const countResult = await db.execute(sql`
      SELECT COUNT(*)::int AS total
      FROM support_tickets st
      WHERE st.user_id = ${user.id}
        ${statusCondition}
    `);

    const total = (countResult as unknown as Array<{ total: number }>)[0]?.total ?? 0;

    return NextResponse.json({
      data: {
        tickets,
        total,
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("GET /api/support error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/support
// Create a new support ticket.
//
// Body:
//   - subject: string (required, max 200 chars)
//   - category: string (required, one of VALID_CATEGORIES)
//   - body: string (required, max 5000 chars) - initial message
//   - priority: string (optional, defaults to "medium")
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const reqBody = await request.json().catch(() => null);
    if (!reqBody) {
      return NextResponse.json(
        { error: "Invalid JSON body", code: "INVALID_BODY" },
        { status: 400 },
      );
    }

    const { subject, category, body, priority } = reqBody;

    // Rate limit: max 5 tickets per hour per user
    const recentTickets = await db.execute(sql`
      SELECT COUNT(*)::int AS count FROM support_tickets
      WHERE user_id = ${user.id}
        AND created_at > NOW() - INTERVAL '1 hour'
    `);
    const ticketCount = (recentTickets as unknown as Array<{ count: number }>)[0]?.count ?? 0;
    if (ticketCount >= 5) {
      return NextResponse.json(
        { error: "Too many tickets. Please wait before creating another.", code: "RATE_LIMITED" },
        { status: 429 },
      );
    }

    // Validate subject
    if (!subject || typeof subject !== "string" || subject.trim().length === 0) {
      return NextResponse.json(
        { error: "subject is required", code: "MISSING_SUBJECT" },
        { status: 400 },
      );
    }
    if (subject.trim().length > 200) {
      return NextResponse.json(
        { error: "subject must be 200 characters or fewer", code: "SUBJECT_TOO_LONG" },
        { status: 400 },
      );
    }

    // Validate category
    if (!category || !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `category must be one of: ${VALID_CATEGORIES.join(", ")}`, code: "INVALID_CATEGORY" },
        { status: 400 },
      );
    }

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

    // Validate priority
    const validatedPriority = priority && VALID_PRIORITIES.includes(priority)
      ? priority
      : "medium";

    // Create ticket
    const ticketResult = await db.execute(sql`
      INSERT INTO support_tickets (user_id, subject, category, status, priority)
      VALUES (${user.id}, ${subject.trim()}, ${category}, 'open', ${validatedPriority})
      RETURNING id, subject, category, status, priority, created_at, updated_at
    `);

    const ticket = (ticketResult as unknown as Array<Record<string, unknown>>)[0];

    // Create initial message
    await db.execute(sql`
      INSERT INTO support_messages (ticket_id, sender_id, body, is_staff)
      VALUES (${ticket.id}, ${user.id}, ${body.trim()}, false)
    `);

    return NextResponse.json({ data: ticket }, { status: 201 });
  } catch (error) {
    console.error("POST /api/support error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
