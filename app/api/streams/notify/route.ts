export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/utils/api/auth";
import { db } from "@/utils/db/db";
import { sql } from "drizzle-orm";
import { UUID_REGEX } from "@/utils/streaming/constants";

/**
 * POST /api/streams/notify
 *
 * Notify all active subscribers of a creator that they have gone live.
 * Protected by auth: the caller must be the creator who owns the stream.
 *
 * Body: { stream_id: string (UUID) }
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

    const { stream_id } = body;

    // Validate stream_id
    if (!stream_id || typeof stream_id !== "string" || !UUID_REGEX.test(stream_id)) {
      return NextResponse.json(
        { error: "stream_id is required and must be a valid UUID", code: "INVALID_STREAM_ID" },
        { status: 400 },
      );
    }

    // Fetch the stream and verify ownership
    const streamRows = await db.execute(sql`
      SELECT id, creator_id, title, status
      FROM live_streams
      WHERE id = ${stream_id}
      LIMIT 1
    `);

    if (streamRows.length === 0) {
      return NextResponse.json(
        { error: "Stream not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    const stream = streamRows[0];

    // Only the stream creator can trigger notifications
    if (stream.creator_id !== user.id) {
      return NextResponse.json(
        { error: "You can only notify for your own streams", code: "FORBIDDEN" },
        { status: 403 },
      );
    }

    // Stream should be live to send go-live notifications
    if (stream.status !== "live") {
      return NextResponse.json(
        { error: "Stream must be live to send notifications", code: "STREAM_NOT_LIVE" },
        { status: 400 },
      );
    }

    // Get the creator's display name
    const creatorRows = await db.execute(sql`
      SELECT display_name, username FROM users_table WHERE id = ${user.id} LIMIT 1
    `);

    const creatorName = (creatorRows[0]?.display_name as string)
      || (creatorRows[0]?.username as string)
      || "A creator";

    // Find all active subscribers of this creator
    const subscribers = await db.execute(sql`
      SELECT subscriber_id
      FROM subscriptions
      WHERE creator_id = ${user.id}
        AND status = 'active'
    `);

    if (subscribers.length === 0) {
      return NextResponse.json({
        data: { notified: 0, message: "No active subscribers to notify" },
      });
    }

    // Batch insert notifications for all subscribers using raw SQL
    // Build a VALUES clause for bulk insert
    const subscriberIds = subscribers.map((s) => s.subscriber_id as string);
    const title = `${creatorName} is live!`;
    const notifBody = `${creatorName} just started streaming: "${stream.title}"`;
    const now = new Date().toISOString();

    // Insert notifications in batches of 100 to avoid overly large queries
    const BATCH_SIZE = 100;
    let totalInserted = 0;

    for (let i = 0; i < subscriberIds.length; i += BATCH_SIZE) {
      const batch = subscriberIds.slice(i, i + BATCH_SIZE);

      // Build parameterized values for each subscriber
      const values = batch.map(
        (subId) => sql`(${subId}, 'new_message', ${title}, ${notifBody}, ${stream_id}, ${now}::timestamptz)`,
      );

      await db.execute(sql`
        INSERT INTO notifications (user_id, type, title, body, reference_id, created_at)
        VALUES ${sql.join(values, sql`, `)}
      `);

      totalInserted += batch.length;
    }

    return NextResponse.json({
      data: {
        notified: totalInserted,
        message: `Notified ${totalInserted} subscriber${totalInserted === 1 ? "" : "s"}`,
      },
    });
  } catch (err) {
    console.error("POST /api/streams/notify error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
