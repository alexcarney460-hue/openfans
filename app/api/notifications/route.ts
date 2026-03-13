import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { notificationsTable } from "@/utils/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { getAuthenticatedUser } from "@/utils/api/auth";

/**
 * GET /api/notifications
 * Return the authenticated user's notifications (most recent 50).
 *
 * Query params:
 *   - unread_only: "true" to filter only unread notifications
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread_only") === "true";

    const conditions = [eq(notificationsTable.user_id, user.id)];
    if (unreadOnly) {
      conditions.push(eq(notificationsTable.is_read, false));
    }

    const notifications = await db
      .select()
      .from(notificationsTable)
      .where(and(...conditions))
      .orderBy(desc(notificationsTable.created_at))
      .limit(50);

    return NextResponse.json({ data: notifications });
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/notifications
 * Mark notification(s) as read.
 *
 * Body:
 *   - id: number (optional, mark a single notification as read)
 *   - mark_all_read: boolean (optional, mark all as read)
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body", code: "INVALID_BODY" },
        { status: 400 },
      );
    }

    const { id, mark_all_read } = body;

    if (mark_all_read === true) {
      await db
        .update(notificationsTable)
        .set({ is_read: true })
        .where(
          and(
            eq(notificationsTable.user_id, user.id),
            eq(notificationsTable.is_read, false),
          ),
        );

      return NextResponse.json({ data: { success: true } });
    }

    if (typeof id === "number") {
      const updated = await db
        .update(notificationsTable)
        .set({ is_read: true })
        .where(
          and(
            eq(notificationsTable.id, id),
            eq(notificationsTable.user_id, user.id),
          ),
        )
        .returning();

      if (updated.length === 0) {
        return NextResponse.json(
          { error: "Notification not found", code: "NOT_FOUND" },
          { status: 404 },
        );
      }

      return NextResponse.json({ data: updated[0] });
    }

    return NextResponse.json(
      { error: "Provide 'id' or 'mark_all_read'", code: "INVALID_BODY" },
      { status: 400 },
    );
  } catch (error) {
    console.error("POST /api/notifications error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
