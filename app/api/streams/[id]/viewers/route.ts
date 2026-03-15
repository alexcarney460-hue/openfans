export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getAuthenticatedAdmin } from "@/utils/api/auth";
import { db } from "@/utils/db/db";
import { sql } from "drizzle-orm";
import { UUID_REGEX } from "@/utils/streaming/constants";

/**
 * GET /api/streams/[id]/viewers
 *
 * Returns viewer information for a stream.
 * - Public/regular users: viewer count only
 * - Creator/admin: viewer count + list of current viewers with usernames
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

    // Fetch stream to get creator_id and viewer_count
    const streamRows = await db.execute(sql`
      SELECT id, creator_id, viewer_count, peak_viewers, status
      FROM live_streams
      WHERE id = ${streamId}
      LIMIT 1
    `);

    if (streamRows.length === 0) {
      return NextResponse.json(
        { error: "Stream not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    const stream = streamRows[0];

    // Check if the requester is the creator or an admin
    const { user } = await getAuthenticatedUser();
    const isCreator = user?.id === stream.creator_id;

    let isAdmin = false;
    if (user && !isCreator) {
      const adminCheck = await getAuthenticatedAdmin();
      isAdmin = !adminCheck.error;
    }

    const canSeeViewerList = isCreator || isAdmin;

    // Base response: viewer count (always public)
    const response: Record<string, unknown> = {
      viewer_count: stream.viewer_count,
      peak_viewers: stream.peak_viewers,
    };

    // If creator or admin, include the viewer list
    if (canSeeViewerList) {
      const viewers = await db.execute(sql`
        SELECT
          v.id,
          v.viewer_id,
          v.joined_at,
          v.left_at,
          u.username,
          u.display_name,
          u.avatar_url
        FROM live_stream_viewers v
        JOIN users_table u ON u.id = v.viewer_id
        WHERE v.stream_id = ${streamId}
          AND v.left_at IS NULL
        ORDER BY v.joined_at DESC
      `);

      response.viewers = viewers.map((row) => ({
        id: row.id,
        viewer_id: row.viewer_id,
        joined_at: row.joined_at,
        username: row.username,
        display_name: row.display_name,
        avatar_url: row.avatar_url,
      }));
    }

    return NextResponse.json({ data: response });
  } catch (err) {
    console.error("GET /api/streams/[id]/viewers error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
