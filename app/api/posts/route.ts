export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { postsTable, usersTable, subscriptionsTable, ppvPurchasesTable, creatorProfilesTable } from "@/utils/db/schema";
import { eq, desc, sql, and, inArray, ne } from "drizzle-orm";
import { getAuthenticatedUser } from "@/utils/api/auth";
import { isValidStorageUrl } from "@/utils/validation";

const MAX_MEDIA_URLS = 20;
const MAX_URL_LENGTH = 2048;

const VALID_TIERS = ["free", "basic", "premium", "vip"] as const;
const VALID_MEDIA_TYPES = ["image", "video", "text", "mixed"] as const;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

type Tier = (typeof VALID_TIERS)[number];
type MediaType = (typeof VALID_MEDIA_TYPES)[number];

// Tier hierarchy for access control: higher index = higher access
const TIER_HIERARCHY: Record<string, number> = {
  free: 0,
  basic: 1,
  premium: 2,
  vip: 3,
};

/**
 * Strip sensitive content from a paid post, returning only metadata.
 */
function redactPaidPost(post: Record<string, unknown>) {
  return {
    id: post.id,
    creator_id: post.creator_id,
    title: post.title,
    media_type: post.media_type,
    tier: post.tier,
    is_free: post.is_free,
    likes_count: post.likes_count,
    comments_count: post.comments_count,
    views_count: post.views_count,
    created_at: post.created_at,
    ppv_price_usdc: post.ppv_price_usdc ?? null,
    is_ppv: (post.ppv_price_usdc ?? null) !== null,
    has_purchased: post.has_purchased ?? false,
    // body and media_urls intentionally omitted
    body: null,
    media_urls: [],
    is_locked: true,
  };
}

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

    // Determine the user's subscription tier for this creator (if authenticated)
    let userTierLevel = 0; // default: free-tier access only
    const { user } = await getAuthenticatedUser();

    // Creator viewing own posts sees everything (including scheduled/hidden);
    // admins also see hidden posts; other users only see published, non-hidden posts.
    const isOwnProfile = user?.id === creatorId;

    let isAdmin = false;
    if (user && !isOwnProfile) {
      const adminCheck = await db
        .select({ role: usersTable.role })
        .from(usersTable)
        .where(eq(usersTable.id, user.id))
        .limit(1);
      isAdmin = adminCheck.length > 0 && adminCheck[0].role === "admin";
    }

    const postsWhereClause = isOwnProfile || isAdmin
      ? eq(postsTable.creator_id, creatorId)
      : and(
          eq(postsTable.creator_id, creatorId),
          eq(postsTable.is_published, true),
          eq(postsTable.is_hidden, false),
        );

    const posts = await db
      .select()
      .from(postsTable)
      .where(postsWhereClause)
      .orderBy(desc(postsTable.created_at))
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(postsTable)
      .where(postsWhereClause);

    const total = countResult[0]?.count ?? 0;

    if (user) {
      // Creator always has full access to their own posts
      if (user.id === creatorId) {
        userTierLevel = TIER_HIERARCHY.vip + 1; // above all tiers
      } else {
        const activeSub = await db
          .select({ tier: subscriptionsTable.tier })
          .from(subscriptionsTable)
          .where(
            and(
              eq(subscriptionsTable.subscriber_id, user.id),
              eq(subscriptionsTable.creator_id, creatorId),
              eq(subscriptionsTable.status, "active"),
            ),
          )
          .limit(1);

        if (activeSub.length > 0) {
          userTierLevel = TIER_HIERARCHY[activeSub[0].tier] ?? 0;
        }
      }
    }

    // Look up PPV purchases for the current user (if authenticated)
    const ppvPostIds = posts
      .filter((p) => p.ppv_price_usdc !== null)
      .map((p) => p.id);

    const purchasedPostIds = new Set<number>();
    if (user && ppvPostIds.length > 0) {
      const purchases = await db
        .select({ post_id: ppvPurchasesTable.post_id })
        .from(ppvPurchasesTable)
        .where(
          and(
            eq(ppvPurchasesTable.buyer_id, user.id),
            inArray(ppvPurchasesTable.post_id, ppvPostIds),
          ),
        );
      for (const p of purchases) {
        if (p.post_id !== null) purchasedPostIds.add(p.post_id);
      }
    }

    // Filter post content based on access level
    const filteredPosts = posts.map((post) => {
      const postTierLevel = TIER_HIERARCHY[post.tier] ?? 0;
      const isPpv = post.ppv_price_usdc !== null;
      const hasPurchased = purchasedPostIds.has(post.id);

      // Determine if user has access:
      //   1) Free post
      //   2) User's subscription tier >= post tier
      //   3) PPV post that the user has purchased
      const hasSubscriptionAccess =
        post.is_free || post.tier === "free" || userTierLevel >= postTierLevel;
      const hasAccess = hasSubscriptionAccess || (isPpv && hasPurchased);

      const ppvFields = {
        is_ppv: isPpv,
        ppv_price_usdc: post.ppv_price_usdc,
        has_purchased: hasPurchased,
      };

      if (hasAccess) {
        return { ...post, ...ppvFields, is_locked: false };
      }
      // Paid post the user cannot access: strip body and media_urls
      return redactPaidPost({ ...post, has_purchased: hasPurchased });
    });

    return NextResponse.json({
      data: filteredPosts,
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

    // Check verification status — creators must be verified to publish
    const creatorProfile = await db
      .select({ verification_status: creatorProfilesTable.verification_status })
      .from(creatorProfilesTable)
      .where(eq(creatorProfilesTable.user_id, user.id))
      .limit(1);

    if (
      creatorProfile.length === 0 ||
      creatorProfile[0].verification_status !== "verified"
    ) {
      return NextResponse.json(
        {
          error: "You must verify your identity before publishing content",
          code: "NOT_VERIFIED",
        },
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

    const { title, body: postBody, media_urls, media_type, tier, is_free, ppv_price_usdc, scheduled_at, video_asset_id } = body;

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

    // Validate ppv_price_usdc if provided
    let validatedPpvPrice: number | null = null;
    if (ppv_price_usdc !== undefined && ppv_price_usdc !== null) {
      if (typeof ppv_price_usdc !== "number" || !Number.isInteger(ppv_price_usdc)) {
        return NextResponse.json(
          { error: "ppv_price_usdc must be an integer (cents)", code: "INVALID_PPV_PRICE" },
          { status: 400 },
        );
      }
      if (ppv_price_usdc < 100) {
        return NextResponse.json(
          { error: "PPV price must be at least $1.00 (100 cents)", code: "PPV_PRICE_TOO_LOW" },
          { status: 400 },
        );
      }
      validatedPpvPrice = ppv_price_usdc;
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
      if (media_urls.length > MAX_MEDIA_URLS) {
        return NextResponse.json(
          { error: `media_urls cannot exceed ${MAX_MEDIA_URLS} items`, code: "TOO_MANY_MEDIA_URLS" },
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
        if (url.length > MAX_URL_LENGTH) {
          return NextResponse.json(
            { error: `Each media_url must be under ${MAX_URL_LENGTH} characters`, code: "MEDIA_URL_TOO_LONG" },
            { status: 400 },
          );
        }
        if (!isValidStorageUrl(url)) {
          return NextResponse.json(
            { error: "Each media_url must be a valid HTTPS URL from an allowed domain", code: "INVALID_MEDIA_URL" },
            { status: 400 },
          );
        }
        validatedMediaUrls.push(url);
      }
    }

    // Validate and handle scheduled_at
    let validatedScheduledAt: Date | null = null;
    let isPublished = true;
    if (scheduled_at !== undefined && scheduled_at !== null) {
      const parsedDate = new Date(scheduled_at);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { error: "scheduled_at must be a valid ISO date string", code: "INVALID_SCHEDULED_AT" },
          { status: 400 },
        );
      }
      if (parsedDate > new Date()) {
        // Future date: mark as unpublished and save schedule
        validatedScheduledAt = parsedDate;
        isPublished = false;
      }
      // If date is in the past or now, publish immediately (isPublished stays true)
    }

    // Validate video_asset_id if provided
    let validatedVideoAssetId: string | null = null;
    if (video_asset_id !== undefined && video_asset_id !== null) {
      if (typeof video_asset_id !== "string" || video_asset_id.trim().length === 0) {
        return NextResponse.json(
          { error: "video_asset_id must be a non-empty string", code: "INVALID_VIDEO_ASSET_ID" },
          { status: 400 },
        );
      }

      // Verify the video asset exists and belongs to this creator
      const videoCheck = await db.execute(sql`
        SELECT id, creator_id, status FROM video_assets
        WHERE id = ${video_asset_id.trim()}
        LIMIT 1
      `);

      if (videoCheck.length === 0) {
        return NextResponse.json(
          { error: "Video asset not found", code: "VIDEO_NOT_FOUND" },
          { status: 404 },
        );
      }

      const videoAsset = videoCheck[0] as Record<string, unknown>;
      if (videoAsset.creator_id !== user.id) {
        return NextResponse.json(
          { error: "Video asset not found", code: "VIDEO_NOT_FOUND" },
          { status: 404 },
        );
      }

      validatedVideoAssetId = video_asset_id.trim();
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
        ppv_price_usdc: validatedPpvPrice,
        scheduled_at: validatedScheduledAt,
        is_published: isPublished,
      })
      .returning();

    const createdPost = newPost[0];

    // Link video asset to the post via raw SQL (adds video_asset_id column if needed)
    if (validatedVideoAssetId && createdPost) {
      // Ensure the video_asset_id column exists on the posts table
      await db.execute(sql`
        ALTER TABLE posts
        ADD COLUMN IF NOT EXISTS video_asset_id TEXT
        REFERENCES video_assets(id) ON DELETE SET NULL
      `);

      // Set the video_asset_id on the newly created post
      await db.execute(sql`
        UPDATE posts
        SET video_asset_id = ${validatedVideoAssetId}
        WHERE id = ${createdPost.id}
      `);

      // Return the post with video_asset_id included
      return NextResponse.json(
        { data: { ...createdPost, video_asset_id: validatedVideoAssetId } },
        { status: 201 },
      );
    }

    return NextResponse.json({ data: createdPost }, { status: 201 });
  } catch (error) {
    console.error("POST /api/posts error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
