export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { likesTable, postsTable } from "@/utils/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getAuthenticatedUser } from "@/utils/api/auth";

/**
 * POST /api/posts/[id]/like
 * Toggle like: like if not yet liked, unlike if already liked.
 * Returns { liked: boolean, likes_count: number }
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

    // Check if user already liked
    const existingLike = await db
      .select({ id: likesTable.id })
      .from(likesTable)
      .where(
        and(
          eq(likesTable.user_id, user.id),
          eq(likesTable.post_id, postId),
        ),
      )
      .limit(1);

    if (existingLike.length > 0) {
      // Unlike: delete the like and decrement count atomically in a transaction
      const updated = await db.transaction(async (tx) => {
        await tx
          .delete(likesTable)
          .where(eq(likesTable.id, existingLike[0].id));

        return tx
          .update(postsTable)
          .set({ likes_count: sql`GREATEST(${postsTable.likes_count} - 1, 0)` })
          .where(eq(postsTable.id, postId))
          .returning({ likes_count: postsTable.likes_count });
      });

      return NextResponse.json({
        liked: false,
        likes_count: updated[0]?.likes_count ?? 0,
      });
    }

    // Like: insert the like and increment count atomically in a transaction
    const updated = await db.transaction(async (tx) => {
      await tx.insert(likesTable).values({
        user_id: user.id,
        post_id: postId,
      });

      return tx
        .update(postsTable)
        .set({ likes_count: sql`${postsTable.likes_count} + 1` })
        .where(eq(postsTable.id, postId))
        .returning({ likes_count: postsTable.likes_count });
    });

    return NextResponse.json({
      liked: true,
      likes_count: updated[0]?.likes_count ?? 0,
    });
  } catch (error) {
    console.error("POST /api/posts/[id]/like error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/posts/[id]/like
 * Check if the current user has liked this post.
 * Returns { liked: boolean }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) {
      return NextResponse.json({ liked: false });
    }

    const postId = parseInt(params.id, 10);
    if (isNaN(postId)) {
      return NextResponse.json(
        { error: "Invalid post ID", code: "INVALID_POST_ID" },
        { status: 400 },
      );
    }

    const existingLike = await db
      .select({ id: likesTable.id })
      .from(likesTable)
      .where(
        and(
          eq(likesTable.user_id, user.id),
          eq(likesTable.post_id, postId),
        ),
      )
      .limit(1);

    return NextResponse.json({ liked: existingLike.length > 0 });
  } catch (error) {
    console.error("GET /api/posts/[id]/like error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
