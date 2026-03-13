import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { messagesTable, usersTable } from "@/utils/db/schema";
import { eq, or, and, desc, sql } from "drizzle-orm";
import { getAuthenticatedUser } from "@/utils/api/auth";
import { createNotification } from "@/utils/notifications";

/**
 * GET /api/messages
 * List conversations for the authenticated user.
 * Returns the most recent message per conversation partner.
 *
 * Query params:
 *   - with: user_id to filter conversation with a specific user
 *   - page: page number (default 1)
 *   - limit: results per page (default 20, max 50)
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const withUserId = searchParams.get("with")?.trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));
    const offset = (page - 1) * limit;

    if (withUserId) {
      // Return full conversation thread with a specific user
      const thread = await db
        .select()
        .from(messagesTable)
        .where(
          or(
            and(
              eq(messagesTable.sender_id, user.id),
              eq(messagesTable.receiver_id, withUserId),
            ),
            and(
              eq(messagesTable.sender_id, withUserId),
              eq(messagesTable.receiver_id, user.id),
            ),
          ),
        )
        .orderBy(desc(messagesTable.created_at))
        .limit(limit)
        .offset(offset);

      return NextResponse.json({ data: thread });
    }

    // Return distinct conversations with the latest message from each
    // Uses a lateral join approach via raw SQL for efficiency
    const conversations = await db.execute(sql`
      WITH ranked_messages AS (
        SELECT
          m.*,
          CASE
            WHEN m.sender_id = ${user.id} THEN m.receiver_id
            ELSE m.sender_id
          END AS partner_id,
          ROW_NUMBER() OVER (
            PARTITION BY
              CASE
                WHEN m.sender_id = ${user.id} THEN m.receiver_id
                ELSE m.sender_id
              END
            ORDER BY m.created_at DESC
          ) AS rn
        FROM messages m
        WHERE m.sender_id = ${user.id} OR m.receiver_id = ${user.id}
      )
      SELECT
        rm.id,
        rm.sender_id,
        rm.receiver_id,
        rm.body,
        rm.media_url,
        rm.is_paid,
        rm.price_usdc,
        rm.is_read,
        rm.created_at,
        rm.partner_id,
        u.username AS partner_username,
        u.display_name AS partner_display_name,
        u.avatar_url AS partner_avatar_url
      FROM ranked_messages rm
      JOIN users_table u ON u.id = rm.partner_id
      WHERE rm.rn = 1
      ORDER BY rm.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `);

    return NextResponse.json({ data: conversations });
  } catch (error) {
    console.error("GET /api/messages error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/messages
 * Send a message to another user.
 *
 * Body:
 *   - receiver_id: string (required)
 *   - body: string (required)
 *   - media_url: string (optional)
 *   - is_paid: boolean (optional, default false)
 *   - price_usdc: number (optional, required if is_paid is true)
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const reqBody = await request.json().catch(() => null);
    if (!reqBody) {
      return NextResponse.json(
        { error: "Invalid JSON body", code: "INVALID_BODY" },
        { status: 400 },
      );
    }

    const { receiver_id, body, media_url, is_paid, price_usdc } = reqBody;

    // Validate required fields
    if (!receiver_id || typeof receiver_id !== "string") {
      return NextResponse.json(
        { error: "receiver_id is required", code: "MISSING_RECEIVER_ID" },
        { status: 400 },
      );
    }

    if (!body || typeof body !== "string" || body.trim().length === 0) {
      return NextResponse.json(
        { error: "body is required", code: "MISSING_BODY" },
        { status: 400 },
      );
    }

    if (body.length > 5000) {
      return NextResponse.json(
        { error: "Message body exceeds 5000 character limit", code: "BODY_TOO_LONG" },
        { status: 400 },
      );
    }

    // Cannot message yourself
    if (receiver_id === user.id) {
      return NextResponse.json(
        { error: "Cannot send a message to yourself", code: "SELF_MESSAGE" },
        { status: 400 },
      );
    }

    // Verify receiver exists
    const receiverResult = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.id, receiver_id))
      .limit(1);

    if (receiverResult.length === 0) {
      return NextResponse.json(
        { error: "Receiver not found", code: "RECEIVER_NOT_FOUND" },
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
        receiver_id,
        body: body.trim(),
        media_url: media_url || null,
        is_paid: isPaid,
        price_usdc: validatedPrice,
      })
      .returning();

    // Notify the receiver about the new message
    const senderInfo = await db
      .select({ display_name: usersTable.display_name })
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .limit(1);
    const senderName = senderInfo[0]?.display_name ?? "Someone";

    createNotification(
      receiver_id,
      "new_message",
      "New message",
      `${senderName} sent you a message.`,
      String(newMessage[0].id),
    );

    return NextResponse.json({ data: newMessage[0] }, { status: 201 });
  } catch (error) {
    console.error("POST /api/messages error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
