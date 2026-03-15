export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/utils/api/auth";
import { db } from "@/utils/db/db";
import { sql } from "drizzle-orm";

/**
 * GET /api/stories/my
 *
 * Return the authenticated creator's own stories.
 * Includes both active stories and recently expired ones (up to 48h after expiry)
 * so creators can review performance before stories are cleaned up.
 */
export async function GET() {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    // Verify user is a creator
    const userRows = await db.execute(sql`
      SELECT role FROM users_table WHERE id = ${user.id} LIMIT 1
    `);

    if (userRows.length === 0 || userRows[0].role !== "creator") {
      return NextResponse.json(
        { error: "Only creators can access their stories", code: "CREATOR_REQUIRED" },
        { status: 403 },
      );
    }

    // 48 hours ago — stories expired longer than this are excluded
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const now = new Date();

    const stories = await db.execute(sql`
      SELECT
        s.id,
        s.creator_id,
        s.media_url,
        s.media_type,
        s.caption,
        s.expires_at,
        s.views_count,
        s.created_at,
        CASE WHEN s.expires_at > ${now.toISOString()} THEN true ELSE false END AS is_active
      FROM stories s
      WHERE s.creator_id = ${user.id}
        AND s.expires_at > ${cutoff.toISOString()}
      ORDER BY s.created_at DESC
    `);

    return NextResponse.json({
      data: stories.map((s) => ({
        id: s.id,
        creator_id: s.creator_id,
        media_url: s.media_url,
        media_type: s.media_type,
        caption: s.caption,
        expires_at: s.expires_at,
        views_count: s.views_count,
        created_at: s.created_at,
        is_active: s.is_active === true || s.is_active === "true",
      })),
    });
  } catch (err) {
    console.error("GET /api/stories/my error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
