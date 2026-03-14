export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { messagesTable, usersTable } from "@/utils/db/schema";
import { eq, or, and, asc, sql } from "drizzle-orm";
import { getAuthenticatedUser } from "@/utils/api/auth";
import { createNotification } from "@/utils/notifications";
import { checkRateLimit, getRateLimitKey } from "@/utils/rate-limit";

/**
 * GET /api/messages/[userId]
 * Get messages between the authenticated user and the specified user.
 * Messages are ordered oldest-first (ASC) for chat display.
 * Marks unread messages from the other user as read.
 *
 * Query params:
 *   - page: page number (default 1)
 *   - limit: results per page (default 50, max 100)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const { userId } = await params;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "Invalid userId parameter", code: "INVALID_USER_ID" },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10) || 50));
    const offset = (page - 1) * limit;

    // Fetch messages between the two users, oldest first
    const messages = await db
      .select()
      .from(messagesTable)
      .where(
        or(
          and(
            eq(messagesTable.sender_id, user.id),
            eq(messagesTable.receiver_id, userId),
          ),
          and(
            eq(messagesTable.sender_id, userId),
            eq(messagesTable.receiver_id, user.id),
          ),
        ),
      )
      .orderBy(asc(messagesTable.created_at))
      .limit(limit)
      .offset(offset);

    // Mark unread messages from the other user as read
    await db
      .update(messagesTable)
      .set({ is_read: true })
      .where(
        and(
          eq(messagesTable.sender_id, userId),
          eq(messagesTable.receiver_id, user.id),
          eq(messagesTable.is_read, false),
        ),
      );

    // Get total count for pagination
    const countResult = await db.execute(sql`
      SELECT COUNT(*)::int AS total
      FROM messages
      WHERE (sender_id = ${user.id} AND receiver_id = ${userId})
         OR (sender_id = ${userId} AND receiver_id = ${user.id})
    `);
    const total = (countResult as unknown as Array<{ total: number }>)[0]?.total ?? 0;

    return NextResponse.json({
      data: messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/messages/[userId] error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/messages/[userId]
 * Send a message to the specified user.
 *
 * Body:
 *   - body: string (required, max 2000 chars)
 *   - media_url: string (optional)
 *   - is_paid: boolean (optional)
 *   - price_usdc: number (optional, required if is_paid)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const { userId: receiverId } = await params;

    // Rate limit: 30 messages per minute
    const rateLimited = await checkRateLimit(
      request,
      getRateLimitKey(request, user.id),
      "messages-send",
      30,
      60_000,
    );
    if (rateLimited) return rateLimited;

    const reqBody = await request.json().catch(() => null);
    if (!reqBody) {
      return NextResponse.json(
        { error: "Invalid JSON body", code: "INVALID_BODY" },
        { status: 400 },
      );
    }

    const { body, media_url, is_paid, price_usdc } = reqBody;

    // Validate body
    if (!body || typeof body !== "string" || body.trim().length === 0) {
      return NextResponse.json(
        { error: "Message body is required", code: "MISSING_BODY" },
        { status: 400 },
      );
    }

    if (body.length > 2000) {
      return NextResponse.json(
        { error: "Message body exceeds 2000 character limit", code: "BODY_TOO_LONG" },
        { status: 400 },
      );
    }

    // Cannot message yourself
    if (receiverId === user.id) {
      return NextResponse.json(
        { error: "Cannot send a message to yourself", code: "SELF_MESSAGE" },
        { status: 400 },
      );
    }

    // Verify receiver exists
    const receiverResult = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.id, receiverId))
      .limit(1);

    if (receiverResult.length === 0) {
      return NextResponse.json(
        { error: "User not found", code: "USER_NOT_FOUND" },
        { status: 404 },
      );
    }

    // Validate paid message fields
    const isPaid = is_paid === true;
    let validatedPrice: number | null = null;

    if (isPaid) {
      if (typeof price_usdc !== "number" || price_usdc <= 0) {
        return NextResponse.json(
          { error: "price_usdc must be a positive number for paid messages", code: "INVALID_PRICE" },
          { status: 400 },
        );
      }
      validatedPrice = price_usdc;
    }

    const newMessage = await db
      .insert(messagesTable)
      .values({
        sender_id: user.id,
        receiver_id: receiverId,
        body: body.trim(),
        media_url: media_url || null,
        is_paid: isPaid,
        price_usdc: validatedPrice,
      })
      .returning();

    // Notify the receiver
    const senderInfo = await db
      .select({ display_name: usersTable.display_name })
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .limit(1);
    const senderName = senderInfo[0]?.display_name ?? "Someone";

    createNotification(
      receiverId,
      "new_message",
      "New message",
      `${senderName} sent you a message.`,
      String(newMessage[0].id),
    );

    return NextResponse.json({ data: newMessage[0] }, { status: 201 });
  } catch (error) {
    console.error("POST /api/messages/[userId] error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
