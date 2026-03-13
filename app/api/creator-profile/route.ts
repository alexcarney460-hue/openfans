import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/utils/api/auth";
import { db } from "@/utils/db/db";
import { creatorProfilesTable, usersTable } from "@/utils/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/creator-profile
 * Returns the authenticated user's creator profile.
 */
export async function GET() {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const rows = await db
      .select()
      .from(creatorProfilesTable)
      .where(eq(creatorProfilesTable.user_id, user.id))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Creator profile not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: rows[0] });
  } catch (err) {
    console.error("GET /api/creator-profile error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/creator-profile
 * Create or update a creator profile for the authenticated user.
 * Also promotes the user's role to "creator" if not already.
 *
 * Body:
 *   - subscription_price: number (USDC, e.g. 9.99)
 *   - categories: string[]
 *   - payout_wallet: string (optional)
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

    const { subscription_price, categories, payout_wallet } = body;

    // Validate subscription price
    if (
      subscription_price === undefined ||
      subscription_price === null ||
      isNaN(Number(subscription_price)) ||
      Number(subscription_price) <= 0
    ) {
      return NextResponse.json(
        { error: "Valid subscription_price is required", code: "INVALID_PRICE" },
        { status: 400 },
      );
    }

    // Validate categories
    if (!Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json(
        { error: "At least one category is required", code: "INVALID_CATEGORIES" },
        { status: 400 },
      );
    }

    const priceInCents = Math.round(Number(subscription_price) * 100);

    // Check if a creator profile already exists
    const existing = await db
      .select({ id: creatorProfilesTable.id })
      .from(creatorProfilesTable)
      .where(eq(creatorProfilesTable.user_id, user.id))
      .limit(1);

    let profile;

    if (existing.length > 0) {
      // Update existing profile
      const updates: Record<string, unknown> = {
        subscription_price_usdc: priceInCents,
        categories: categories.map(String),
      };
      if (typeof payout_wallet === "string" && payout_wallet.trim()) {
        updates.payout_wallet = payout_wallet.trim();
      }

      const updated = await db
        .update(creatorProfilesTable)
        .set(updates)
        .where(eq(creatorProfilesTable.user_id, user.id))
        .returning();

      profile = updated[0];
    } else {
      // Create new profile
      const inserted = await db
        .insert(creatorProfilesTable)
        .values({
          user_id: user.id,
          subscription_price_usdc: priceInCents,
          categories: categories.map(String),
          payout_wallet:
            typeof payout_wallet === "string" && payout_wallet.trim()
              ? payout_wallet.trim()
              : null,
        })
        .returning();

      profile = inserted[0];
    }

    // Promote user role to "creator" if not already
    await db
      .update(usersTable)
      .set({ role: "creator", updated_at: new Date() })
      .where(eq(usersTable.id, user.id));

    return NextResponse.json(
      { data: profile },
      { status: existing.length > 0 ? 200 : 201 },
    );
  } catch (err) {
    console.error("POST /api/creator-profile error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/creator-profile
 * Updates an existing creator profile.
 *
 * Body (all optional):
 *   - subscription_price: number (USDC, e.g. 9.99)
 *   - categories: string[]
 *   - payout_wallet: string
 */
export async function PATCH(request: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body", code: "INVALID_BODY" },
        { status: 400 },
      );
    }

    const updates: Record<string, unknown> = {};

    if (
      body.subscription_price !== undefined &&
      !isNaN(Number(body.subscription_price)) &&
      Number(body.subscription_price) > 0
    ) {
      updates.subscription_price_usdc = Math.round(Number(body.subscription_price) * 100);
    }

    if (Array.isArray(body.categories) && body.categories.length > 0) {
      updates.categories = body.categories.map(String);
    }

    if (typeof body.payout_wallet === "string") {
      updates.payout_wallet = body.payout_wallet.trim() || null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update", code: "NO_UPDATES" },
        { status: 400 },
      );
    }

    const updated = await db
      .update(creatorProfilesTable)
      .set(updates)
      .where(eq(creatorProfilesTable.user_id, user.id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: "Creator profile not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: updated[0] });
  } catch (err) {
    console.error("PATCH /api/creator-profile error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
