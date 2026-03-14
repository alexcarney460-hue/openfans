export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { bookmarksTable, postsTable, usersTable } from "@/utils/db/schema";
import { eq, desc } from "drizzle-orm";
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
        creator_id: usersTable.id,
        creator_username: usersTable.username,
        creator_display_name: usersTable.display_name,
        creator_avatar_url: usersTable.avatar_url,
        creator_is_verified: usersTable.is_verified,
      })
      .from(bookmarksTable)
      .innerJoin(postsTable, eq(bookmarksTable.post_id, postsTable.id))
      .innerJoin(usersTable, eq(postsTable.creator_id, usersTable.id))
      .where(eq(bookmarksTable.user_id, user.id))
      .orderBy(desc(bookmarksTable.created_at))
      .limit(limit)
      .offset(offset);

    const data = results.map((row) => ({
      bookmark_id: row.bookmark_id,
      bookmarked_at: row.bookmarked_at,
      post: {
        id: row.post_id,
        title: row.post_title,
        body: row.post_body,
        media_urls: row.post_media_urls,
        media_type: row.post_media_type,
        is_free: row.post_is_free,
        tier: row.post_tier,
        likes_count: row.post_likes_count,
        comments_count: row.post_comments_count,
        views_count: row.post_views_count,
        created_at: row.post_created_at,
      },
      creator: {
        id: row.creator_id,
        username: row.creator_username,
        display_name: row.creator_display_name,
        avatar_url: row.creator_avatar_url,
        is_verified: row.creator_is_verified,
      },
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/bookmarks error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
