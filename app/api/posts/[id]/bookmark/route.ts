export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { bookmarksTable, postsTable } from "@/utils/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthenticatedUser } from "@/utils/api/auth";

/**
 * POST /api/posts/[id]/bookmark
 * Toggle bookmark: add if not bookmarked, remove if already bookmarked.
 * Returns { bookmarked: boolean }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const postId = parseInt(params.id, 10);
    if (isNaN(postId)) {
      return NextResponse.json(
        { error: "Invalid post ID", code: "INVALID_POST_ID" },
        { status: 400 },
      );
    }

    // Check if post exists
    const postResults = await db
      .select({ id: postsTable.id })
      .from(postsTable)
      .where(eq(postsTable.id, postId))
      .limit(1);

    if (postResults.length === 0) {
      return NextResponse.json(
        { error: "Post not found", code: "POST_NOT_FOUND" },
        { status: 404 },
      );
    }

    // Check if user already bookmarked
    const existing = await db
      .select({ id: bookmarksTable.id })
      .from(bookmarksTable)
      .where(
        and(
          eq(bookmarksTable.user_id, user.id),
          eq(bookmarksTable.post_id, postId),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      // Remove bookmark
      await db
        .delete(bookmarksTable)
        .where(eq(bookmarksTable.id, existing[0].id));

      return NextResponse.json({ bookmarked: false });
    }

    // Add bookmark
    await db.insert(bookmarksTable).values({
      user_id: user.id,
      post_id: postId,
    });

    return NextResponse.json({ bookmarked: true });
  } catch (error) {
    console.error("POST /api/posts/[id]/bookmark error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/posts/[id]/bookmark
 * Check if the current user has bookmarked this post.
 * Returns { bookmarked: boolean }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) {
      return NextResponse.json({ bookmarked: false });
    }

    const postId = parseInt(params.id, 10);
    if (isNaN(postId)) {
      return NextResponse.json(
        { error: "Invalid post ID", code: "INVALID_POST_ID" },
        { status: 400 },
      );
    }

    const existing = await db
      .select({ id: bookmarksTable.id })
      .from(bookmarksTable)
      .where(
        and(
          eq(bookmarksTable.user_id, user.id),
          eq(bookmarksTable.post_id, postId),
        ),
      )
      .limit(1);

    return NextResponse.json({ bookmarked: existing.length > 0 });
  } catch (error) {
    console.error("GET /api/posts/[id]/bookmark error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
