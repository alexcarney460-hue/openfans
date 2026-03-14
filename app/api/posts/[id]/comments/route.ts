export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { commentsTable, postsTable, usersTable } from "@/utils/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getAuthenticatedUser } from "@/utils/api/auth";
import { checkRateLimit, getRateLimitKey } from "@/utils/rate-limit";

/**
 * GET /api/posts/[id]/comments
 * Get paginated comments for a post (public, no auth required).
 * Query params: limit (default 20, max 100), offset (default 0)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const postId = parseInt(params.id, 10);
    if (isNaN(postId)) {
      return NextResponse.json(
        { error: "Invalid post ID", code: "INVALID_POST_ID" },
        { status: 400 },
      );
    }

    const url = new URL(request.url);
    const limit = Math.min(
      Math.max(parseInt(url.searchParams.get("limit") ?? "20", 10) || 20, 1),
      100,
    );
    const offset = Math.max(
      parseInt(url.searchParams.get("offset") ?? "0", 10) || 0,
      0,
    );

    const comments = await db
      .select({
        id: commentsTable.id,
        body: commentsTable.body,
        created_at: commentsTable.created_at,
        user_id: commentsTable.user_id,
        username: usersTable.username,
        display_name: usersTable.display_name,
        avatar_url: usersTable.avatar_url,
      })
      .from(commentsTable)
      .innerJoin(usersTable, eq(commentsTable.user_id, usersTable.id))
      .where(eq(commentsTable.post_id, postId))
      .orderBy(desc(commentsTable.created_at))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ data: comments });
  } catch (error) {
    console.error("GET /api/posts/[id]/comments error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/posts/[id]/comments
 * Add a comment to a post (auth required).
 * Body: { body: string }
 * Rate limited: 10 comments per minute per user.
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

    // Rate limit: 10 comments per minute per user
    const identifier = getRateLimitKey(request, user.id);
    const rateLimitResponse = await checkRateLimit(
      request,
      identifier,
      "post-comment",
      10,
      60_000,
    );
    if (rateLimitResponse) return rateLimitResponse;

    // Parse and validate body
    let body: string;
    try {
      const json = await request.json();
      body = typeof json.body === "string" ? json.body.trim() : "";
    } catch {
      return NextResponse.json(
        { error: "Invalid request body", code: "INVALID_BODY" },
        { status: 400 },
      );
    }

    if (!body) {
      return NextResponse.json(
        { error: "Comment body is required", code: "BODY_REQUIRED" },
        { status: 400 },
      );
    }

    if (body.length > 1000) {
      return NextResponse.json(
        { error: "Comment must be 1000 characters or fewer", code: "BODY_TOO_LONG" },
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

    // Insert comment
    const inserted = await db
      .insert(commentsTable)
      .values({
        user_id: user.id,
        post_id: postId,
        body,
      })
      .returning();

    // Atomically increment comments_count
    await db
      .update(postsTable)
      .set({ comments_count: sql`${postsTable.comments_count} + 1` })
      .where(eq(postsTable.id, postId));

    // Fetch user info for the response
    const userInfo = await db
      .select({
        username: usersTable.username,
        display_name: usersTable.display_name,
        avatar_url: usersTable.avatar_url,
      })
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .limit(1);

    const comment = inserted[0];
    return NextResponse.json(
      {
        data: {
          id: comment.id,
          body: comment.body,
          created_at: comment.created_at,
          user_id: comment.user_id,
          username: userInfo[0]?.username ?? "",
          display_name: userInfo[0]?.display_name ?? "",
          avatar_url: userInfo[0]?.avatar_url ?? null,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/posts/[id]/comments error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
