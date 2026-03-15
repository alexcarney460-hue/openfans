export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/utils/api/auth";
import { db } from "@/utils/db/db";
import { sql } from "drizzle-orm";

/**
 * GET /api/stories/[id]/viewers
 *
 * Return list of users who viewed this story.
 * Only the story creator can see viewers of their own stories.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const storyId = params.id;

    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storyId)) {
      return NextResponse.json(
        { error: "Invalid story ID", code: "INVALID_ID" },
        { status: 400 },
      );
    }

    // Verify the story exists and belongs to the requesting user
    const storyRows = await db.execute(sql`
      SELECT creator_id FROM stories WHERE id = ${storyId} LIMIT 1
    `);

    if (storyRows.length === 0) {
      return NextResponse.json(
        { error: "Story not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    if (storyRows[0].creator_id !== user.id) {
      return NextResponse.json(
        { error: "You can only view viewers of your own stories", code: "FORBIDDEN" },
        { status: 403 },
      );
    }

    // Fetch viewers with user info, ordered by most recent view
    const viewers = await db.execute(sql`
      SELECT
        sv.viewer_id,
        sv.viewed_at,
        u.username,
        u.display_name,
        u.avatar_url
      FROM story_views sv
      JOIN users_table u ON u.id = sv.viewer_id
      WHERE sv.story_id = ${storyId}
      ORDER BY sv.viewed_at DESC
    `);

    return NextResponse.json({
      data: viewers.map((v) => ({
        viewer_id: v.viewer_id,
        username: v.username,
        display_name: v.display_name,
        avatar_url: v.avatar_url,
        viewed_at: v.viewed_at,
      })),
      total: viewers.length,
    });
  } catch (err) {
    console.error("GET /api/stories/[id]/viewers error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
