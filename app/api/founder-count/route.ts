import { NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { sql } from "drizzle-orm";

const MAX_FOUNDERS = 100;

/**
 * GET /api/founder-count
 * Public endpoint (no auth required).
 * Returns the current founder count and remaining spots.
 */
export async function GET() {
  try {
    const rows = await db.execute(sql`
      SELECT COUNT(*)::int AS total_founders
      FROM creator_profiles
      WHERE is_founder = true
    `);

    const totalFounders = (rows[0] as { total_founders: number }).total_founders ?? 0;
    const spotsRemaining = Math.max(0, MAX_FOUNDERS - totalFounders);

    return NextResponse.json(
      {
        total_founders: totalFounders,
        spots_remaining: spotsRemaining,
        max_founders: MAX_FOUNDERS,
        is_active: spotsRemaining > 0,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
        },
      },
    );
  } catch (err) {
    console.error("GET /api/founder-count error:", err);
    return NextResponse.json(
      { error: "Failed to fetch founder count" },
      { status: 500 },
    );
  }
}
