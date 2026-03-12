import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { postsTable, usersTable } from "@/utils/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getAuthenticatedUser } from "@/utils/api/auth";

const VALID_TIERS = ["free", "basic", "premium", "vip"] as const;
const VALID_MEDIA_TYPES = ["image", "video", "text", "mixed"] as const;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

type Tier = (typeof VALID_TIERS)[number];
type MediaType = (typeof VALID_MEDIA_TYPES)[number];

/**
 * GET /api/posts
 * List posts for a creator's feed, paginated.
 *
 * Query params:
 *   - creator_id: filter by creator (required)
 *   - page: page number (default 1)
 *   - limit: results per page (default 20, max 100)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const creatorId = searchParams.get("creator_id")?.trim();
    if (!creatorId) {
      return NextResponse.json(
        { error: "creator_id query parameter is required", code: "MISSING_CREATOR_ID" },
        { status: 400 },
      );
    }

    const page = Math.max(
      1,
      parseInt(searchParams.get("page") || String(DEFAULT_PAGE), 10) || DEFAULT_PAGE,
    );
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(
        1,
        parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT,
      ),
    );
    const offset = (page - 1) * limit;

    const posts = await db
      .select()
      .from(postsTable)
      .where(eq(postsTable.creator_id, creatorId))
      .orderBy(desc(postsTable.created_at))
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(postsTable)
      .where(eq(postsTable.creator_id, creatorId));

    const total = countResult[0]?.count ?? 0;

    return NextResponse.json({
      data: posts,
      meta: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/posts error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/posts
 * Create a new post. Requires authentication and creator role.
 *
 * Body:
 *   - title: string (required)
 *   - body: string (optional)
 *   - media_urls: string[] (optional)
 *   - media_type: "image" | "video" | "text" | "mixed" (required)
 *   - tier: "free" | "basic" | "premium" | "vip" (default "basic")
 *   - is_free: boolean (default false)
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    // Verify user is a creator
    const userResult = await db
      .select({ role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .limit(1);

    if (userResult.length === 0 || userResult[0].role !== "creator") {
      return NextResponse.json(
        { error: "Only creators can publish posts", code: "NOT_CREATOR" },
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

    const { title, body: postBody, media_urls, media_type, tier, is_free } = body;

    // Validate required fields
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "title is required", code: "MISSING_TITLE" },
        { status: 400 },
      );
    }

    if (!media_type || !VALID_MEDIA_TYPES.includes(media_type)) {
      return NextResponse.json(
        {
          error: `media_type must be one of: ${VALID_MEDIA_TYPES.join(", ")}`,
          code: "INVALID_MEDIA_TYPE",
        },
        { status: 400 },
      );
    }

    const postTier: Tier = tier || "basic";
    if (!VALID_TIERS.includes(postTier)) {
      return NextResponse.json(
        {
          error: `tier must be one of: ${VALID_TIERS.join(", ")}`,
          code: "INVALID_TIER",
        },
        { status: 400 },
      );
    }

    // Validate media_urls is an array of strings if provided
    const validatedMediaUrls: string[] = [];
    if (media_urls !== undefined && media_urls !== null) {
      if (!Array.isArray(media_urls)) {
        return NextResponse.json(
          { error: "media_urls must be an array of strings", code: "INVALID_MEDIA_URLS" },
          { status: 400 },
        );
      }
      for (const url of media_urls) {
        if (typeof url !== "string") {
          return NextResponse.json(
            { error: "Each media_url must be a string", code: "INVALID_MEDIA_URL" },
            { status: 400 },
          );
        }
        validatedMediaUrls.push(url);
      }
    }

    const newPost = await db
      .insert(postsTable)
      .values({
        creator_id: user.id,
        title: title.trim(),
        body: postBody || null,
        media_urls: validatedMediaUrls,
        media_type: media_type as MediaType,
        tier: postTier,
        is_free: is_free === true,
      })
      .returning();

    return NextResponse.json({ data: newPost[0] }, { status: 201 });
  } catch (error) {
    console.error("POST /api/posts error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
