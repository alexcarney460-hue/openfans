export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { sql } from "drizzle-orm";
import { getAuthenticatedUser } from "@/utils/api/auth";
import { checkRateLimit, getRateLimitKey } from "@/utils/rate-limit";

/**
 * GET /api/ai-chat
 * List the fan's active AI chat conversations with persona details.
 * Also supports ?persona_id=xxx to get a specific persona's public info.
 */
export async function GET(request: NextRequest) {
  try {
    const personaId = request.nextUrl.searchParams.get("persona_id");

    // Public: get a specific persona's info (no auth required for browsing)
    if (personaId) {
      const persona = await db.execute(sql`
        SELECT
          p.id, p.name, p.personality, p.avatar_url, p.greeting_message,
          p.price_per_message, p.is_active, p.total_conversations, p.total_messages,
          p.created_at,
          u.username AS creator_username,
          u.display_name AS creator_display_name,
          u.avatar_url AS creator_avatar_url
        FROM ai_chat_personas p
        JOIN users_table u ON u.id = p.creator_id
        WHERE p.id = ${personaId} AND p.is_active = true
        LIMIT 1
      `);

      if (persona.length === 0) {
        return NextResponse.json(
          { error: "Persona not found or inactive", code: "NOT_FOUND" },
          { status: 404 },
        );
      }

      return NextResponse.json({ data: persona[0] });
    }

    // Authenticated: list user's conversations
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const conversations = await db.execute(sql`
      SELECT
        c.id AS conversation_id,
        c.persona_id,
        c.created_at AS conversation_started,
        c.updated_at AS last_activity,
        p.name AS persona_name,
        p.avatar_url AS persona_avatar_url,
        p.price_per_message,
        p.is_active AS persona_active,
        p.creator_id,
        u.username AS creator_username,
        (
          SELECT content FROM ai_chat_messages
          WHERE conversation_id = c.id
          ORDER BY created_at DESC LIMIT 1
        ) AS last_message,
        (
          SELECT COUNT(*)::int FROM ai_chat_messages
          WHERE conversation_id = c.id
        ) AS message_count
      FROM ai_chat_conversations c
      JOIN ai_chat_personas p ON p.id = c.persona_id
      JOIN users_table u ON u.id = p.creator_id
      WHERE c.fan_id = ${user.id}
      ORDER BY c.updated_at DESC
    `);

    return NextResponse.json({ data: conversations });
  } catch (error) {
    console.error("GET /api/ai-chat error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/ai-chat
 * Start a new conversation with an AI persona.
 *
 * Body: { persona_id }
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const rateLimited = await checkRateLimit(
      request,
      getRateLimitKey(request, user.id),
      "ai-chat-start",
      10,
      60_000,
    );
    if (rateLimited) return rateLimited;

    const body = await request.json().catch(() => null);
    if (!body || !body.persona_id) {
      return NextResponse.json(
        { error: "persona_id is required", code: "MISSING_PERSONA_ID" },
        { status: 400 },
      );
    }

    const { persona_id } = body;

    // Verify persona exists and is active
    const persona = await db.execute(sql`
      SELECT id, creator_id, name, greeting_message, price_per_message, is_active
      FROM ai_chat_personas
      WHERE id = ${persona_id}
      LIMIT 1
    `);

    if (persona.length === 0) {
      return NextResponse.json(
        { error: "Persona not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    const p = persona[0] as {
      id: string;
      creator_id: string;
      name: string;
      greeting_message: string;
      price_per_message: number;
      is_active: boolean;
    };

    if (!p.is_active) {
      return NextResponse.json(
        { error: "This persona is currently unavailable", code: "PERSONA_INACTIVE" },
        { status: 400 },
      );
    }

    // Don't let creators chat with their own personas
    if (p.creator_id === user.id) {
      return NextResponse.json(
        { error: "You cannot chat with your own persona", code: "SELF_CHAT" },
        { status: 400 },
      );
    }

    // Check if conversation already exists (upsert pattern)
    const existing = await db.execute(sql`
      SELECT id FROM ai_chat_conversations
      WHERE persona_id = ${persona_id} AND fan_id = ${user.id}
      LIMIT 1
    `);

    if (existing.length > 0) {
      return NextResponse.json({
        data: {
          conversation_id: (existing[0] as { id: string }).id,
          persona_name: p.name,
          greeting_message: p.greeting_message,
          price_per_message: p.price_per_message,
          is_new: false,
        },
      });
    }

    // Create new conversation
    const conv = await db.execute(sql`
      INSERT INTO ai_chat_conversations (persona_id, fan_id)
      VALUES (${persona_id}, ${user.id})
      RETURNING id
    `);

    const conversationId = (conv[0] as { id: string }).id;

    // Increment persona's conversation count
    await db.execute(sql`
      UPDATE ai_chat_personas
      SET total_conversations = total_conversations + 1
      WHERE id = ${persona_id}
    `);

    // Insert the greeting as the first message (no cost)
    await db.execute(sql`
      INSERT INTO ai_chat_messages (conversation_id, role, content, cost_usdc)
      VALUES (${conversationId}, 'assistant', ${p.greeting_message}, 0)
    `);

    return NextResponse.json(
      {
        data: {
          conversation_id: conversationId,
          persona_name: p.name,
          greeting_message: p.greeting_message,
          price_per_message: p.price_per_message,
          is_new: true,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/ai-chat error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
