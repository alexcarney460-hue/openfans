export const dynamic = "force-dynamic";
export const maxDuration = 30;

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { walletsTable, walletTransactionsTable } from "@/utils/db/schema";
import { eq, sql } from "drizzle-orm";
import { getAuthenticatedUser } from "@/utils/api/auth";
import { checkRateLimit, getRateLimitKey } from "@/utils/rate-limit";
import Anthropic from "@anthropic-ai/sdk";

const PLATFORM_FEE_PERCENT = 10;
const MAX_HISTORY_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 500;

/**
 * GET /api/ai-chat/[conversationId]
 * Get messages for a conversation (paginated, newest first).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const { conversationId } = await params;

    // Verify conversation belongs to the user
    const conv = await db.execute(sql`
      SELECT c.id, c.fan_id, c.persona_id,
        p.name AS persona_name, p.avatar_url AS persona_avatar_url,
        p.price_per_message, p.is_active, p.creator_id
      FROM ai_chat_conversations c
      JOIN ai_chat_personas p ON p.id = c.persona_id
      WHERE c.id = ${conversationId}
      LIMIT 1
    `);

    if (conv.length === 0) {
      return NextResponse.json(
        { error: "Conversation not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    const conversation = conv[0] as {
      id: string;
      fan_id: string;
      persona_id: string;
      persona_name: string;
      persona_avatar_url: string | null;
      price_per_message: number;
      is_active: boolean;
      creator_id: string;
    };

    // Allow both fan and creator to view
    if (conversation.fan_id !== user.id && conversation.creator_id !== user.id) {
      return NextResponse.json(
        { error: "Access denied", code: "FORBIDDEN" },
        { status: 403 },
      );
    }

    // Pagination
    const limit = Math.min(
      Math.max(parseInt(request.nextUrl.searchParams.get("limit") ?? "50", 10), 1),
      100,
    );
    const offset = Math.max(
      parseInt(request.nextUrl.searchParams.get("offset") ?? "0", 10),
      0,
    );

    const messages = await db.execute(sql`
      SELECT id, role, content, cost_usdc, created_at
      FROM ai_chat_messages
      WHERE conversation_id = ${conversationId}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    const countResult = await db.execute(sql`
      SELECT COUNT(*)::int AS total FROM ai_chat_messages
      WHERE conversation_id = ${conversationId}
    `);

    return NextResponse.json({
      data: {
        conversation: {
          id: conversation.id,
          persona_name: conversation.persona_name,
          persona_avatar_url: conversation.persona_avatar_url,
          price_per_message: conversation.price_per_message,
          is_active: conversation.is_active,
        },
        messages: (messages as Array<Record<string, unknown>>).reverse(),
        total: (countResult[0] as { total: number }).total,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error("GET /api/ai-chat/[conversationId] error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/ai-chat/[conversationId]
 * Send a message in a conversation. Deducts from fan wallet, calls Claude API.
 *
 * Body: { content: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const { conversationId } = await params;

    // Rate limit: 30 messages per minute
    const rateLimited = await checkRateLimit(
      request,
      getRateLimitKey(request, user.id),
      "ai-chat-msg",
      30,
      60_000,
    );
    if (rateLimited) return rateLimited;

    const body = await request.json().catch(() => null);
    if (!body || !body.content || typeof body.content !== "string") {
      return NextResponse.json(
        { error: "content is required", code: "MISSING_CONTENT" },
        { status: 400 },
      );
    }

    const userMessage = body.content.trim();
    if (userMessage.length === 0 || userMessage.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message must be 1-${MAX_MESSAGE_LENGTH} characters`, code: "INVALID_CONTENT" },
        { status: 400 },
      );
    }

    // Get conversation + persona details
    const conv = await db.execute(sql`
      SELECT
        c.id, c.fan_id, c.persona_id,
        p.name, p.personality, p.system_prompt, p.price_per_message,
        p.is_active, p.creator_id
      FROM ai_chat_conversations c
      JOIN ai_chat_personas p ON p.id = c.persona_id
      WHERE c.id = ${conversationId}
      LIMIT 1
    `);

    if (conv.length === 0) {
      return NextResponse.json(
        { error: "Conversation not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    const conversation = conv[0] as {
      id: string;
      fan_id: string;
      persona_id: string;
      name: string;
      personality: string;
      system_prompt: string;
      price_per_message: number;
      is_active: boolean;
      creator_id: string;
    };

    if (conversation.fan_id !== user.id) {
      return NextResponse.json(
        { error: "Access denied", code: "FORBIDDEN" },
        { status: 403 },
      );
    }

    if (!conversation.is_active) {
      return NextResponse.json(
        { error: "This persona is currently unavailable", code: "PERSONA_INACTIVE" },
        { status: 400 },
      );
    }

    const pricePerMessage = conversation.price_per_message;
    const platformFee = Math.floor(pricePerMessage * PLATFORM_FEE_PERCENT / 100);
    const creatorEarnings = pricePerMessage - platformFee;

    // Atomic wallet deduction + creator credit + message storage in a transaction
    let userMsg: Record<string, unknown>;
    let aiMsg: Record<string, unknown>;

    await db.transaction(async (tx) => {
      // 1. Get fan's wallet and check balance
      const fanWallet = await tx
        .select()
        .from(walletsTable)
        .where(eq(walletsTable.user_id, user.id))
        .limit(1);

      if (fanWallet.length === 0 || fanWallet[0].balance_usdc < pricePerMessage) {
        throw new Error("INSUFFICIENT_FUNDS");
      }

      // 2. Deduct from fan's wallet (atomic)
      const updatedFanWallet = await tx
        .update(walletsTable)
        .set({
          balance_usdc: sql`${walletsTable.balance_usdc} - ${pricePerMessage}`,
          updated_at: new Date(),
        })
        .where(eq(walletsTable.id, fanWallet[0].id))
        .returning();

      // 3. Record fan's debit transaction
      await tx.insert(walletTransactionsTable).values({
        wallet_id: fanWallet[0].id,
        user_id: user.id,
        type: "ppv_charge",
        amount_usdc: -pricePerMessage,
        balance_after: updatedFanWallet[0].balance_usdc,
        description: `AI Chat message to ${conversation.name}`,
        reference_id: `ai-chat-${conversationId}`,
        related_user_id: conversation.creator_id,
        status: "completed",
      });

      // 4. Get or create creator's wallet
      let creatorWallet = await tx
        .select()
        .from(walletsTable)
        .where(eq(walletsTable.user_id, conversation.creator_id))
        .limit(1);

      if (creatorWallet.length === 0) {
        creatorWallet = await tx
          .insert(walletsTable)
          .values({ user_id: conversation.creator_id })
          .returning();
      }

      // 5. Credit creator's wallet (minus platform fee)
      const updatedCreatorWallet = await tx
        .update(walletsTable)
        .set({
          balance_usdc: sql`${walletsTable.balance_usdc} + ${creatorEarnings}`,
          updated_at: new Date(),
        })
        .where(eq(walletsTable.id, creatorWallet[0].id))
        .returning();

      // 6. Record creator's credit transaction
      await tx.insert(walletTransactionsTable).values({
        wallet_id: creatorWallet[0].id,
        user_id: conversation.creator_id,
        type: "ppv_received",
        amount_usdc: creatorEarnings,
        balance_after: updatedCreatorWallet[0].balance_usdc,
        description: `AI Chat revenue from ${conversation.name}`,
        reference_id: `ai-chat-${conversationId}`,
        related_user_id: user.id,
        status: "completed",
      });

      // 7. Store the user's message
      const userMsgResult = await tx.execute(sql`
        INSERT INTO ai_chat_messages (conversation_id, role, content, cost_usdc)
        VALUES (${conversationId}, 'user', ${userMessage}, ${pricePerMessage})
        RETURNING *
      `);
      userMsg = userMsgResult[0] as Record<string, unknown>;

      // 8. Update persona stats
      await tx.execute(sql`
        UPDATE ai_chat_personas
        SET total_messages = total_messages + 1,
            total_revenue_usdc = total_revenue_usdc + ${pricePerMessage}
        WHERE id = ${conversation.persona_id}
      `);

      // 9. Update conversation timestamp
      await tx.execute(sql`
        UPDATE ai_chat_conversations SET updated_at = NOW()
        WHERE id = ${conversationId}
      `);
    });

    // 10. Get conversation history for Claude (last N messages)
    const history = await db.execute(sql`
      SELECT role, content FROM ai_chat_messages
      WHERE conversation_id = ${conversationId}
      ORDER BY created_at DESC
      LIMIT ${MAX_HISTORY_MESSAGES}
    `);

    // Reverse so oldest first
    const messages = (history as unknown as Array<{ role: string; content: string }>).reverse();

    // 11. Call Claude API
    const systemPrompt = `You are ${conversation.name}, ${conversation.personality}. ${conversation.system_prompt}. Stay in character at all times. Never break character or reveal you are an AI. Keep responses under 200 words.`;

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const claudeMessages = messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const aiResponse = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: systemPrompt,
      messages: claudeMessages,
    });

    const aiContent =
      aiResponse.content[0]?.type === "text"
        ? aiResponse.content[0].text
        : "Sorry, I couldn't respond right now. Try again!";

    // 12. Store the AI response (no cost — only the user message costs)
    const aiMsgResult = await db.execute(sql`
      INSERT INTO ai_chat_messages (conversation_id, role, content, cost_usdc)
      VALUES (${conversationId}, 'assistant', ${aiContent}, 0)
      RETURNING *
    `);
    aiMsg = aiMsgResult[0] as Record<string, unknown>;

    // Update message count for assistant message too
    await db.execute(sql`
      UPDATE ai_chat_personas
      SET total_messages = total_messages + 1
      WHERE id = ${conversation.persona_id}
    `);

    // Get updated wallet balance for the fan
    const updatedWallet = await db
      .select({ balance_usdc: walletsTable.balance_usdc })
      .from(walletsTable)
      .where(eq(walletsTable.user_id, user.id))
      .limit(1);

    return NextResponse.json({
      data: {
        user_message: userMsg!,
        ai_message: aiMsg,
        wallet_balance: updatedWallet[0]?.balance_usdc ?? 0,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_FUNDS") {
      return NextResponse.json(
        { error: "Insufficient wallet balance. Please add funds.", code: "INSUFFICIENT_FUNDS" },
        { status: 402 },
      );
    }

    console.error("POST /api/ai-chat/[conversationId] error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
