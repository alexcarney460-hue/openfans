export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getAuthenticatedAdmin } from "@/utils/api/auth";
import { db } from "@/utils/db/db";
import { sql } from "drizzle-orm";
import { UUID_REGEX } from "@/utils/streaming/constants";

/**
 * DELETE /api/streams/[id]/chat/[messageId]
 *
 * Delete a chat message. Only the creator of the stream or an admin can delete messages.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; messageId: string } },
) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const { id: streamId, messageId } = params;

    if (!UUID_REGEX.test(streamId)) {
      return NextResponse.json(
        { error: "Invalid stream ID", code: "INVALID_ID" },
        { status: 400 },
      );
    }

    if (!UUID_REGEX.test(messageId)) {
      return NextResponse.json(
        { error: "Invalid message ID", code: "INVALID_MESSAGE_ID" },
        { status: 400 },
      );
    }

    // Fetch the stream to check ownership
    const streamRows = await db.execute(sql`
      SELECT creator_id FROM live_streams WHERE id = ${streamId} LIMIT 1
    `);

    if (streamRows.length === 0) {
      return NextResponse.json(
        { error: "Stream not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    const isStreamCreator = streamRows[0].creator_id === user.id;

    // Check authorization: must be stream creator or admin
    if (!isStreamCreator) {
      const adminCheck = await getAuthenticatedAdmin();
      if (adminCheck.error) {
        return NextResponse.json(
          { error: "Only the stream creator or an admin can delete messages", code: "FORBIDDEN" },
          { status: 403 },
        );
      }
    }

    // Verify the message exists and belongs to this stream
    const messageRows = await db.execute(sql`
      SELECT id FROM live_chat_messages
      WHERE id = ${messageId} AND stream_id = ${streamId}
      LIMIT 1
    `);

    if (messageRows.length === 0) {
      return NextResponse.json(
        { error: "Message not found", code: "MESSAGE_NOT_FOUND" },
        { status: 404 },
      );
    }

    // Delete the message
    await db.execute(sql`
      DELETE FROM live_chat_messages
      WHERE id = ${messageId} AND stream_id = ${streamId}
    `);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/streams/[id]/chat/[messageId] error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/streams/[id]/chat/[messageId]
 *
 * Pin or unpin a chat message. Only the creator of the stream or an admin can pin/unpin.
 *
 * Body: { is_pinned: boolean }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; messageId: string } },
) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const { id: streamId, messageId } = params;

    if (!UUID_REGEX.test(streamId)) {
      return NextResponse.json(
        { error: "Invalid stream ID", code: "INVALID_ID" },
        { status: 400 },
      );
    }

    if (!UUID_REGEX.test(messageId)) {
      return NextResponse.json(
        { error: "Invalid message ID", code: "INVALID_MESSAGE_ID" },
        { status: 400 },
      );
    }

    // Parse body
    const body = await request.json().catch(() => null);
    if (!body || typeof body.is_pinned !== "boolean") {
      return NextResponse.json(
        { error: "is_pinned (boolean) is required", code: "INVALID_BODY" },
        { status: 400 },
      );
    }

    const { is_pinned } = body;

    // Fetch the stream to check ownership
    const streamRows = await db.execute(sql`
      SELECT creator_id FROM live_streams WHERE id = ${streamId} LIMIT 1
    `);

    if (streamRows.length === 0) {
      return NextResponse.json(
        { error: "Stream not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    const isStreamCreator = streamRows[0].creator_id === user.id;

    // Check authorization: must be stream creator or admin
    if (!isStreamCreator) {
      const adminCheck = await getAuthenticatedAdmin();
      if (adminCheck.error) {
        return NextResponse.json(
          { error: "Only the stream creator or an admin can pin/unpin messages", code: "FORBIDDEN" },
          { status: 403 },
        );
      }
    }

    // Update the message
    const result = await db.execute(sql`
      UPDATE live_chat_messages
      SET is_pinned = ${is_pinned}
      WHERE id = ${messageId} AND stream_id = ${streamId}
      RETURNING id, stream_id, sender_id, body, is_pinned, created_at
    `);

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Message not found", code: "MESSAGE_NOT_FOUND" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: result[0] });
  } catch (err) {
    console.error("PATCH /api/streams/[id]/chat/[messageId] error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
