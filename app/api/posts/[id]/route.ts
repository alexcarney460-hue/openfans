export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { postsTable, subscriptionsTable, usersTable } from "@/utils/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthenticatedUser } from "@/utils/api/auth";
import { createClient } from "@/utils/supabase/server";

const TIER_HIERARCHY: Record<string, string[]> = {
  free: ["free"],
  basic: ["free", "basic"],
  premium: ["free", "basic", "premium"],
  vip: ["free", "basic", "premium", "vip"],
};

/**
 * GET /api/posts/[id]
 * Get a single post. Checks subscription access for non-free content.
 * Unauthenticated users can only see free posts.
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

    // Fetch the post
    const postResults = await db
      .select()
      .from(postsTable)
      .where(eq(postsTable.id, postId))
      .limit(1);

    if (postResults.length === 0) {
      return NextResponse.json(
        { error: "Post not found", code: "POST_NOT_FOUND" },
        { status: 404 },
      );
    }

    const post = postResults[0];

    // For paid posts, check authentication and subscription
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // If the post is hidden, only the creator and admins can see it
    if (post.is_hidden) {
      const isOwner = user?.id === post.creator_id;
      let isAdmin = false;
      if (user && !isOwner) {
        const adminCheck = await db
          .select({ role: usersTable.role })
          .from(usersTable)
          .where(eq(usersTable.id, user.id))
          .limit(1);
        isAdmin = adminCheck.length > 0 && adminCheck[0].role === "admin";
      }
      if (!isOwner && !isAdmin) {
        return NextResponse.json(
          { error: "Post not found", code: "POST_NOT_FOUND" },
          { status: 404 },
        );
      }
    }

    // Free posts are always accessible
    if (post.is_free || post.tier === "free") {
      return NextResponse.json({ data: post });
    }

    if (!user) {
      // Return post metadata without body/media for unauthenticated users
      return NextResponse.json({
        data: {
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
          body: null,
          media_urls: [],
          is_locked: true,
        },
      });
    }

    // Creator can always see their own posts
    if (user.id === post.creator_id) {
      return NextResponse.json({ data: post });
    }

    // Check active subscription
    const subscriptionResults = await db
      .select()
      .from(subscriptionsTable)
      .where(
        and(
          eq(subscriptionsTable.subscriber_id, user.id),
          eq(subscriptionsTable.creator_id, post.creator_id),
          eq(subscriptionsTable.status, "active"),
        ),
      )
      .limit(1);

    if (subscriptionResults.length === 0) {
      return NextResponse.json({
        data: {
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
          body: null,
          media_urls: [],
          is_locked: true,
        },
      });
    }

    const subscription = subscriptionResults[0];
    const allowedTiers = TIER_HIERARCHY[subscription.tier] ?? ["free"];

    if (!allowedTiers.includes(post.tier)) {
      return NextResponse.json({
        data: {
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
          body: null,
          media_urls: [],
          is_locked: true,
          required_tier: post.tier,
          current_tier: subscription.tier,
        },
      });
    }

    return NextResponse.json({ data: post });
  } catch (error) {
    console.error("GET /api/posts/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/posts/[id]
 * Delete a post. Only the creator who owns the post can delete it.
 */
export async function DELETE(
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

    // Fetch the post to verify ownership
    const postResults = await db
      .select()
      .from(postsTable)
      .where(eq(postsTable.id, postId))
      .limit(1);

    if (postResults.length === 0) {
      return NextResponse.json(
        { error: "Post not found", code: "POST_NOT_FOUND" },
        { status: 404 },
      );
    }

    if (postResults[0].creator_id !== user.id) {
      return NextResponse.json(
        { error: "You can only delete your own posts", code: "FORBIDDEN" },
        { status: 403 },
      );
    }

    await db.delete(postsTable).where(eq(postsTable.id, postId));

    return NextResponse.json(
      { data: { deleted: true, id: postId } },
      { status: 200 },
    );
  } catch (error) {
    console.error("DELETE /api/posts/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
