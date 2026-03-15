export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { usersTable } from "@/utils/db/schema";
import { eq, sql } from "drizzle-orm";
import { getAuthenticatedUser } from "@/utils/api/auth";
import { generateViewerToken, generatePublisherToken } from "@/utils/streaming/livekit";
import { UUID_REGEX } from "@/utils/streaming/constants";

const LIVEKIT_URL = process.env.LIVEKIT_URL ?? "";

/**
 * GET /api/streams/[id]/token
 *
 * Refresh a LiveKit token for a stream the user has already paid for (or owns).
 * Returns: { token: string, livekit_url: string }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const streamId = params.id;
    if (!UUID_REGEX.test(streamId)) {
      return NextResponse.json(
        { error: "Invalid stream ID", code: "INVALID_STREAM_ID" },
        { status: 400 },
      );
    }

    // Fetch stream
    const streamRows = await db.execute(sql`
      SELECT id, creator_id, status
      FROM live_streams
      WHERE id = ${streamId}
      LIMIT 1
    `);

    if (streamRows.length === 0) {
      return NextResponse.json(
        { error: "Stream not found", code: "STREAM_NOT_FOUND" },
        { status: 404 },
      );
    }

    const stream = streamRows[0] as {
      id: string;
      creator_id: string;
      status: string;
    };

    // Fetch username for token
    const userRows = await db
      .select({ username: usersTable.username })
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .limit(1);

    const username = userRows[0]?.username ?? "anonymous";

    // Creator gets publisher token for free
    if (stream.creator_id === user.id) {
      const token = await generatePublisherToken(stream.id, user.id, username);
      return NextResponse.json({ token, livekit_url: LIVEKIT_URL });
    }

    // Non-creator must have purchased access within the viewing window (20 minutes)
    const purchaseRows = await db.execute(sql`
      SELECT id FROM live_stream_purchases
      WHERE stream_id = ${streamId}
        AND buyer_id = ${user.id}
        AND created_at > NOW() - INTERVAL '20 minutes'
      LIMIT 1
    `);

    if (purchaseRows.length === 0) {
      // Check if they ever purchased (to give a more helpful error message)
      const expiredRows = await db.execute(sql`
        SELECT id FROM live_stream_purchases
        WHERE stream_id = ${streamId}
          AND buyer_id = ${user.id}
        LIMIT 1
      `);

      if (expiredRows.length > 0) {
        return NextResponse.json(
          { error: "Viewing window expired", code: "WINDOW_EXPIRED" },
          { status: 403 },
        );
      }

      return NextResponse.json(
        { error: "You have not purchased access to this stream", code: "ACCESS_DENIED" },
        { status: 403 },
      );
    }

    const token = await generateViewerToken(stream.id, user.id, username);
    return NextResponse.json({ token, livekit_url: LIVEKIT_URL });
  } catch (err) {
    console.error("GET /api/streams/[id]/token error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
