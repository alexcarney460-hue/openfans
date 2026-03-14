export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { payoutsTable } from "@/utils/db/schema";
import { eq, desc } from "drizzle-orm";
import { getAuthenticatedUser } from "@/utils/api/auth";

/**
 * GET /api/payouts/mine
 * Returns the authenticated creator's payout history.
 *
 * Query params:
 *   - limit: number (default 50, max 100)
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const limit = Math.min(
      Math.max(
        parseInt(request.nextUrl.searchParams.get("limit") ?? "50", 10),
        1,
      ),
      100,
    );

    const payouts = await db
      .select()
      .from(payoutsTable)
      .where(eq(payoutsTable.creator_id, user.id))
      .orderBy(desc(payoutsTable.created_at))
      .limit(limit);

    return NextResponse.json({ data: payouts });
  } catch (error) {
    console.error("GET /api/payouts/mine error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
