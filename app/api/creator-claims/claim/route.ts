import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { sql } from "drizzle-orm";
import { getAuthenticatedUser } from "@/utils/api/auth";

// Helper: cast RowList to plain array
function rows<T = Record<string, unknown>>(result: unknown): T[] {
  return result as T[];
}

// ---------------------------------------------------------------------------
// POST /api/creator-claims/claim — Claim a creator profile
// Body: { claim_token }
// Requires auth. Creates a creator profile, promotes role, marks claim done.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const { user, error: authError } = await getAuthenticatedUser();
  if (authError) return authError;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const claimToken = String(body.claim_token ?? "").trim();
  if (!claimToken) {
    return NextResponse.json(
      { error: "claim_token is required" },
      { status: 400 },
    );
  }

  try {
    // Validate claim token
    const claimRows = rows<{
      id: string;
      platform: string;
      platform_username: string;
      status: string;
    }>(
      await db.execute(sql`
        SELECT id, platform, platform_username, status
        FROM creator_claims
        WHERE claim_token = ${claimToken}
        LIMIT 1
      `),
    );

    if (claimRows.length === 0) {
      return NextResponse.json(
        { error: "Invalid claim token" },
        { status: 404 },
      );
    }

    const claim = claimRows[0];

    if (claim.status === "claimed") {
      return NextResponse.json(
        { error: "This creator page has already been claimed" },
        { status: 409 },
      );
    }

    // Check if user already has a creator profile
    const profileRows = rows(
      await db.execute(sql`
        SELECT id FROM creator_profiles WHERE user_id = ${user.id} LIMIT 1
      `),
    );

    if (profileRows.length > 0) {
      return NextResponse.json(
        { error: "You already have a creator profile" },
        { status: 409 },
      );
    }

    // Create creator profile with default pricing
    await db.execute(sql`
      INSERT INTO creator_profiles (user_id, subscription_price_usdc, categories)
      VALUES (${user.id}, 999, ARRAY[]::text[])
    `);

    // Promote user role to creator (if currently subscriber)
    await db.execute(sql`
      UPDATE users_table
      SET role = 'creator', updated_at = NOW()
      WHERE id = ${user.id} AND role = 'subscriber'
    `);

    // Mark claim as completed
    await db.execute(sql`
      UPDATE creator_claims
      SET status = 'claimed', claimed_by = ${user.id}, claimed_at = NOW()
      WHERE id = ${claim.id}
    `);

    return NextResponse.json({
      data: {
        success: true,
        message: "Creator page claimed successfully! Complete your profile to get started.",
        redirect: "/dashboard/settings",
      },
    });
  } catch (err) {
    console.error("POST /api/creator-claims/claim error:", err);
    return NextResponse.json(
      { error: "Failed to claim creator page" },
      { status: 500 },
    );
  }
}
