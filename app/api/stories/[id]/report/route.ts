export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { sql } from "drizzle-orm";
import { getAuthenticatedUser } from "@/utils/api/auth";

// ---------------------------------------------------------------------------
// POST /api/stories/[id]/report
//
// Allow any authenticated user to report a story.
//
// Body:
//   reason — required, max 500 characters
//
// Constraints:
//   - Cannot report own story
//   - Max 10 reports per hour per user (rate limit)
//   - Cannot report same story twice
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const storyId = params.id;

    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storyId)) {
      return NextResponse.json(
        { error: "Invalid story ID", code: "INVALID_ID" },
        { status: 400 },
      );
    }

    // Parse and validate body
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body", code: "INVALID_BODY" },
        { status: 400 },
      );
    }

    const { reason } = body;

    if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
      return NextResponse.json(
        { error: "reason is required", code: "MISSING_REASON" },
        { status: 400 },
      );
    }

    if (reason.length > 500) {
      return NextResponse.json(
        { error: "reason must be 500 characters or less", code: "REASON_TOO_LONG" },
        { status: 400 },
      );
    }

    // Fetch the story to verify it exists and check ownership
    const storyRows = await db.execute(sql`
      SELECT id, creator_id
      FROM stories
      WHERE id = ${storyId}
      LIMIT 1
    `);

    if (storyRows.length === 0) {
      return NextResponse.json(
        { error: "Story not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    const story = storyRows[0] as Record<string, unknown>;

    // Cannot report own story
    if (story.creator_id === user.id) {
      return NextResponse.json(
        { error: "You cannot report your own story", code: "SELF_REPORT" },
        { status: 400 },
      );
    }

    // Rate limit: max 10 reports per hour per user
    const rateLimitResult = await db.execute(sql`
      SELECT COUNT(*)::int AS report_count
      FROM story_reports
      WHERE reporter_id = ${user.id}
        AND created_at >= NOW() - INTERVAL '1 hour'
    `);

    const recentReportCount = (rateLimitResult[0] as Record<string, unknown>).report_count as number;

    if (recentReportCount >= 10) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Maximum 10 reports per hour.", code: "RATE_LIMITED" },
        { status: 429 },
      );
    }

    // Check for duplicate report
    const existingReport = await db.execute(sql`
      SELECT id FROM story_reports
      WHERE story_id = ${storyId} AND reporter_id = ${user.id}
      LIMIT 1
    `);

    if (existingReport.length > 0) {
      return NextResponse.json(
        { error: "You have already reported this story", code: "DUPLICATE_REPORT" },
        { status: 409 },
      );
    }

    // Insert the report
    const insertResult = await db.execute(sql`
      INSERT INTO story_reports (story_id, reporter_id, reason, created_at)
      VALUES (${storyId}, ${user.id}, ${reason.trim()}, NOW())
      RETURNING id, story_id, reporter_id, reason, created_at
    `);

    return NextResponse.json(
      { data: insertResult[0] },
      { status: 201 },
    );
  } catch (err) {
    console.error("POST /api/stories/[id]/report error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
