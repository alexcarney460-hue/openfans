export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { bookmarksTable, postsTable, usersTable, subscriptionsTable, ppvPurchasesTable } from "@/utils/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { getAuthenticatedUser } from "@/utils/api/auth";

/**
 * GET /api/bookmarks
 * List all bookmarked posts for the current user.
 * Returns { data: Array<{ bookmark_id, bookmarked_at, post, creator }> }
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);

    const results = await db
      .select({
        bookmark_id: bookmarksTable.id,
        bookmarked_at: bookmarksTable.created_at,
        post_id: postsTable.id,
        post_title: postsTable.title,
        post_body: postsTable.body,
        post_media_urls: postsTable.media_urls,
        post_media_type: postsTable.media_type,
        post_is_free: postsTable.is_free,
        post_tier: postsTable.tier,
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
        sub_id: subscriptionsTable.id,
        ppv_id: ppvPurchasesTable.id,
      })
      .from(bookmarksTable)
      .innerJoin(postsTable, eq(bookmarksTable.post_id, postsTable.id))
      .innerJoin(usersTable, eq(postsTable.creator_id, usersTable.id))
      .leftJoin(
        subscriptionsTable,
        and(
          eq(subscriptionsTable.subscriber_id, user.id),
          eq(subscriptionsTable.creator_id, postsTable.creator_id),
          eq(subscriptionsTable.status, "active"),
        ),
      )
      .leftJoin(
        ppvPurchasesTable,
        and(
          eq(ppvPurchasesTable.post_id, postsTable.id),
          eq(ppvPurchasesTable.buyer_id, user.id),
        ),
      )
      .where(eq(bookmarksTable.user_id, user.id))
      .orderBy(desc(bookmarksTable.created_at))
      .limit(limit)
      .offset(offset);

    const data = results.map((row) => {
      const isPaid = !row.post_is_free && row.post_tier !== "free";
      const isOwnPost = row.post_creator_id === user.id;
      const hasSubscription = row.sub_id !== null;
      const hasPpvPurchase = row.ppv_id !== null;
      const hasAccess = !isPaid || isOwnPost || hasSubscription || hasPpvPurchase;

      return {
        bookmark_id: row.bookmark_id,
        bookmarked_at: row.bookmarked_at,
        post: {
          id: row.post_id,
          title: row.post_title,
          body: hasAccess ? row.post_body : null,
          media_urls: hasAccess ? row.post_media_urls : [],
          media_type: row.post_media_type,
          is_free: row.post_is_free,
          tier: row.post_tier,
          likes_count: row.post_likes_count,
          comments_count: row.post_comments_count,
          views_count: row.post_views_count,
          created_at: row.post_created_at,
          is_locked: !hasAccess,
        },
        creator: {
          id: row.creator_id,
          username: row.creator_username,
          display_name: row.creator_display_name,
          avatar_url: row.creator_avatar_url,
          is_verified: row.creator_is_verified,
        },
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/bookmarks error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
