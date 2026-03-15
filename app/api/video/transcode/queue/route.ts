export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { sql } from "drizzle-orm";
import { timingSafeEqual } from "crypto";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum number of videos returned per batch to avoid overloading the
 *  external transcoding service. */
const BATCH_LIMIT = 10;

// ---------------------------------------------------------------------------
// GET /api/video/transcode/queue
//
// Returns videos with status='uploaded' that are ready for transcoding.
// Atomically marks the returned videos as 'processing' so they are not
// picked up again by a subsequent poll.
//
// Protected by CRON_SECRET.
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    // 1. Auth
    const authHeader = request.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : "";
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || !token || cronSecret.length !== token.length || !timingSafeEqual(Buffer.from(token), Buffer.from(cronSecret))) {
      return NextResponse.json(
        { error: "Unauthorized", code: "AUTH_REQUIRED" },
        { status: 401 },
      );
    }

    // 2. Atomically select + update in a single CTE so no other worker
    //    can pick up the same rows.
    const now = new Date().toISOString();

    const rows = await db.execute(sql`
      WITH batch AS (
        SELECT id
        FROM video_assets
        WHERE status = 'uploaded'
        ORDER BY created_at ASC
        LIMIT ${BATCH_LIMIT}
        FOR UPDATE SKIP LOCKED
      ),
      updated AS (
        UPDATE video_assets
        SET status = 'processing',
            updated_at = ${now}
        WHERE id IN (SELECT id FROM batch)
        RETURNING id, original_url, creator_id, mime_type
      )
      SELECT * FROM updated
    `);

    const queue = (rows as Array<Record<string, unknown>>).map((row) => ({
      id: row.id,
      original_url: row.original_url,
      creator_id: row.creator_id,
      mime_type: row.mime_type,
    }));

    return NextResponse.json({
      data: queue,
      count: queue.length,
    });
  } catch (err) {
    console.error("GET /api/video/transcode/queue error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
