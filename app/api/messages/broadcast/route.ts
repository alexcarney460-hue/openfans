export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { messagesTable, usersTable, subscriptionsTable } from "@/utils/db/schema";
import { eq, and, count } from "drizzle-orm";
import { getAuthenticatedUser } from "@/utils/api/auth";
import { createNotification } from "@/utils/notifications";
import { isValidStorageUrl } from "@/utils/validation";
import { checkRateLimit, getRateLimitKey } from "@/utils/rate-limit";

/**
 * GET /api/messages/broadcast
 * Returns the count of active subscribers for the authenticated creator.
 * Used by the broadcast modal to show how many people will receive the message.
 */
export async function GET() {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    // Verify the user is a creator
    const userRow = await db
      .select({ role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .limit(1);

    if (userRow.length === 0 || userRow[0].role !== "creator") {
      return NextResponse.json(
        { error: "Only creators can send broadcasts", code: "CREATOR_REQUIRED" },
        { status: 403 },
      );
    }

    const [result] = await db
      .select({ count: count() })
      .from(subscriptionsTable)
      .where(
        and(
          eq(subscriptionsTable.creator_id, user.id),
          eq(subscriptionsTable.status, "active"),
        ),
      );

    return NextResponse.json({
      data: { subscriber_count: result.count },
    });
  } catch (error) {
    console.error("GET /api/messages/broadcast error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/messages/broadcast
 * Send a message to all active subscribers of the authenticated creator.
 *
 * Body:
 *   - body: string (required, 1-2000 chars)
 *   - media_url: string (optional, must be valid storage URL)
 *
 * Rate limit: 1 broadcast per hour.
 * Creates one notification for the creator confirming the broadcast.
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    // Verify the user is a creator
    const userRow = await db
      .select({ role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .limit(1);

    if (userRow.length === 0 || userRow[0].role !== "creator") {
      return NextResponse.json(
        { error: "Only creators can send broadcasts", code: "CREATOR_REQUIRED" },
        { status: 403 },
      );
    }

    // Rate limit: 1 broadcast per hour (3,600,000 ms)
    const rateLimited = await checkRateLimit(
      request,
      getRateLimitKey(request, user.id),
      "broadcast",
      1,
      3_600_000,
    );
    if (rateLimited) return rateLimited;

    const reqBody = await request.json().catch(() => null);
    if (!reqBody) {
      return NextResponse.json(
        { error: "Invalid JSON body", code: "INVALID_BODY" },
        { status: 400 },
      );
    }

    const { body, media_url } = reqBody;

    // Validate body
    if (!body || typeof body !== "string" || body.trim().length === 0) {
      return NextResponse.json(
        { error: "Message body is required", code: "MISSING_BODY" },
        { status: 400 },
      );
    }

    if (body.trim().length > 2000) {
      return NextResponse.json(
        { error: "Message body exceeds 2000 character limit", code: "BODY_TOO_LONG" },
        { status: 400 },
      );
    }

    // Validate media_url if provided
    if (media_url !== undefined && media_url !== null) {
      if (typeof media_url !== "string" || !isValidStorageUrl(media_url)) {
        return NextResponse.json(
          { error: "media_url must be a valid HTTPS URL from an allowed domain", code: "INVALID_MEDIA_URL" },
          { status: 400 },
        );
      }
    }

    // Find all active subscribers
    const activeSubscribers = await db
      .select({ subscriber_id: subscriptionsTable.subscriber_id })
      .from(subscriptionsTable)
      .where(
        and(
          eq(subscriptionsTable.creator_id, user.id),
          eq(subscriptionsTable.status, "active"),
        ),
      );

    if (activeSubscribers.length === 0) {
      return NextResponse.json(
        { error: "No active subscribers to broadcast to", code: "NO_SUBSCRIBERS" },
        { status: 400 },
      );
    }

    // Deduplicate subscriber IDs (a subscriber could have multiple active subs)
    const uniqueSubscriberIds = Array.from(
      new Set(activeSubscribers.map((s) => s.subscriber_id)),
    );

    // Insert a message for each unique subscriber
    const trimmedBody = body.trim();
    const validMediaUrl = media_url || null;

    const messagesToInsert = uniqueSubscriberIds.map((subscriberId) => ({
      sender_id: user.id,
      receiver_id: subscriberId,
      body: trimmedBody,
      media_url: validMediaUrl,
      is_paid: false,
      price_usdc: null,
      is_broadcast: true,
    }));

    // Batch insert all messages (500 at a time to avoid query size limits)
    const BATCH_SIZE = 500;
    for (let i = 0; i < messagesToInsert.length; i += BATCH_SIZE) {
      const batch = messagesToInsert.slice(i, i + BATCH_SIZE);
      await db.insert(messagesTable).values(batch);
    }

    const sentCount = uniqueSubscriberIds.length;

    // Create a single notification for the creator
    createNotification(
      user.id,
      "new_message",
      "Broadcast sent",
      `Broadcast sent to ${sentCount} subscriber${sentCount === 1 ? "" : "s"}.`,
    );

    return NextResponse.json(
      {
        data: {
          sent_count: sentCount,
          message: `Broadcast sent to ${sentCount} subscriber${sentCount === 1 ? "" : "s"}`,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/messages/broadcast error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
