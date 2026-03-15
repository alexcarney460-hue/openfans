export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { promotionsTable, usersTable } from "@/utils/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getAuthenticatedUser } from "@/utils/api/auth";
import { checkRateLimit, getRateLimitKey } from "@/utils/rate-limit";

/**
 * Generate a random alphanumeric promo code (8 characters, uppercase).
 */
function generatePromoCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1 for readability
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Sanitize and validate a user-provided promo code.
 * Must be 2-20 alphanumeric characters (plus hyphens/underscores).
 */
function sanitizeCode(raw: string): string | null {
  const trimmed = raw.trim().toUpperCase();
  if (!/^[A-Z0-9_-]{2,20}$/.test(trimmed)) return null;
  return trimmed;
}

/**
 * GET /api/promotions
 * List the authenticated creator's promotions.
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    // Verify user is a creator
    const dbUser = await db
      .select({ role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .limit(1);

    if (dbUser.length === 0 || (dbUser[0].role !== "creator" && dbUser[0].role !== "admin")) {
      return NextResponse.json(
        { error: "Only creators can manage promotions", code: "NOT_CREATOR" },
        { status: 403 },
      );
    }

    const promos = await db
      .select()
      .from(promotionsTable)
      .where(eq(promotionsTable.creator_id, user.id))
      .orderBy(desc(promotionsTable.created_at));

    return NextResponse.json({ data: promos });
  } catch (error) {
    console.error("GET /api/promotions error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/promotions
 * Create a new promotion.
 *
 * Body:
 *   - code?: string (optional — auto-generated if omitted)
 *   - type: "discount" | "free_trial"
 *   - discount_percent?: number (10-90, required if type=discount)
 *   - trial_days?: number (1-30, required if type=free_trial)
 *   - max_uses?: number (optional, null = unlimited)
 *   - expires_at?: string (ISO date, optional)
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const rateLimited = await checkRateLimit(
      request, getRateLimitKey(request, user.id), "promotions", 20, 60_000,
    );
    if (rateLimited) return rateLimited;

    // Verify user is a creator
    const dbUser = await db
      .select({ role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .limit(1);

    if (dbUser.length === 0 || (dbUser[0].role !== "creator" && dbUser[0].role !== "admin")) {
      return NextResponse.json(
        { error: "Only creators can create promotions", code: "NOT_CREATOR" },
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

    const { type, discount_percent, trial_days, max_uses, expires_at } = body;

    // Validate type
    if (type !== "discount" && type !== "free_trial") {
      return NextResponse.json(
        { error: "type must be 'discount' or 'free_trial'", code: "INVALID_TYPE" },
        { status: 400 },
      );
    }

    // Validate discount_percent
    if (type === "discount") {
      if (
        discount_percent == null ||
        !Number.isInteger(discount_percent) ||
        discount_percent < 10 ||
        discount_percent > 90
      ) {
        return NextResponse.json(
          { error: "discount_percent must be an integer between 10 and 90", code: "INVALID_DISCOUNT" },
          { status: 400 },
        );
      }
    }

    // Validate trial_days
    if (type === "free_trial") {
      if (
        trial_days == null ||
        !Number.isInteger(trial_days) ||
        trial_days < 1 ||
        trial_days > 30
      ) {
        return NextResponse.json(
          { error: "trial_days must be an integer between 1 and 30", code: "INVALID_TRIAL_DAYS" },
          { status: 400 },
        );
      }
    }

    // Validate max_uses
    if (max_uses != null && (!Number.isInteger(max_uses) || max_uses < 1)) {
      return NextResponse.json(
        { error: "max_uses must be a positive integer", code: "INVALID_MAX_USES" },
        { status: 400 },
      );
    }

    // Validate expires_at
    let parsedExpiry: Date | null = null;
    if (expires_at) {
      parsedExpiry = new Date(expires_at);
      if (isNaN(parsedExpiry.getTime())) {
        return NextResponse.json(
          { error: "expires_at must be a valid ISO date", code: "INVALID_EXPIRY" },
          { status: 400 },
        );
      }
      if (parsedExpiry.getTime() <= Date.now()) {
        return NextResponse.json(
          { error: "expires_at must be in the future", code: "EXPIRY_IN_PAST" },
          { status: 400 },
        );
      }
    }

    // Resolve promo code
    let code: string;
    if (body.code && typeof body.code === "string") {
      const sanitized = sanitizeCode(body.code);
      if (!sanitized) {
        return NextResponse.json(
          { error: "code must be 2-20 alphanumeric characters (hyphens and underscores allowed)", code: "INVALID_CODE" },
          { status: 400 },
        );
      }
      code = sanitized;
    } else {
      code = generatePromoCode();
    }

    // Check code uniqueness for this creator
    const existing = await db
      .select({ id: promotionsTable.id })
      .from(promotionsTable)
      .where(
        and(
          eq(promotionsTable.creator_id, user.id),
          eq(promotionsTable.code, code),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "You already have a promotion with this code", code: "DUPLICATE_CODE" },
        { status: 409 },
      );
    }

    const [newPromo] = await db
      .insert(promotionsTable)
      .values({
        creator_id: user.id,
        code,
        type,
        discount_percent: type === "discount" ? discount_percent : null,
        trial_days: type === "free_trial" ? trial_days : null,
        max_uses: max_uses ?? null,
        expires_at: parsedExpiry,
      })
      .returning();

    return NextResponse.json({ data: newPromo }, { status: 201 });
  } catch (error) {
    console.error("POST /api/promotions error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/promotions
 * Deactivate a promotion.
 *
 * Body:
 *   - id: number (promotion ID)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const body = await request.json().catch(() => null);
    if (!body || !body.id || !Number.isInteger(body.id)) {
      return NextResponse.json(
        { error: "id is required and must be an integer", code: "INVALID_ID" },
        { status: 400 },
      );
    }

    // Only let the creator deactivate their own promotions
    const promo = await db
      .select({ id: promotionsTable.id, creator_id: promotionsTable.creator_id })
      .from(promotionsTable)
      .where(eq(promotionsTable.id, body.id))
      .limit(1);

    if (promo.length === 0) {
      return NextResponse.json(
        { error: "Promotion not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    if (promo[0].creator_id !== user.id) {
      return NextResponse.json(
        { error: "You can only manage your own promotions", code: "FORBIDDEN" },
        { status: 403 },
      );
    }

    const [updated] = await db
      .update(promotionsTable)
      .set({ is_active: false })
      .where(eq(promotionsTable.id, body.id))
      .returning();

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("DELETE /api/promotions error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/promotions
 * Toggle a promotion active/inactive.
 *
 * Body:
 *   - id: number (promotion ID)
 *   - is_active: boolean
 */
export async function PATCH(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const body = await request.json().catch(() => null);
    if (!body || !body.id || !Number.isInteger(body.id) || typeof body.is_active !== "boolean") {
      return NextResponse.json(
        { error: "id (integer) and is_active (boolean) are required", code: "INVALID_BODY" },
        { status: 400 },
      );
    }

    const promo = await db
      .select({ id: promotionsTable.id, creator_id: promotionsTable.creator_id })
      .from(promotionsTable)
      .where(eq(promotionsTable.id, body.id))
      .limit(1);

    if (promo.length === 0) {
      return NextResponse.json(
        { error: "Promotion not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    if (promo[0].creator_id !== user.id) {
      return NextResponse.json(
        { error: "You can only manage your own promotions", code: "FORBIDDEN" },
        { status: 403 },
      );
    }

    const [updated] = await db
      .update(promotionsTable)
      .set({ is_active: body.is_active })
      .where(eq(promotionsTable.id, body.id))
      .returning();

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("PATCH /api/promotions error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
