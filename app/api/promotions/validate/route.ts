export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { promotionsTable } from "@/utils/db/schema";
import { eq, and } from "drizzle-orm";
import { checkRateLimit, getRateLimitKey } from "@/utils/rate-limit";

/**
 * POST /api/promotions/validate
 * Validate a promo code for a specific creator.
 *
 * Body:
 *   - code: string
 *   - creator_id: string
 *
 * Returns the promotion details if valid, or an error explaining why it's invalid.
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit: 30 requests per minute (public endpoint, slightly generous)
    const rateLimited = await checkRateLimit(
      request,
      getRateLimitKey(request),
      "promo-validate",
      30,
      60_000,
    );
    if (rateLimited) return rateLimited;

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body", code: "INVALID_BODY" },
        { status: 400 },
      );
    }

    const { code, creator_id } = body;

    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return NextResponse.json(
        { error: "code is required", code: "MISSING_CODE" },
        { status: 400 },
      );
    }

    if (!creator_id || typeof creator_id !== "string") {
      return NextResponse.json(
        { error: "creator_id is required", code: "MISSING_CREATOR_ID" },
        { status: 400 },
      );
    }

    const normalizedCode = code.trim().toUpperCase();

    // Look up the promotion
    const promos = await db
      .select()
      .from(promotionsTable)
      .where(
        and(
          eq(promotionsTable.creator_id, creator_id),
          eq(promotionsTable.code, normalizedCode),
        ),
      )
      .limit(1);

    if (promos.length === 0) {
      return NextResponse.json(
        { error: "Invalid promo code", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    const promo = promos[0];

    // Check if active
    if (!promo.is_active) {
      return NextResponse.json(
        { error: "This promo code is no longer active", code: "INACTIVE" },
        { status: 410 },
      );
    }

    // Check expiry
    if (promo.expires_at && new Date(promo.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { error: "This promo code has expired", code: "EXPIRED" },
        { status: 410 },
      );
    }

    // Check max uses
    if (promo.max_uses !== null && promo.current_uses >= promo.max_uses) {
      return NextResponse.json(
        { error: "This promo code has reached its maximum uses", code: "MAX_USES_REACHED" },
        { status: 410 },
      );
    }

    // Return valid promotion details
    return NextResponse.json({
      data: {
        id: promo.id,
        code: promo.code,
        type: promo.type,
        discount_percent: promo.discount_percent,
        trial_days: promo.trial_days,
      },
    });
  } catch (error) {
    console.error("POST /api/promotions/validate error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
