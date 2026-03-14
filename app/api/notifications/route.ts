export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { notificationsTable } from "@/utils/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { getAuthenticatedUser } from "@/utils/api/auth";

/**
 * GET /api/notifications
 * Return the authenticated user's notifications ordered by created_at DESC.
 *
 * Query params:
 *   - unread_only: "true" to filter only unread notifications
 *   - limit:  number of results (default 20, max 100)
 *   - offset: pagination offset (default 0)
 *   - count_only: "true" to return only the unread count (lightweight polling)
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread_only") === "true";
    const countOnly = searchParams.get("count_only") === "true";

    // Lightweight endpoint: return only unread count for polling
    if (countOnly) {
      const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(notificationsTable)
        .where(
          and(
            eq(notificationsTable.user_id, user.id),
            eq(notificationsTable.is_read, false),
          ),
        );

      return NextResponse.json({ data: { unread_count: result.count } });
    }

    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 1),
      100,
    );
    const offset = Math.max(
      parseInt(searchParams.get("offset") ?? "0", 10) || 0,
      0,
    );

    const conditions = [eq(notificationsTable.user_id, user.id)];
    if (unreadOnly) {
      conditions.push(eq(notificationsTable.is_read, false));
    }

    const whereClause = and(...conditions);

    // Fetch notifications and unread count in parallel
    const [notifications, [countResult]] = await Promise.all([
      db
        .select()
        .from(notificationsTable)
        .where(whereClause)
        .orderBy(desc(notificationsTable.created_at))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(notificationsTable)
        .where(
          and(
            eq(notificationsTable.user_id, user.id),
            eq(notificationsTable.is_read, false),
          ),
        ),
    ]);

    return NextResponse.json({
      data: notifications,
      unread_count: countResult.count,
      pagination: { limit, offset, has_more: notifications.length === limit },
    });
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/notifications
 * Mark notification(s) as read.
 *
 * Body:
 *   - ids: number[]  (mark specific notifications as read)
 *   - all: boolean    (mark all as read)
 */
export async function PATCH(request: NextRequest) {
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

    const { ids, all: markAll } = body;

    if (markAll === true) {
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

    if (Array.isArray(ids) && ids.length > 0) {
      const validIds = ids.filter(
        (id: unknown): id is number => typeof id === "number",
      );
      if (validIds.length === 0) {
        return NextResponse.json(
          { error: "ids must be an array of numbers", code: "INVALID_BODY" },
          { status: 400 },
        );
      }

      // Mark each notification as read (only if owned by user)
      for (const id of validIds) {
        await db
          .update(notificationsTable)
          .set({ is_read: true })
          .where(
            and(
              eq(notificationsTable.id, id),
              eq(notificationsTable.user_id, user.id),
            ),
          );
      }

      return NextResponse.json({ data: { success: true } });
    }

    return NextResponse.json(
      { error: "Provide 'ids' (number[]) or 'all' (true)", code: "INVALID_BODY" },
      { status: 400 },
    );
  } catch (error) {
    console.error("PATCH /api/notifications error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/notifications (legacy — kept for backward compatibility)
 * Mark notification(s) as read.
 *
 * Body:
 *   - id: number (mark a single notification as read)
 *   - mark_all_read: boolean (mark all as read)
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
