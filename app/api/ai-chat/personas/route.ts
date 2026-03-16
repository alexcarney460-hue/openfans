export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { usersTable } from "@/utils/db/schema";
import { eq, sql } from "drizzle-orm";
import { getAuthenticatedUser } from "@/utils/api/auth";
import { checkRateLimit, getRateLimitKey } from "@/utils/rate-limit";

const PLATFORM_FEE_PERCENT = 10;
const MIN_PRICE_PER_MESSAGE = 10; // 10 cents = $0.10
const MAX_PRICE_PER_MESSAGE = 10000; // $100.00

/**
 * GET /api/ai-chat/personas
 * List the authenticated creator's AI chat personas.
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    // Check if user is a creator
    const dbUser = await db
      .select({ role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .limit(1);

    if (dbUser.length === 0 || (dbUser[0].role !== "creator" && dbUser[0].role !== "admin")) {
      return NextResponse.json(
        { error: "Only creators can manage AI personas", code: "CREATOR_REQUIRED" },
        { status: 403 },
      );
    }

    const personas = await db.execute(sql`
      SELECT * FROM ai_chat_personas
      WHERE creator_id = ${user.id}
      ORDER BY created_at DESC
    `);

    return NextResponse.json({ data: personas });
  } catch (error) {
    console.error("GET /api/ai-chat/personas error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/ai-chat/personas
 * Create a new AI chat persona. Creator only.
 *
 * Body: { name, personality, system_prompt, avatar_url?, greeting_message?, price_per_message }
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const rateLimited = await checkRateLimit(
      request,
      getRateLimitKey(request, user.id),
      "ai-chat-personas",
      10,
      60_000,
    );
    if (rateLimited) return rateLimited;

    // Check if user is a creator
    const dbUser = await db
      .select({ role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .limit(1);

    if (dbUser.length === 0 || (dbUser[0].role !== "creator" && dbUser[0].role !== "admin")) {
      return NextResponse.json(
        { error: "Only creators can manage AI personas", code: "CREATOR_REQUIRED" },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body", code: "INVALID_BODY" },
        { status: 400 },
      );
    }

    const {
      name,
      personality,
      system_prompt,
      avatar_url,
      greeting_message,
      price_per_message,
    } = body;

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim().length === 0 || name.trim().length > 100) {
      return NextResponse.json(
        { error: "name is required (1-100 characters)", code: "INVALID_NAME" },
        { status: 400 },
      );
    }

    if (!personality || typeof personality !== "string" || personality.trim().length === 0 || personality.trim().length > 500) {
      return NextResponse.json(
        { error: "personality is required (1-500 characters)", code: "INVALID_PERSONALITY" },
        { status: 400 },
      );
    }

    if (!system_prompt || typeof system_prompt !== "string" || system_prompt.trim().length === 0 || system_prompt.trim().length > 2000) {
      return NextResponse.json(
        { error: "system_prompt is required (1-2000 characters)", code: "INVALID_SYSTEM_PROMPT" },
        { status: 400 },
      );
    }

    if (typeof price_per_message !== "number" || !Number.isInteger(price_per_message) || price_per_message < MIN_PRICE_PER_MESSAGE || price_per_message > MAX_PRICE_PER_MESSAGE) {
      return NextResponse.json(
        { error: `price_per_message must be an integer between ${MIN_PRICE_PER_MESSAGE} and ${MAX_PRICE_PER_MESSAGE} cents`, code: "INVALID_PRICE" },
        { status: 400 },
      );
    }

    // Optional avatar_url validation
    if (avatar_url !== undefined && avatar_url !== null) {
      if (typeof avatar_url !== "string" || avatar_url.trim().length > 500) {
        return NextResponse.json(
          { error: "avatar_url must be a string (max 500 characters)", code: "INVALID_AVATAR" },
          { status: 400 },
        );
      }
    }

    // Optional greeting_message validation
    const greeting = greeting_message && typeof greeting_message === "string" && greeting_message.trim().length > 0
      ? greeting_message.trim().slice(0, 500)
      : "Hey! How are you doing? \u{1F495}";

    const result = await db.execute(sql`
      INSERT INTO ai_chat_personas (creator_id, name, personality, system_prompt, avatar_url, greeting_message, price_per_message)
      VALUES (${user.id}, ${name.trim()}, ${personality.trim()}, ${system_prompt.trim()}, ${avatar_url?.trim() ?? null}, ${greeting}, ${price_per_message})
      RETURNING *
    `);

    return NextResponse.json({ data: result[0] }, { status: 201 });
  } catch (error) {
    console.error("POST /api/ai-chat/personas error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/ai-chat/personas
 * Update an existing AI chat persona. Creator only.
 *
 * Body: { id, name?, personality?, system_prompt?, avatar_url?, greeting_message?, price_per_message?, is_active? }
 */
export async function PATCH(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const body = await request.json().catch(() => null);
    if (!body || !body.id) {
      return NextResponse.json(
        { error: "id is required", code: "MISSING_ID" },
        { status: 400 },
      );
    }

    // Verify ownership
    const existing = await db.execute(sql`
      SELECT id, creator_id FROM ai_chat_personas WHERE id = ${body.id} LIMIT 1
    `);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Persona not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    if ((existing[0] as { creator_id: string }).creator_id !== user.id) {
      return NextResponse.json(
        { error: "You can only edit your own personas", code: "FORBIDDEN" },
        { status: 403 },
      );
    }

    // Build SET clauses dynamically
    const sets: string[] = [];
    const values: unknown[] = [];

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (name.length === 0 || name.length > 100) {
        return NextResponse.json({ error: "name must be 1-100 characters", code: "INVALID_NAME" }, { status: 400 });
      }
      sets.push("name");
      values.push(name);
    }

    if (body.personality !== undefined) {
      const personality = String(body.personality).trim();
      if (personality.length === 0 || personality.length > 500) {
        return NextResponse.json({ error: "personality must be 1-500 characters", code: "INVALID_PERSONALITY" }, { status: 400 });
      }
      sets.push("personality");
      values.push(personality);
    }

    if (body.system_prompt !== undefined) {
      const prompt = String(body.system_prompt).trim();
      if (prompt.length === 0 || prompt.length > 2000) {
        return NextResponse.json({ error: "system_prompt must be 1-2000 characters", code: "INVALID_SYSTEM_PROMPT" }, { status: 400 });
      }
      sets.push("system_prompt");
      values.push(prompt);
    }

    if (body.avatar_url !== undefined) {
      sets.push("avatar_url");
      values.push(body.avatar_url ? String(body.avatar_url).trim() : null);
    }

    if (body.greeting_message !== undefined) {
      sets.push("greeting_message");
      values.push(body.greeting_message ? String(body.greeting_message).trim().slice(0, 500) : "Hey! How are you doing? \u{1F495}");
    }

    if (body.price_per_message !== undefined) {
      const price = Number(body.price_per_message);
      if (!Number.isInteger(price) || price < MIN_PRICE_PER_MESSAGE || price > MAX_PRICE_PER_MESSAGE) {
        return NextResponse.json({ error: `price_per_message must be ${MIN_PRICE_PER_MESSAGE}-${MAX_PRICE_PER_MESSAGE} cents`, code: "INVALID_PRICE" }, { status: 400 });
      }
      sets.push("price_per_message");
      values.push(price);
    }

    if (body.is_active !== undefined) {
      sets.push("is_active");
      values.push(Boolean(body.is_active));
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: "No fields to update", code: "NO_CHANGES" }, { status: 400 });
    }

    // Update each field individually with parameterized queries to avoid SQL injection
    for (let i = 0; i < sets.length; i++) {
      const field = sets[i];
      const value = values[i];
      await db.execute(sql`
        UPDATE ai_chat_personas
        SET ${sql.raw(`"${field}"`)} = ${value}, updated_at = NOW()
        WHERE id = ${body.id} AND creator_id = ${user.id}
      `);
    }

    const updated = await db.execute(sql`
      SELECT * FROM ai_chat_personas WHERE id = ${body.id}
    `);

    return NextResponse.json({ data: updated[0] });
  } catch (error) {
    console.error("PATCH /api/ai-chat/personas error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
