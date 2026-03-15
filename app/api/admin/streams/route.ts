export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/utils/api/auth";
import { db } from "@/utils/db/db";
import { sql } from "drizzle-orm";
import { UUID_REGEX } from "@/utils/streaming/constants";

const VALID_STATUSES = ["live", "scheduled", "ended", "cancelled"] as const;
type StatusFilter = (typeof VALID_STATUSES)[number];

/**
 * GET /api/admin/streams
 *
 * List all streams with creator info, status, viewer stats.
 * Paginated and filterable by status.
 *
 * Query params:
 *   - status: filter by stream status (one of: live, scheduled, ended, cancelled)
 *   - page: page number (default 1)
 *   - limit: items per page (default 20, max 50)
 */
export async function GET(request: NextRequest) {
  try {
    const { error: authError } = await getAuthenticatedAdmin();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") as StatusFilter | null;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20));
    const offset = (page - 1) * limit;

    // Validate status filter
    if (statusFilter && !VALID_STATUSES.includes(statusFilter)) {
      return NextResponse.json(
        { error: `Invalid status: ${statusFilter}`, code: "INVALID_STATUS" },
        { status: 400 },
      );
    }

    // Summary stats query
    const summaryQuery = db.execute(sql`
      SELECT
        COALESCE(SUM(CASE WHEN status = 'live' THEN 1 ELSE 0 END), 0)::int AS currently_live,
        COALESCE(SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END), 0)::int AS scheduled,
        COALESCE(COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE), 0)::int AS total_today,
        COALESCE(MAX(peak_viewers), 0)::int AS peak_concurrent_viewers
      FROM live_streams
    `);

    // Build main query with optional status filter
    let streamsQuery;
    let countQuery;

    if (statusFilter) {
      streamsQuery = db.execute(sql`
        SELECT
          ls.id,
          ls.creator_id,
          ls.title,
          ls.description,
          ls.status,
          ls.scheduled_at,
          ls.started_at,
          ls.ended_at,
          ls.viewer_count,
          ls.peak_viewers,
          ls.is_subscriber_only,
          ls.chat_enabled,
          ls.created_at,
          ls.updated_at,
          u.username AS creator_username,
          u.display_name AS creator_display_name,
          u.avatar_url AS creator_avatar_url
        FROM live_streams ls
        JOIN users_table u ON u.id = ls.creator_id
        WHERE ls.status = ${statusFilter}::stream_status
        ORDER BY
          CASE WHEN ls.status = 'live' THEN 0
               WHEN ls.status = 'scheduled' THEN 1
               ELSE 2
          END,
          ls.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `);

      countQuery = db.execute(sql`
        SELECT COUNT(*)::int AS total
        FROM live_streams
        WHERE status = ${statusFilter}::stream_status
      `);
    } else {
      streamsQuery = db.execute(sql`
        SELECT
          ls.id,
          ls.creator_id,
          ls.title,
          ls.description,
          ls.status,
          ls.scheduled_at,
          ls.started_at,
          ls.ended_at,
          ls.viewer_count,
          ls.peak_viewers,
          ls.is_subscriber_only,
          ls.chat_enabled,
          ls.created_at,
          ls.updated_at,
          u.username AS creator_username,
          u.display_name AS creator_display_name,
          u.avatar_url AS creator_avatar_url
        FROM live_streams ls
        JOIN users_table u ON u.id = ls.creator_id
        ORDER BY
          CASE WHEN ls.status = 'live' THEN 0
               WHEN ls.status = 'scheduled' THEN 1
               ELSE 2
          END,
          ls.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `);

      countQuery = db.execute(sql`
        SELECT COUNT(*)::int AS total FROM live_streams
      `);
    }

    const [summary, streams, countResult] = await Promise.all([
      summaryQuery,
      streamsQuery,
      countQuery,
    ]);

    const total = (countResult[0]?.total as number) ?? 0;
    const stats = summary[0] ?? {
      currently_live: 0,
      scheduled: 0,
      total_today: 0,
      peak_concurrent_viewers: 0,
    };

    const data = streams.map((row) => ({
      id: row.id,
      creator_id: row.creator_id,
      title: row.title,
      description: row.description,
      status: row.status,
      scheduled_at: row.scheduled_at,
      started_at: row.started_at,
      ended_at: row.ended_at,
      viewer_count: row.viewer_count,
      peak_viewers: row.peak_viewers,
      is_subscriber_only: row.is_subscriber_only,
      chat_enabled: row.chat_enabled,
      created_at: row.created_at,
      updated_at: row.updated_at,
      creator: {
        username: row.creator_username,
        display_name: row.creator_display_name,
        avatar_url: row.creator_avatar_url,
      },
    }));

    return NextResponse.json({
      data,
      summary: stats,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("GET /api/admin/streams error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/streams
 *
 * Admin force-end a live stream or delete a scheduled one.
 *
 * Body: {
 *   stream_id: string (UUID),
 *   reason: string (required, max 500 chars)
 * }
 *
 * - If status is "live", transitions to "ended" (force-end).
 * - If status is "scheduled", deletes the stream entirely.
 * - Other statuses are rejected.
 */
export async function DELETE(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedAdmin();
    if (authError) return authError;

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body", code: "INVALID_BODY" },
        { status: 400 },
      );
    }

    const { stream_id, reason } = body;

    // Validate stream_id
    if (!stream_id || typeof stream_id !== "string" || !UUID_REGEX.test(stream_id)) {
      return NextResponse.json(
        { error: "stream_id is required and must be a valid UUID", code: "INVALID_STREAM_ID" },
        { status: 400 },
      );
    }

    // Validate reason
    if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
      return NextResponse.json(
        { error: "reason is required", code: "MISSING_REASON" },
        { status: 400 },
      );
    }
    if (reason.length > 500) {
      return NextResponse.json(
        { error: "reason must be 500 characters or less", code: "REASON_TOO_LONG" },
        { status: 400 },
      );
    }

    // Fetch the stream
    const streamRows = await db.execute(sql`
      SELECT id, creator_id, status, title FROM live_streams WHERE id = ${stream_id} LIMIT 1
    `);

    if (streamRows.length === 0) {
      return NextResponse.json(
        { error: "Stream not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    const stream = streamRows[0];

    if (stream.status === "live") {
      // Force-end the live stream
      const now = new Date().toISOString();

      await db.execute(sql`
        UPDATE live_streams
        SET status = 'ended'::stream_status,
            ended_at = ${now},
            updated_at = ${now}
        WHERE id = ${stream_id}
      `);

      // Mark all viewers as left
      await db.execute(sql`
        UPDATE live_stream_viewers
        SET left_at = NOW()
        WHERE stream_id = ${stream_id} AND left_at IS NULL
      `);

      // Notify the creator that their stream was force-ended
      await db.execute(sql`
        INSERT INTO notifications (user_id, type, title, body, reference_id, created_at)
        VALUES (
          ${stream.creator_id as string},
          'new_message',
          ${"Stream ended by admin"},
          ${`Your stream "${stream.title}" was ended by an admin. Reason: ${reason.trim()}`},
          ${stream_id},
          NOW()
        )
      `);

      return NextResponse.json({
        data: {
          action: "force_ended",
          stream_id,
          reason: reason.trim(),
        },
      });
    }

    if (stream.status === "scheduled") {
      // Delete the scheduled stream and associated records
      await db.execute(sql`DELETE FROM live_chat_messages WHERE stream_id = ${stream_id}`);
      await db.execute(sql`DELETE FROM live_stream_viewers WHERE stream_id = ${stream_id}`);
      await db.execute(sql`DELETE FROM live_streams WHERE id = ${stream_id}`);

      // Notify the creator that their scheduled stream was deleted
      await db.execute(sql`
        INSERT INTO notifications (user_id, type, title, body, reference_id, created_at)
        VALUES (
          ${stream.creator_id as string},
          'new_message',
          ${"Scheduled stream removed by admin"},
          ${`Your scheduled stream "${stream.title}" was removed by an admin. Reason: ${reason.trim()}`},
          ${stream_id},
          NOW()
        )
      `);

      return NextResponse.json({
        data: {
          action: "deleted",
          stream_id,
          reason: reason.trim(),
        },
      });
    }

    return NextResponse.json(
      {
        error: `Cannot act on stream with status '${stream.status}'. Only 'live' and 'scheduled' streams can be managed.`,
        code: "INVALID_STREAM_STATUS",
      },
      { status: 400 },
    );
  } catch (err) {
    console.error("DELETE /api/admin/streams error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
