export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { commentsTable, postsTable, usersTable } from "@/utils/db/schema";
import { eq, sql } from "drizzle-orm";
import { getAuthenticatedUser } from "@/utils/api/auth";

/**
 * DELETE /api/posts/[id]/comments/[commentId]
 * Delete a comment. Only the comment author or an admin can delete.
 * Decrements posts.comments_count atomically.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } },
) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const postId = parseInt(params.id, 10);
    const commentId = parseInt(params.commentId, 10);

    if (isNaN(postId) || isNaN(commentId)) {
      return NextResponse.json(
        { error: "Invalid post or comment ID", code: "INVALID_ID" },
        { status: 400 },
      );
    }

    // Fetch the comment
    const commentResults = await db
      .select({
        id: commentsTable.id,
        user_id: commentsTable.user_id,
        post_id: commentsTable.post_id,
      })
      .from(commentsTable)
      .where(eq(commentsTable.id, commentId))
      .limit(1);

    if (commentResults.length === 0) {
      return NextResponse.json(
        { error: "Comment not found", code: "COMMENT_NOT_FOUND" },
        { status: 404 },
      );
    }

    const comment = commentResults[0];

    // Verify the comment belongs to this post
    if (comment.post_id !== postId) {
      return NextResponse.json(
        { error: "Comment not found on this post", code: "COMMENT_NOT_FOUND" },
        { status: 404 },
      );
    }

    // Check authorization: must be comment author or admin
    if (comment.user_id !== user.id) {
      const dbUser = await db
        .select({ role: usersTable.role })
        .from(usersTable)
        .where(eq(usersTable.id, user.id))
        .limit(1);

      if (dbUser.length === 0 || dbUser[0].role !== "admin") {
        return NextResponse.json(
          { error: "You can only delete your own comments", code: "FORBIDDEN" },
          { status: 403 },
        );
      }
    }

    // Delete the comment
    await db.delete(commentsTable).where(eq(commentsTable.id, commentId));

    // Atomically decrement comments_count (floor at 0)
    await db
      .update(postsTable)
      .set({ comments_count: sql`GREATEST(${postsTable.comments_count} - 1, 0)` })
      .where(eq(postsTable.id, postId));

    return NextResponse.json(
      { data: { deleted: true, id: commentId } },
      { status: 200 },
    );
  } catch (error) {
    console.error("DELETE /api/posts/[id]/comments/[commentId] error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
