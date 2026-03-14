export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { followsTable, postsTable, usersTable, subscriptionsTable, ppvPurchasesTable } from "@/utils/db/schema";
import { eq, desc, inArray, and, sql } from "drizzle-orm";
import { getAuthenticatedUser } from "@/utils/api/auth";

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
    body: null,
    media_urls: [],
    is_locked: true,
  };
}

/**
 * GET /api/feed/following
 * Get posts from creators the current user follows.
 * Returns { data: Array<{ post, creator }> }
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "30", 10), 100);
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);

    // Get list of followed creator IDs
    const followedCreators = await db
      .select({ following_id: followsTable.following_id })
      .from(followsTable)
      .where(eq(followsTable.follower_id, user.id));

    const creatorIds = followedCreators.map((f) => f.following_id);

    if (creatorIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Fetch posts from followed creators (only published, non-hidden)
    const results = await db
      .select({
        post_id: postsTable.id,
        post_title: postsTable.title,
        post_body: postsTable.body,
        post_media_urls: postsTable.media_urls,
        post_media_type: postsTable.media_type,
        post_is_free: postsTable.is_free,
        post_tier: postsTable.tier,
        post_ppv_price_usdc: postsTable.ppv_price_usdc,
        post_likes_count: postsTable.likes_count,
        post_comments_count: postsTable.comments_count,
        post_views_count: postsTable.views_count,
        post_created_at: postsTable.created_at,
        post_creator_id: postsTable.creator_id,
        creator_id: usersTable.id,
        creator_username: usersTable.username,
        creator_display_name: usersTable.display_name,
        creator_avatar_url: usersTable.avatar_url,
        creator_is_verified: usersTable.is_verified,
      })
      .from(postsTable)
      .innerJoin(usersTable, eq(postsTable.creator_id, usersTable.id))
      .where(
        and(
          inArray(postsTable.creator_id, creatorIds),
          eq(postsTable.is_published, true),
          eq(postsTable.is_hidden, false),
        ),
      )
      .orderBy(desc(postsTable.created_at))
      .limit(limit)
      .offset(offset);

    // Determine user's subscription tier per creator
    const activeSubscriptions = await db
      .select({
        creator_id: subscriptionsTable.creator_id,
        tier: subscriptionsTable.tier,
      })
      .from(subscriptionsTable)
      .where(
        and(
          eq(subscriptionsTable.subscriber_id, user.id),
          eq(subscriptionsTable.status, "active"),
          inArray(subscriptionsTable.creator_id, creatorIds),
        ),
      );

    const tierByCreator = new Map<string, number>();
    for (const sub of activeSubscriptions) {
      tierByCreator.set(sub.creator_id, TIER_HIERARCHY[sub.tier] ?? 0);
    }

    // Look up PPV purchases for the current user
    const ppvPostIds = results
      .filter((r) => r.post_ppv_price_usdc !== null)
      .map((r) => r.post_id);

    const purchasedPostIds = new Set<number>();
    if (ppvPostIds.length > 0) {
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

    const data = results.map((row) => {
      const postData: Record<string, unknown> = {
        id: row.post_id,
        title: row.post_title,
        body: row.post_body,
        media_urls: row.post_media_urls,
        media_type: row.post_media_type,
        is_free: row.post_is_free,
        tier: row.post_tier,
        ppv_price_usdc: row.post_ppv_price_usdc,
        likes_count: row.post_likes_count,
        comments_count: row.post_comments_count,
        views_count: row.post_views_count,
        created_at: row.post_created_at,
      };

      const creator = {
        id: row.creator_id,
        username: row.creator_username,
        display_name: row.creator_display_name,
        avatar_url: row.creator_avatar_url,
        is_verified: row.creator_is_verified,
      };

      // Check access: free posts, subscription tier, or PPV purchase
      const postTierLevel = TIER_HIERARCHY[row.post_tier] ?? 0;
      const userTierLevel = tierByCreator.get(row.post_creator_id) ?? 0;
      const isPpv = row.post_ppv_price_usdc !== null;
      const hasPurchased = purchasedPostIds.has(row.post_id);

      const hasSubscriptionAccess =
        row.post_is_free || row.post_tier === "free" || userTierLevel >= postTierLevel;
      const hasAccess = hasSubscriptionAccess || (isPpv && hasPurchased);

      if (hasAccess) {
        return {
          post: { ...postData, is_locked: false, is_ppv: isPpv, has_purchased: hasPurchased },
          creator,
        };
      }

      return {
        post: redactPaidPost({ ...postData, has_purchased: hasPurchased }),
        creator,
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/feed/following error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
