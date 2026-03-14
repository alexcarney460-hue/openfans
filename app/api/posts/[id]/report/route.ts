export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { contentReportsTable, postsTable } from "@/utils/db/schema";
import { eq, and, sql, gte } from "drizzle-orm";
import { getAuthenticatedUser } from "@/utils/api/auth";

const VALID_REASONS = ["spam", "illegal", "underage", "harassment", "copyright", "other"] as const;
type ReportReason = (typeof VALID_REASONS)[number];

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_HOURS = 1;

/**
 * POST /api/posts/[id]/report
 * Submit a content report. Auth required.
 *
 * Body:
 *   - reason: one of the valid reason enums (required)
 *   - description: string (optional, additional context)
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

    // Verify the post exists
    const postResults = await db
      .select({ id: postsTable.id, creator_id: postsTable.creator_id })
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

    // Cannot report your own post
    if (post.creator_id === user.id) {
      return NextResponse.json(
        { error: "You cannot report your own post", code: "SELF_REPORT" },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body", code: "INVALID_BODY" },
        { status: 400 },
      );
    }

    const { reason, description } = body;

    // Validate reason
    if (!reason || !VALID_REASONS.includes(reason as ReportReason)) {
      return NextResponse.json(
        {
          error: `reason must be one of: ${VALID_REASONS.join(", ")}`,
          code: "INVALID_REASON",
        },
        { status: 400 },
      );
    }

    // Validate description length if provided
    if (description !== undefined && description !== null) {
      if (typeof description !== "string" || description.length > 2000) {
        return NextResponse.json(
          { error: "Description must be a string under 2000 characters", code: "INVALID_DESCRIPTION" },
          { status: 400 },
        );
      }
    }

    // Check for duplicate report from same user on same post
    const existingReport = await db
      .select({ id: contentReportsTable.id })
      .from(contentReportsTable)
      .where(
        and(
          eq(contentReportsTable.reporter_id, user.id),
          eq(contentReportsTable.post_id, postId),
        ),
      )
      .limit(1);

    if (existingReport.length > 0) {
      return NextResponse.json(
        { error: "You have already reported this post", code: "DUPLICATE_REPORT" },
        { status: 409 },
      );
    }

    // Rate limit: max 5 reports per hour
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000);
    const recentReports = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(contentReportsTable)
      .where(
        and(
          eq(contentReportsTable.reporter_id, user.id),
          gte(contentReportsTable.created_at, windowStart),
        ),
      );

    if ((recentReports[0]?.count ?? 0) >= RATE_LIMIT_MAX) {
      return NextResponse.json(
        { error: "Rate limit exceeded. You can submit up to 5 reports per hour.", code: "RATE_LIMITED" },
        { status: 429 },
      );
    }

    // Create the report
    const newReport = await db
      .insert(contentReportsTable)
      .values({
        reporter_id: user.id,
        post_id: postId,
        reported_user_id: post.creator_id,
        reason: reason as ReportReason,
        description: description?.trim() || null,
        status: "pending",
      })
      .returning();

    return NextResponse.json({ data: newReport[0] }, { status: 201 });
  } catch (error) {
    console.error("POST /api/posts/[id]/report error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
