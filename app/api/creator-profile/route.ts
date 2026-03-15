export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/utils/api/auth";
import { db } from "@/utils/db/db";
import { creatorProfilesTable, usersTable } from "@/utils/db/schema";
import { eq, sql } from "drizzle-orm";
import { isValidSolanaAddress } from "@/utils/validation";

const VALID_PAYOUT_SCHEDULES = ["manual", "weekly", "monthly"] as const;
type PayoutSchedule = (typeof VALID_PAYOUT_SCHEDULES)[number];

/**
 * GET /api/creator-profile
 * Returns the authenticated user's creator profile.
 */
export async function GET() {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    // Use raw SQL to include payout_schedule column (not in Drizzle schema).
    // Explicitly select columns, excluding PII: verification_document_url,
    // verification_selfie_url, legal_name, date_of_birth
    const rows = await db.execute(sql`
      SELECT
        id,
        user_id,
        subscription_price_usdc,
        premium_price_usdc,
        vip_price_usdc,
        total_subscribers,
        total_earnings_usdc,
        payout_wallet,
        categories,
        is_featured,
        verification_status,
        verification_submitted_at,
        verification_notes,
        created_at,
        COALESCE(payout_schedule, 'manual') AS payout_schedule
      FROM creator_profiles
      WHERE user_id = ${user.id}
      LIMIT 1
    `);

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

    const { subscription_price, premium_price, vip_price, categories, payout_wallet } = body;

    // Validate subscription price (basic tier, required)
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

    // Validate and convert tier prices (null means tier not offered)
    let premiumCents: number | null = null;
    if (premium_price !== undefined && premium_price !== null) {
      const premVal = Number(premium_price);
      if (isNaN(premVal) || premVal <= 0) {
        return NextResponse.json(
          { error: "premium_price must be a positive number", code: "INVALID_PREMIUM_PRICE" },
          { status: 400 },
        );
      }
      premiumCents = Math.round(premVal * 100);
      if (premiumCents <= priceInCents) {
        return NextResponse.json(
          { error: "Premium price must be greater than Basic price", code: "INVALID_TIER_PRICING" },
          { status: 400 },
        );
      }
    }

    let vipCents: number | null = null;
    if (vip_price !== undefined && vip_price !== null) {
      const vipVal = Number(vip_price);
      if (isNaN(vipVal) || vipVal <= 0) {
        return NextResponse.json(
          { error: "vip_price must be a positive number", code: "INVALID_VIP_PRICE" },
          { status: 400 },
        );
      }
      vipCents = Math.round(vipVal * 100);
      const referencePrice = premiumCents ?? priceInCents;
      if (vipCents <= referencePrice) {
        return NextResponse.json(
          { error: "VIP price must be greater than " + (premiumCents ? "Premium" : "Basic") + " price", code: "INVALID_TIER_PRICING" },
          { status: 400 },
        );
      }
    }

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
        premium_price_usdc: premiumCents,
        vip_price_usdc: vipCents,
        categories: categories.map(String),
      };
      if (typeof payout_wallet === "string" && payout_wallet.trim()) {
        if (!isValidSolanaAddress(payout_wallet.trim())) {
          return NextResponse.json(
            { error: "payout_wallet must be a valid Solana address", code: "INVALID_WALLET" },
            { status: 400 },
          );
        }
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
      let validatedWallet: string | null = null;
      if (typeof payout_wallet === "string" && payout_wallet.trim()) {
        if (!isValidSolanaAddress(payout_wallet.trim())) {
          return NextResponse.json(
            { error: "payout_wallet must be a valid Solana address", code: "INVALID_WALLET" },
            { status: 400 },
          );
        }
        validatedWallet = payout_wallet.trim();
      }

      const inserted = await db
        .insert(creatorProfilesTable)
        .values({
          user_id: user.id,
          subscription_price_usdc: priceInCents,
          premium_price_usdc: premiumCents,
          vip_price_usdc: vipCents,
          categories: categories.map(String),
          payout_wallet: validatedWallet,
        })
        .returning();

      profile = inserted[0];
    }

    // Promote user role to "creator" only from "subscriber".
    // Never overwrite "admin" or demote existing "creator".
    const currentUser = await db
      .select({ role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .limit(1);

    const currentRole = currentUser[0]?.role;
    if (currentRole === "subscriber") {
      await db
        .update(usersTable)
        .set({ role: "creator", updated_at: new Date() })
        .where(eq(usersTable.id, user.id));
    }

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
 *   - premium_price: number | null (USDC, null to disable)
 *   - vip_price: number | null (USDC, null to disable)
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

    // Handle premium_price (null to disable, number to set)
    if (body.premium_price !== undefined) {
      if (body.premium_price === null) {
        updates.premium_price_usdc = null;
      } else if (!isNaN(Number(body.premium_price)) && Number(body.premium_price) > 0) {
        updates.premium_price_usdc = Math.round(Number(body.premium_price) * 100);
      }
    }

    // Handle vip_price (null to disable, number to set)
    if (body.vip_price !== undefined) {
      if (body.vip_price === null) {
        updates.vip_price_usdc = null;
      } else if (!isNaN(Number(body.vip_price)) && Number(body.vip_price) > 0) {
        updates.vip_price_usdc = Math.round(Number(body.vip_price) * 100);
      }
    }

    if (Array.isArray(body.categories) && body.categories.length > 0) {
      updates.categories = body.categories.map(String);
    }

    if (typeof body.payout_wallet === "string") {
      const trimmedWallet = body.payout_wallet.trim();
      if (trimmedWallet && !isValidSolanaAddress(trimmedWallet)) {
        return NextResponse.json(
          { error: "payout_wallet must be a valid Solana address", code: "INVALID_WALLET" },
          { status: 400 },
        );
      }
      updates.payout_wallet = trimmedWallet || null;
    }

    // Handle payout_schedule update (stored via raw SQL, not in Drizzle schema)
    let payoutScheduleUpdate: PayoutSchedule | null = null;
    if (typeof body.payout_schedule === "string") {
      const schedule = body.payout_schedule.trim().toLowerCase();
      if (!VALID_PAYOUT_SCHEDULES.includes(schedule as PayoutSchedule)) {
        return NextResponse.json(
          { error: "payout_schedule must be 'manual', 'weekly', or 'monthly'", code: "INVALID_PAYOUT_SCHEDULE" },
          { status: 400 },
        );
      }
      payoutScheduleUpdate = schedule as PayoutSchedule;
    }

    if (Object.keys(updates).length === 0 && payoutScheduleUpdate === null) {
      return NextResponse.json(
        { error: "No valid fields to update", code: "NO_UPDATES" },
        { status: 400 },
      );
    }

    // Validate tier pricing hierarchy: basic < premium < vip
    // Fetch current profile values to compare against
    const currentProfile = await db
      .select({
        subscription_price_usdc: creatorProfilesTable.subscription_price_usdc,
        premium_price_usdc: creatorProfilesTable.premium_price_usdc,
        vip_price_usdc: creatorProfilesTable.vip_price_usdc,
      })
      .from(creatorProfilesTable)
      .where(eq(creatorProfilesTable.user_id, user.id))
      .limit(1);

    if (currentProfile.length > 0) {
      const current = currentProfile[0];
      const effectiveBasic = (updates.subscription_price_usdc as number | undefined) ?? current.subscription_price_usdc;
      const effectivePremium = updates.premium_price_usdc !== undefined
        ? (updates.premium_price_usdc as number | null)
        : current.premium_price_usdc;
      const effectiveVip = updates.vip_price_usdc !== undefined
        ? (updates.vip_price_usdc as number | null)
        : current.vip_price_usdc;

      if (effectivePremium !== null && effectivePremium !== undefined && effectivePremium <= effectiveBasic) {
        return NextResponse.json(
          { error: "Premium price must be greater than Basic price", code: "INVALID_TIER_PRICING" },
          { status: 400 },
        );
      }

      if (effectiveVip !== null && effectiveVip !== undefined) {
        const referencePrice = effectivePremium ?? effectiveBasic;
        if (effectiveVip <= referencePrice) {
          return NextResponse.json(
            { error: `VIP price must be greater than ${effectivePremium ? "Premium" : "Basic"} price`, code: "INVALID_TIER_PRICING" },
            { status: 400 },
          );
        }
      }
    }

    // If only payout_schedule is being updated, skip the Drizzle update
    let updatedProfile;
    if (Object.keys(updates).length > 0) {
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
      updatedProfile = updated[0];
    }

    // Update payout_schedule via raw SQL (column not in Drizzle schema)
    if (payoutScheduleUpdate !== null) {
      await db.execute(sql`
        UPDATE creator_profiles
        SET payout_schedule = ${payoutScheduleUpdate}
        WHERE user_id = ${user.id}
      `);
    }

    // Fetch the final profile state including payout_schedule (excluding PII columns)
    const finalProfile = await db.execute(sql`
      SELECT
        id,
        user_id,
        subscription_price_usdc,
        premium_price_usdc,
        vip_price_usdc,
        total_subscribers,
        total_earnings_usdc,
        payout_wallet,
        categories,
        is_featured,
        verification_status,
        verification_submitted_at,
        verification_notes,
        created_at,
        COALESCE(payout_schedule, 'manual') AS payout_schedule
      FROM creator_profiles
      WHERE user_id = ${user.id}
      LIMIT 1
    `);

    return NextResponse.json({ data: finalProfile[0] ?? updatedProfile });
  } catch (err) {
    console.error("PATCH /api/creator-profile error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
