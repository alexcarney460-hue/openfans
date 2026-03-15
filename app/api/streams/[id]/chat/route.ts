export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getAuthenticatedAdmin } from "@/utils/api/auth";
import { db } from "@/utils/db/db";
import { sql } from "drizzle-orm";
import { UUID_REGEX, MAX_CHAT_LENGTH, CHAT_RATE_LIMIT } from "@/utils/streaming/constants";

/**
 * GET /api/streams/[id]/chat
 *
 * Return the most recent chat messages for a stream.
 * Query params:
 *   - limit: number of messages (default 100, max 100)
 *   - before: cursor-based pagination (message ID to fetch before)
 */
export async function GET(
  request: NextRequest,
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

    const url = new URL(request.url);
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "100", 10) || 100));
    const before = url.searchParams.get("before");

    // Validate before cursor if provided
    if (before && !UUID_REGEX.test(before)) {
      return NextResponse.json(
        { error: "Invalid 'before' cursor", code: "INVALID_CURSOR" },
        { status: 400 },
      );
    }

    // Verify stream exists
    const streamRows = await db.execute(sql`
      SELECT id, chat_enabled, is_subscriber_only, creator_id
      FROM live_streams WHERE id = ${streamId} LIMIT 1
    `);

    if (streamRows.length === 0) {
      return NextResponse.json(
        { error: "Stream not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    const streamRecord = streamRows[0];

    // IMPORTANT-4: Block chat access for non-subscribers on subscriber-only streams
    if (streamRecord.is_subscriber_only) {
      const { user } = await getAuthenticatedUser();
      const isCreator = user?.id === streamRecord.creator_id;
      const isAdmin = user ? !(await getAuthenticatedAdmin()).error : false;

      if (!isCreator && !isAdmin) {
        if (!user) {
          return NextResponse.json(
            { error: "Subscription required to view chat", code: "SUBSCRIPTION_REQUIRED" },
            { status: 403 },
          );
        }

        const subRows = await db.execute(sql`
          SELECT id FROM subscriptions
          WHERE subscriber_id = ${user.id}
            AND creator_id = ${streamRecord.creator_id}
            AND status = 'active'
          LIMIT 1
        `);

        if (subRows.length === 0) {
          return NextResponse.json(
            { error: "Subscription required to view chat", code: "SUBSCRIPTION_REQUIRED" },
            { status: 403 },
          );
        }
      }
    }

    // Fetch messages with sender info
    let messages;
    if (before) {
      messages = await db.execute(sql`
        SELECT
          m.id,
          m.stream_id,
          m.sender_id,
          m.body,
          m.is_pinned,
          m.created_at,
          u.username AS sender_username,
          u.avatar_url AS sender_avatar_url
        FROM live_chat_messages m
        JOIN users_table u ON u.id = m.sender_id
        WHERE m.stream_id = ${streamId}
          AND m.created_at < (
            SELECT created_at FROM live_chat_messages WHERE id = ${before}
          )
        ORDER BY m.created_at DESC
        LIMIT ${limit}
      `);
    } else {
      messages = await db.execute(sql`
        SELECT
          m.id,
          m.stream_id,
          m.sender_id,
          m.body,
          m.is_pinned,
          m.created_at,
          u.username AS sender_username,
          u.avatar_url AS sender_avatar_url
        FROM live_chat_messages m
        JOIN users_table u ON u.id = m.sender_id
        WHERE m.stream_id = ${streamId}
        ORDER BY m.created_at DESC
        LIMIT ${limit}
      `);
    }

    // Return in chronological order (oldest first)
    const data = messages.reverse().map((row) => ({
      id: row.id,
      stream_id: row.stream_id,
      sender_id: row.sender_id,
      body: row.body,
      is_pinned: row.is_pinned,
      created_at: row.created_at,
      sender_username: row.sender_username,
      sender_avatar_url: row.sender_avatar_url,
    }));

    return NextResponse.json({ data });
  } catch (err) {
    console.error("GET /api/streams/[id]/chat error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/streams/[id]/chat
 *
 * Send a chat message in a live stream. Auth required.
 * Body: { body: string (max 500 chars) }
 *
 * Rate limited to 30 messages per minute per user.
 * Chat must be enabled on the stream.
 */
export async function POST(
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

    // Fetch stream to verify it exists, is live, and has chat enabled
    const streamRows = await db.execute(sql`
      SELECT id, status, chat_enabled FROM live_streams WHERE id = ${streamId} LIMIT 1
    `);

    if (streamRows.length === 0) {
      return NextResponse.json(
        { error: "Stream not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    const stream = streamRows[0];

    if (stream.status !== "live") {
      return NextResponse.json(
        { error: "Chat is only available during a live stream", code: "STREAM_NOT_LIVE" },
        { status: 400 },
      );
    }

    if (!stream.chat_enabled) {
      return NextResponse.json(
        { error: "Chat is disabled for this stream", code: "CHAT_DISABLED" },
        { status: 403 },
      );
    }

    // Parse and validate body
    const reqBody = await request.json().catch(() => null);
    if (!reqBody) {
      return NextResponse.json(
        { error: "Invalid JSON body", code: "INVALID_BODY" },
        { status: 400 },
      );
    }

    const { body: messageBody } = reqBody;

    if (!messageBody || typeof messageBody !== "string" || messageBody.trim().length === 0) {
      return NextResponse.json(
        { error: "body is required and must be a non-empty string", code: "MISSING_BODY" },
        { status: 400 },
      );
    }

    if (messageBody.length > MAX_CHAT_LENGTH) {
      return NextResponse.json(
        { error: `Message must be ${MAX_CHAT_LENGTH} characters or less`, code: "MESSAGE_TOO_LONG" },
        { status: 400 },
      );
    }

    // Rate limit check: count messages from this user in the last minute
    const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
    const rateLimitRows = await db.execute(sql`
      SELECT COUNT(*)::int AS msg_count
      FROM live_chat_messages
      WHERE sender_id = ${user.id}
        AND stream_id = ${streamId}
        AND created_at > ${oneMinuteAgo}
    `);

    const msgCount = (rateLimitRows[0]?.msg_count as number) ?? 0;
    if (msgCount >= CHAT_RATE_LIMIT) {
      return NextResponse.json(
        {
          error: `Rate limit exceeded. Maximum ${CHAT_RATE_LIMIT} messages per minute.`,
          code: "RATE_LIMIT_EXCEEDED",
        },
        { status: 429 },
      );
    }

    // Insert the message
    const result = await db.execute(sql`
      INSERT INTO live_chat_messages (stream_id, sender_id, body, created_at)
      VALUES (${streamId}, ${user.id}, ${messageBody.trim()}, NOW())
      RETURNING id, stream_id, sender_id, body, is_pinned, created_at
    `);

    // Fetch sender info for the response
    const senderRows = await db.execute(sql`
      SELECT username, avatar_url FROM users_table WHERE id = ${user.id} LIMIT 1
    `);

    const message = result[0];
    const sender = senderRows[0];

    return NextResponse.json(
      {
        data: {
          id: message.id,
          stream_id: message.stream_id,
          sender_id: message.sender_id,
          body: message.body,
          is_pinned: message.is_pinned,
          created_at: message.created_at,
          sender_username: sender?.username ?? null,
          sender_avatar_url: sender?.avatar_url ?? null,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("POST /api/streams/[id]/chat error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
