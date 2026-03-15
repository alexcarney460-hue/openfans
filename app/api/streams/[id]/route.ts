export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getAuthenticatedAdmin } from "@/utils/api/auth";
import { db } from "@/utils/db/db";
import { sql } from "drizzle-orm";
import {
  UUID_REGEX,
  VALID_STATUS_TRANSITIONS,
} from "@/utils/streaming/constants";
import type { StreamStatus } from "@/utils/streaming/constants";

/**
 * GET /api/streams/[id]
 *
 * Return stream details. If the viewer is authenticated, track their
 * join time and update the live viewer count.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const streamId = params.id;

    if (!UUID_REGEX.test(streamId)) {
      return NextResponse.json(
        { error: "Invalid stream ID", code: "INVALID_ID" },
        { status: 400 },
      );
    }

    // Fetch stream with creator info
    const streamRows = await db.execute(sql`
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
        ls.ticket_price,
        ls.is_subscriber_only,
        ls.chat_enabled,
        ls.created_at,
        ls.updated_at,
        u.username AS creator_username,
        u.display_name AS creator_display_name,
        u.avatar_url AS creator_avatar_url
      FROM live_streams ls
      JOIN users_table u ON u.id = ls.creator_id
      WHERE ls.id = ${streamId}
      LIMIT 1
    `);

    if (streamRows.length === 0) {
      return NextResponse.json(
        { error: "Stream not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    const stream = streamRows[0];

    // Track viewer join if authenticated and stream is live
    const { user } = await getAuthenticatedUser();

    const isCreator = user?.id === stream.creator_id;
    const isAdmin = user ? !(await getAuthenticatedAdmin()).error : false;

    // CRITICAL-1: Server-side subscriber gate — strip playback_url for non-subscribers
    let isSubscribed = true; // default true for non-subscriber-only streams
    if (stream.is_subscriber_only && !isCreator && !isAdmin) {
      if (!user) {
        isSubscribed = false;
      } else {
        const subRows = await db.execute(sql`
          SELECT id FROM subscriptions
          WHERE subscriber_id = ${user.id}
            AND creator_id = ${stream.creator_id}
            AND status = 'active'
          LIMIT 1
        `);
        isSubscribed = subRows.length > 0;
      }
    }

    if (user && stream.status === "live" && user.id !== stream.creator_id) {
      // Upsert viewer record and update viewer_count atomically
      await db.execute(sql`
        WITH inserted AS (
          INSERT INTO live_stream_viewers (stream_id, viewer_id, joined_at)
          VALUES (${streamId}, ${user.id}, NOW())
          ON CONFLICT (stream_id, viewer_id)
          DO UPDATE SET
            joined_at = CASE
              WHEN live_stream_viewers.left_at IS NOT NULL THEN NOW()
              ELSE live_stream_viewers.joined_at
            END,
            left_at = NULL
          RETURNING id
        )
        UPDATE live_streams
        SET
          viewer_count = (
            SELECT COUNT(*) FROM live_stream_viewers
            WHERE stream_id = ${streamId} AND left_at IS NULL
          ),
          peak_viewers = GREATEST(
            peak_viewers,
            (SELECT COUNT(*) FROM live_stream_viewers
             WHERE stream_id = ${streamId} AND left_at IS NULL)
          ),
          updated_at = NOW()
        WHERE id = ${streamId}
      `);

      // Re-fetch updated counts
      const updated = await db.execute(sql`
        SELECT viewer_count, peak_viewers FROM live_streams WHERE id = ${streamId}
      `);
      if (updated.length > 0) {
        stream.viewer_count = updated[0].viewer_count;
        stream.peak_viewers = updated[0].peak_viewers;
      }
    }

    // CRITICAL-4: Conditionally fetch stream_key for creator only
    let streamKey: string | undefined;
    if (isCreator) {
      const keyRows = await db.execute(sql`
        SELECT stream_key FROM live_streams WHERE id = ${streamId} LIMIT 1
      `);
      streamKey = keyRows[0]?.stream_key as string | undefined;
    }

    // Check if the viewer has already paid for this stream
    let hasPaid = false;
    if (user && !isCreator) {
      const purchaseRows = await db.execute(sql`
        SELECT id FROM live_stream_purchases
        WHERE stream_id = ${streamId} AND buyer_id = ${user.id}
        LIMIT 1
      `);
      hasPaid = purchaseRows.length > 0;
    }

    return NextResponse.json({
      data: {
        id: stream.id,
        creator_id: stream.creator_id,
        title: stream.title,
        description: stream.description,
        status: stream.status,
        // stream_key only included for the creator (for RTMP push configuration)
        ...(isCreator && streamKey ? { stream_key: streamKey } : {}),
        // CRITICAL-1: Null out playback_url for non-subscribers on subscriber-only streams
        playback_url: isSubscribed ? stream.playback_url : null,
        thumbnail_url: stream.thumbnail_url,
        scheduled_at: stream.scheduled_at,
        started_at: stream.started_at,
        ended_at: stream.ended_at,
        viewer_count: stream.viewer_count,
        peak_viewers: stream.peak_viewers,
        ticket_price: stream.ticket_price,
        is_creator: isCreator,
        has_paid: hasPaid,
        is_subscriber_only: stream.is_subscriber_only,
        is_subscribed: stream.is_subscriber_only ? isSubscribed : undefined,
        chat_enabled: stream.chat_enabled,
        created_at: stream.created_at,
        updated_at: stream.updated_at,
        creator: {
          username: stream.creator_username,
          display_name: stream.creator_display_name,
          avatar_url: stream.creator_avatar_url,
        },
      },
    });
  } catch (err) {
    console.error("GET /api/streams/[id] error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/streams/[id]
 *
 * Update a stream. Creator or admin only.
 * Allowed fields: title, description, status, thumbnail_url, playback_url,
 *                 is_subscriber_only, chat_enabled.
 *
 * Status transitions are validated:
 *   scheduled -> live | cancelled
 *   live -> ended
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const streamId = params.id;

    if (!UUID_REGEX.test(streamId)) {
      return NextResponse.json(
        { error: "Invalid stream ID", code: "INVALID_ID" },
        { status: 400 },
      );
    }

    // Fetch existing stream
    const streamRows = await db.execute(sql`
      SELECT id, creator_id, status FROM live_streams WHERE id = ${streamId} LIMIT 1
    `);

    if (streamRows.length === 0) {
      return NextResponse.json(
        { error: "Stream not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    const stream = streamRows[0];

    // Check authorization: must be owner or admin
    if (stream.creator_id !== user.id) {
      const adminCheck = await getAuthenticatedAdmin();
      if (adminCheck.error) {
        return NextResponse.json(
          { error: "You can only update your own streams", code: "FORBIDDEN" },
          { status: 403 },
        );
      }
    }

    // Parse body
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body", code: "INVALID_BODY" },
        { status: 400 },
      );
    }

    const { title, description, status, thumbnail_url, playback_url, is_subscriber_only, chat_enabled } = body;

    // Validate title if provided
    if (title !== undefined) {
      if (typeof title !== "string" || title.trim().length === 0) {
        return NextResponse.json(
          { error: "title must be a non-empty string", code: "INVALID_TITLE" },
          { status: 400 },
        );
      }
      if (title.length > 200) {
        return NextResponse.json(
          { error: "title must be 200 characters or less", code: "TITLE_TOO_LONG" },
          { status: 400 },
        );
      }
    }

    // Validate description if provided
    if (description !== undefined && description !== null && typeof description !== "string") {
      return NextResponse.json(
        { error: "description must be a string", code: "INVALID_DESCRIPTION" },
        { status: 400 },
      );
    }

    // Validate and apply status transition
    let newStartedAt: string | null | undefined = undefined;
    let newEndedAt: string | null | undefined = undefined;

    if (status !== undefined) {
      const currentStatus = stream.status as StreamStatus;
      const newStatus = status as StreamStatus;

      const allowed = VALID_STATUS_TRANSITIONS[currentStatus];
      if (!allowed || !allowed.includes(newStatus)) {
        return NextResponse.json(
          {
            error: `Cannot transition from '${currentStatus}' to '${newStatus}'`,
            code: "INVALID_STATUS_TRANSITION",
          },
          { status: 400 },
        );
      }

      // Set timestamps based on transition
      if (newStatus === "live") {
        newStartedAt = new Date().toISOString();
      } else if (newStatus === "ended" || newStatus === "cancelled") {
        newEndedAt = new Date().toISOString();
      }
    }

    // Build update query
    const now = new Date().toISOString();
    const isEndingStream = status === "ended" || status === "cancelled";

    // IMPORTANT-2: Wrap status update + viewer cleanup in a transaction
    // when ending/cancelling to ensure atomicity
    if (isEndingStream) {
      const result = await db.transaction(async (tx) => {
        const updated = await tx.execute(sql`
          UPDATE live_streams
          SET
            title = COALESCE(${title?.trim() ?? null}, title),
            description = CASE
              WHEN ${description !== undefined} THEN ${description?.trim() ?? null}
              ELSE description
            END,
            status = COALESCE(${status ?? null}, status),
            thumbnail_url = CASE
              WHEN ${thumbnail_url !== undefined} THEN ${thumbnail_url ?? null}
              ELSE thumbnail_url
            END,
            playback_url = CASE
              WHEN ${playback_url !== undefined} THEN ${playback_url ?? null}
              ELSE playback_url
            END,
            is_subscriber_only = COALESCE(${is_subscriber_only ?? null}::boolean, is_subscriber_only),
            chat_enabled = COALESCE(${chat_enabled ?? null}::boolean, chat_enabled),
            started_at = CASE
              WHEN ${newStartedAt !== undefined} THEN ${newStartedAt ?? null}::timestamptz
              ELSE started_at
            END,
            ended_at = CASE
              WHEN ${newEndedAt !== undefined} THEN ${newEndedAt ?? null}::timestamptz
              ELSE ended_at
            END,
            updated_at = ${now}
          WHERE id = ${streamId}
          RETURNING
            id, creator_id, title, description, status,
            playback_url, thumbnail_url, scheduled_at, started_at, ended_at,
            viewer_count, peak_viewers, ticket_price, is_subscriber_only, chat_enabled,
            created_at, updated_at
        `);

        // Mark all active viewers as left within the same transaction
        await tx.execute(sql`
          UPDATE live_stream_viewers
          SET left_at = NOW()
          WHERE stream_id = ${streamId} AND left_at IS NULL
        `);

        return updated;
      });

      return NextResponse.json({ data: result[0] });
    }

    const result = await db.execute(sql`
      UPDATE live_streams
      SET
        title = COALESCE(${title?.trim() ?? null}, title),
        description = CASE
          WHEN ${description !== undefined} THEN ${description?.trim() ?? null}
          ELSE description
        END,
        status = COALESCE(${status ?? null}, status),
        thumbnail_url = CASE
          WHEN ${thumbnail_url !== undefined} THEN ${thumbnail_url ?? null}
          ELSE thumbnail_url
        END,
        playback_url = CASE
          WHEN ${playback_url !== undefined} THEN ${playback_url ?? null}
          ELSE playback_url
        END,
        is_subscriber_only = COALESCE(${is_subscriber_only ?? null}::boolean, is_subscriber_only),
        chat_enabled = COALESCE(${chat_enabled ?? null}::boolean, chat_enabled),
        started_at = CASE
          WHEN ${newStartedAt !== undefined} THEN ${newStartedAt ?? null}::timestamptz
          ELSE started_at
        END,
        ended_at = CASE
          WHEN ${newEndedAt !== undefined} THEN ${newEndedAt ?? null}::timestamptz
          ELSE ended_at
        END,
        updated_at = ${now}
      WHERE id = ${streamId}
      RETURNING
        id, creator_id, title, description, status,
        playback_url, thumbnail_url, scheduled_at, started_at, ended_at,
        viewer_count, peak_viewers, is_subscriber_only, chat_enabled,
        created_at, updated_at
    `);

    return NextResponse.json({ data: result[0] });
  } catch (err) {
    console.error("PATCH /api/streams/[id] error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/streams/[id]
 *
 * Delete a stream. Only allowed when status is 'scheduled' or 'cancelled'.
 * Creator or admin only.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const streamId = params.id;

    if (!UUID_REGEX.test(streamId)) {
      return NextResponse.json(
        { error: "Invalid stream ID", code: "INVALID_ID" },
        { status: 400 },
      );
    }

    // Fetch the stream
    const streamRows = await db.execute(sql`
      SELECT id, creator_id, status FROM live_streams WHERE id = ${streamId} LIMIT 1
    `);

    if (streamRows.length === 0) {
      return NextResponse.json(
        { error: "Stream not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    const stream = streamRows[0];

    // Check authorization
    if (stream.creator_id !== user.id) {
      const adminCheck = await getAuthenticatedAdmin();
      if (adminCheck.error) {
        return NextResponse.json(
          { error: "You can only delete your own streams", code: "FORBIDDEN" },
          { status: 403 },
        );
      }
    }

    // Only allow deletion of scheduled or cancelled streams
    if (stream.status !== "scheduled" && stream.status !== "cancelled") {
      return NextResponse.json(
        {
          error: "Can only delete streams with status 'scheduled' or 'cancelled'",
          code: "INVALID_DELETE_STATUS",
        },
        { status: 400 },
      );
    }

    // IMPORTANT-3: Delete associated records and stream in a single transaction
    await db.transaction(async (tx) => {
      await tx.execute(sql`DELETE FROM live_chat_messages WHERE stream_id = ${streamId}`);
      await tx.execute(sql`DELETE FROM live_stream_viewers WHERE stream_id = ${streamId}`);
      await tx.execute(sql`DELETE FROM live_streams WHERE id = ${streamId}`);
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/streams/[id] error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
