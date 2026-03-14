export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { followsTable, usersTable } from "@/utils/db/schema";
import { eq, and, count } from "drizzle-orm";
import { getAuthenticatedUser } from "@/utils/api/auth";

/**
 * POST /api/users/[id]/follow
 * Toggle follow: follow if not following, unfollow if already following.
 * Cannot follow yourself.
 * Returns { following: boolean }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const targetUserId = params.id;

    if (!targetUserId || targetUserId.trim() === "") {
      return NextResponse.json(
        { error: "Invalid user ID", code: "INVALID_USER_ID" },
        { status: 400 },
      );
    }

    // Cannot follow yourself
    if (user.id === targetUserId) {
      return NextResponse.json(
        { error: "Cannot follow yourself", code: "SELF_FOLLOW" },
        { status: 400 },
      );
    }

    // Verify target user exists
    const targetUser = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.id, targetUserId))
      .limit(1);

    if (targetUser.length === 0) {
      return NextResponse.json(
        { error: "User not found", code: "USER_NOT_FOUND" },
        { status: 404 },
      );
    }

    // Check if already following
    const existing = await db
      .select({ id: followsTable.id })
      .from(followsTable)
      .where(
        and(
          eq(followsTable.follower_id, user.id),
          eq(followsTable.following_id, targetUserId),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      // Unfollow
      await db
        .delete(followsTable)
        .where(eq(followsTable.id, existing[0].id));

      return NextResponse.json({ following: false });
    }

    // Follow
    await db.insert(followsTable).values({
      follower_id: user.id,
      following_id: targetUserId,
    });

    return NextResponse.json({ following: true });
  } catch (error) {
    console.error("POST /api/users/[id]/follow error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/users/[id]/follow
 * Check if current user follows this user + get follower/following counts.
 * Returns { following: boolean, followers_count: number, following_count: number }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const targetUserId = params.id;

    if (!targetUserId || targetUserId.trim() === "") {
      return NextResponse.json(
        { error: "Invalid user ID", code: "INVALID_USER_ID" },
        { status: 400 },
      );
    }

    // Get follower count (people who follow this user)
    const followerResult = await db
      .select({ value: count() })
      .from(followsTable)
      .where(eq(followsTable.following_id, targetUserId));

    // Get following count (people this user follows)
    const followingResult = await db
      .select({ value: count() })
      .from(followsTable)
      .where(eq(followsTable.follower_id, targetUserId));

    const followersCount = followerResult[0]?.value ?? 0;
    const followingCount = followingResult[0]?.value ?? 0;

    // Check if current user is following
    let isFollowing = false;
    const { user } = await getAuthenticatedUser();
    if (user) {
      const existing = await db
        .select({ id: followsTable.id })
        .from(followsTable)
        .where(
          and(
            eq(followsTable.follower_id, user.id),
            eq(followsTable.following_id, targetUserId),
          ),
        )
        .limit(1);

      isFollowing = existing.length > 0;
    }

    return NextResponse.json({
      following: isFollowing,
      followers_count: followersCount,
      following_count: followingCount,
    });
  } catch (error) {
    console.error("GET /api/users/[id]/follow error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
