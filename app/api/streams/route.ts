export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/utils/api/auth";
import { db } from "@/utils/db/db";
import { sql } from "drizzle-orm";
import { UUID_REGEX } from "@/utils/streaming/constants";
import type { StreamStatus } from "@/utils/streaming/constants";

const VALID_STATUSES: readonly StreamStatus[] = ["scheduled", "live", "ended", "cancelled"];

/**
 * GET /api/streams
 *
 * List active and upcoming streams with optional filters.
 * Query params:
 *   - status: filter by stream status (comma-separated for multiple)
 *   - creator_id: filter by creator UUID
 *   - page: page number (default 1)
 *   - limit: items per page (default 20, max 50)
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const statusParam = url.searchParams.get("status");
    const creatorId = url.searchParams.get("creator_id");
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10) || 20));
    const offset = (page - 1) * limit;

    // Validate creator_id if provided
    if (creatorId && !UUID_REGEX.test(creatorId)) {
      return NextResponse.json(
        { error: "Invalid creator_id format", code: "INVALID_CREATOR_ID" },
        { status: 400 },
      );
    }

    // Validate status filters
    const statusFilters: StreamStatus[] = [];
    if (statusParam) {
      const parts = statusParam.split(",").map((s) => s.trim());
      for (const s of parts) {
        if (!VALID_STATUSES.includes(s as StreamStatus)) {
          return NextResponse.json(
            { error: `Invalid status: ${s}`, code: "INVALID_STATUS" },
            { status: 400 },
          );
        }
        statusFilters.push(s as StreamStatus);
      }
    }

    // Build dynamic query with parameterized conditions
    // Default: show scheduled and live streams when no status filter
    const effectiveStatuses = statusFilters.length > 0 ? statusFilters : ["scheduled", "live"];

    let query;
    let countQuery;

    if (creatorId) {
      query = db.execute(sql`
        SELECT
          ls.id,
          ls.creator_id,
          ls.title,
          ls.description,
          ls.status,
          ls.playback_url,
          ls.thumbnail_url,
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
        WHERE ls.status = ANY(${effectiveStatuses}::stream_status[])
          AND ls.creator_id = ${creatorId}
        ORDER BY
          CASE WHEN ls.status = 'live' THEN 0
               WHEN ls.status = 'scheduled' THEN 1
               ELSE 2
          END,
          ls.scheduled_at ASC NULLS LAST,
          ls.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `);

      countQuery = db.execute(sql`
        SELECT COUNT(*)::int AS total
        FROM live_streams
        WHERE status = ANY(${effectiveStatuses}::stream_status[])
          AND creator_id = ${creatorId}
      `);
    } else {
      query = db.execute(sql`
        SELECT
          ls.id,
          ls.creator_id,
          ls.title,
          ls.description,
          ls.status,
          ls.playback_url,
          ls.thumbnail_url,
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
        WHERE ls.status = ANY(${effectiveStatuses}::stream_status[])
        ORDER BY
          CASE WHEN ls.status = 'live' THEN 0
               WHEN ls.status = 'scheduled' THEN 1
               ELSE 2
          END,
          ls.scheduled_at ASC NULLS LAST,
          ls.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `);

      countQuery = db.execute(sql`
        SELECT COUNT(*)::int AS total
        FROM live_streams
        WHERE status = ANY(${effectiveStatuses}::stream_status[])
      `);
    }

    const [streams, countResult] = await Promise.all([query, countQuery]);
    const total = (countResult[0]?.total as number) ?? 0;

    const data = streams.map((row) => ({
      id: row.id,
      creator_id: row.creator_id,
      title: row.title,
      description: row.description,
      status: row.status,
      playback_url: row.playback_url,
      thumbnail_url: row.thumbnail_url,
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
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("GET /api/streams error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/streams
 *
 * Create a new live stream. Auth required, creator role only.
 *
 * Body: {
 *   title: string (required, max 200 chars),
 *   description?: string (max 2000 chars),
 *   scheduled_at?: string (ISO 8601, must be in the future),
 *   is_subscriber_only?: boolean,
 *   chat_enabled?: boolean
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    // Verify user is a creator
    const userRows = await db.execute(sql`
      SELECT role FROM users_table WHERE id = ${user.id} LIMIT 1
    `);

    if (userRows.length === 0 || userRows[0].role !== "creator") {
      return NextResponse.json(
        { error: "Only creators can create streams", code: "CREATOR_REQUIRED" },
        { status: 403 },
      );
    }

    // Parse and validate body
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body", code: "INVALID_BODY" },
        { status: 400 },
      );
    }

    const { title, description, scheduled_at, is_subscriber_only, chat_enabled, status: requestedStatus } = body;

    // Validate title
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "title is required", code: "MISSING_TITLE" },
        { status: 400 },
      );
    }
    if (title.length > 200) {
      return NextResponse.json(
        { error: "title must be 200 characters or less", code: "TITLE_TOO_LONG" },
        { status: 400 },
      );
    }

    // Validate description
    if (description !== undefined && description !== null) {
      if (typeof description !== "string") {
        return NextResponse.json(
          { error: "description must be a string", code: "INVALID_DESCRIPTION" },
          { status: 400 },
        );
      }
      if (description.length > 2000) {
        return NextResponse.json(
          { error: "description must be 2000 characters or less", code: "DESCRIPTION_TOO_LONG" },
          { status: 400 },
        );
      }
    }

    // Validate scheduled_at
    let parsedScheduledAt: string | null = null;
    if (scheduled_at !== undefined && scheduled_at !== null) {
      const date = new Date(scheduled_at);
      if (isNaN(date.getTime())) {
        return NextResponse.json(
          { error: "scheduled_at must be a valid ISO 8601 date", code: "INVALID_SCHEDULED_AT" },
          { status: 400 },
        );
      }
      if (date <= new Date()) {
        return NextResponse.json(
          { error: "scheduled_at must be in the future", code: "SCHEDULED_IN_PAST" },
          { status: 400 },
        );
      }
      parsedScheduledAt = date.toISOString();
    }

    // Generate unique stream key
    const streamKey = crypto.randomUUID();

    const now = new Date().toISOString();
    const subscriberOnly = is_subscriber_only === true;
    const chatOn = chat_enabled !== false; // default true
    const goLiveNow = requestedStatus === "live";
    const initialStatus = goLiveNow ? "live" : "scheduled";

    const result = await db.execute(sql`
      INSERT INTO live_streams (
        creator_id, title, description, status, stream_key,
        scheduled_at, started_at, is_subscriber_only, chat_enabled,
        created_at, updated_at
      )
      VALUES (
        ${user.id},
        ${title.trim()},
        ${description?.trim() ?? null},
        ${initialStatus},
        ${streamKey},
        ${parsedScheduledAt},
        ${goLiveNow ? now : null},
        ${subscriberOnly},
        ${chatOn},
        ${now},
        ${now}
      )
      RETURNING
        id, creator_id, title, description, status, stream_key,
        playback_url, thumbnail_url, scheduled_at, started_at, ended_at,
        viewer_count, peak_viewers, is_subscriber_only, chat_enabled,
        created_at, updated_at
    `);

    const row = result[0];

    // CRITICAL-3: Construct explicit response object.
    // stream_key is intentionally returned to the creator for RTMP push configuration.
    const responseData = {
      id: row.id,
      creator_id: row.creator_id,
      title: row.title,
      description: row.description,
      status: row.status,
      stream_key: row.stream_key, // Intentionally returned — creator needs this for RTMP push
      playback_url: row.playback_url,
      thumbnail_url: row.thumbnail_url,
      scheduled_at: row.scheduled_at,
      started_at: row.started_at,
      ended_at: row.ended_at,
      viewer_count: row.viewer_count,
      peak_viewers: row.peak_viewers,
      is_subscriber_only: row.is_subscriber_only,
      chat_enabled: row.chat_enabled,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };

    return NextResponse.json({ data: responseData }, { status: 201 });
  } catch (err) {
    console.error("POST /api/streams error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
