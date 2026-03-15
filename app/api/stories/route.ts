export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/utils/api/auth";
import { db } from "@/utils/db/db";
import { sql } from "drizzle-orm";
import { isValidStorageUrl } from "@/utils/validation";

/**
 * GET /api/stories
 *
 * Returns active (not expired) stories for the feed, grouped by creator.
 * Each creator group includes their stories in chronological order with view counts.
 * Requires authentication.
 */
export async function GET() {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const now = new Date();

    // Fetch active stories only from creators the user is subscribed to (or their own)
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
        u.username,
        u.display_name,
        u.avatar_url,
        CASE WHEN sv.viewer_id IS NOT NULL THEN true ELSE false END AS viewed_by_me
      FROM stories s
      JOIN users_table u ON u.id = s.creator_id
      LEFT JOIN story_views sv ON sv.story_id = s.id AND sv.viewer_id = ${user.id}
      LEFT JOIN subscriptions sub
        ON sub.creator_id = s.creator_id
        AND sub.subscriber_id = ${user.id}
        AND sub.status = 'active'
      WHERE s.expires_at > ${now.toISOString()}
        AND (
          s.creator_id = ${user.id}
          OR sub.id IS NOT NULL
        )
      ORDER BY u.username ASC, s.created_at ASC
    `);

    // Group stories by creator
    const groupedMap = new Map<
      string,
      {
        creator_id: string;
        username: string;
        display_name: string;
        avatar_url: string | null;
        stories: Array<{
          id: string;
          media_url: string;
          media_type: string;
          caption: string | null;
          expires_at: string;
          views_count: number;
          created_at: string;
          viewed_by_me: boolean;
        }>;
      }
    >();

    for (const row of stories) {
      const creatorId = row.creator_id as string;

      if (!groupedMap.has(creatorId)) {
        groupedMap.set(creatorId, {
          creator_id: creatorId,
          username: row.username as string,
          display_name: row.display_name as string,
          avatar_url: row.avatar_url as string | null,
          stories: [],
        });
      }

      groupedMap.get(creatorId)!.stories.push({
        id: row.id as string,
        media_url: row.media_url as string,
        media_type: row.media_type as string,
        caption: row.caption as string | null,
        expires_at: String(row.expires_at),
        views_count: row.views_count as number,
        created_at: String(row.created_at),
        viewed_by_me: row.viewed_by_me === true || row.viewed_by_me === "true",
      });
    }

    const grouped = Array.from(groupedMap.values());

    return NextResponse.json({ data: grouped });
  } catch (err) {
    console.error("GET /api/stories error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/stories
 *
 * Create a new story. Auth required, creator role only.
 *
 * Body: { media_url: string, media_type: 'image'|'video', caption?: string }
 * Stories expire after 24 hours.
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    // Verify user is a creator
    const userRows = await db.execute(sql`
      SELECT role FROM users_table WHERE id = ${user.id} LIMIT 1
    `);

    if (userRows.length === 0 || userRows[0].role !== "creator") {
      return NextResponse.json(
        { error: "Only creators can post stories", code: "CREATOR_REQUIRED" },
        { status: 403 },
      );
    }

    // Parse and validate body
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body", code: "INVALID_BODY" },
        { status: 400 },
      );
    }

    const { media_url, media_type, caption } = body;

    if (!media_url || typeof media_url !== "string") {
      return NextResponse.json(
        { error: "media_url is required", code: "MISSING_MEDIA_URL" },
        { status: 400 },
      );
    }

    // Validate URL is from our trusted storage (prevent SSRF, javascript: URIs, arbitrary domains)
    if (!isValidStorageUrl(media_url)) {
      return NextResponse.json(
        { error: "media_url must be a valid HTTPS URL from an allowed domain", code: "INVALID_MEDIA_URL" },
        { status: 400 },
      );
    }

    if (!media_type || !["image", "video"].includes(media_type)) {
      return NextResponse.json(
        { error: "media_type must be 'image' or 'video'", code: "INVALID_MEDIA_TYPE" },
        { status: 400 },
      );
    }

    if (caption !== undefined && caption !== null) {
      if (typeof caption !== "string") {
        return NextResponse.json(
          { error: "caption must be a string", code: "INVALID_CAPTION" },
          { status: 400 },
        );
      }
      if (caption.length > 200) {
        return NextResponse.json(
          { error: "caption must be 200 characters or less", code: "CAPTION_TOO_LONG" },
          { status: 400 },
        );
      }
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const result = await db.execute(sql`
      INSERT INTO stories (creator_id, media_url, media_type, caption, expires_at, created_at)
      VALUES (
        ${user.id},
        ${media_url},
        ${media_type},
        ${caption ?? null},
        ${expiresAt.toISOString()},
        ${now.toISOString()}
      )
      RETURNING id, creator_id, media_url, media_type, caption, expires_at, views_count, created_at
    `);

    return NextResponse.json({ data: result[0] }, { status: 201 });
  } catch (err) {
    console.error("POST /api/stories error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
