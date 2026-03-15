export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { sql } from "drizzle-orm";
import { getAuthenticatedAdmin } from "@/utils/api/auth";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

// ---------------------------------------------------------------------------
// GET /api/admin/stories
//
// List all active stories with creator info, view counts, and report counts.
// Paginated, filterable by creator username.
//
// Query params:
//   page     — 1-based page number (default 1)
//   limit    — items per page (default 25, max 100)
//   creator  — filter by creator username (partial match)
//   status   — "active" | "expired" | "all" (default "active")
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const { error: authError } = await getAuthenticatedAdmin();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE),
    );
    const creatorFilter = searchParams.get("creator")?.trim() || null;
    const statusFilter = searchParams.get("status") ?? "active";

    if (!["active", "expired", "all"].includes(statusFilter)) {
      return NextResponse.json(
        { error: "Invalid status filter. Must be one of: active, expired, all", code: "INVALID_STATUS" },
        { status: 400 },
      );
    }

    const offset = (page - 1) * limit;
    const now = new Date().toISOString();

    // Build dynamic WHERE conditions
    const conditions: ReturnType<typeof sql>[] = [];

    if (statusFilter === "active") {
      conditions.push(sql`s.expires_at > ${now}`);
    } else if (statusFilter === "expired") {
      conditions.push(sql`s.expires_at <= ${now}`);
    }

    if (creatorFilter) {
      conditions.push(sql`u.username ILIKE ${"%" + creatorFilter + "%"}`);
    }

    const whereClause = conditions.length > 0
      ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
      : sql``;

    // Count total matching records
    const countResult = await db.execute(sql`
      SELECT COUNT(*)::int AS total
      FROM stories s
      JOIN users_table u ON u.id = s.creator_id
      ${whereClause}
    `);

    const total = (countResult[0] as Record<string, unknown>).total as number;

    // Fetch paginated stories with creator info and report counts
    const rows = await db.execute(sql`
      SELECT
        s.id,
        s.creator_id,
        s.media_url,
        s.media_type,
        s.caption,
        s.expires_at,
        s.views_count,
        s.created_at,
        u.username AS creator_username,
        u.display_name AS creator_display_name,
        u.avatar_url AS creator_avatar_url,
        COALESCE(sr.report_count, 0)::int AS report_count
      FROM stories s
      JOIN users_table u ON u.id = s.creator_id
      LEFT JOIN (
        SELECT story_id, COUNT(*)::int AS report_count
        FROM story_reports
        GROUP BY story_id
      ) sr ON sr.story_id = s.id
      ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `);

    // Fetch summary stats
    const summaryResult = await db.execute(sql`
      SELECT
        COUNT(*) FILTER (WHERE s.expires_at > ${now})::int AS active_count,
        COALESCE(SUM(s.views_count) FILTER (
          WHERE s.created_at >= (NOW() - INTERVAL '24 hours')
        ), 0)::int AS views_today,
        COUNT(DISTINCT sr.story_id) FILTER (WHERE sr.id IS NOT NULL)::int AS reported_count
      FROM stories s
      LEFT JOIN story_reports sr ON sr.story_id = s.id
    `);

    const summary = summaryResult[0] as Record<string, unknown>;

    return NextResponse.json({
      data: rows,
      summary: {
        active_stories: summary.active_count ?? 0,
        views_today: summary.views_today ?? 0,
        reported_stories: summary.reported_count ?? 0,
      },
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("GET /api/admin/stories error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/stories
//
// Admin-delete a story with a recorded reason.
//
// Body:
//   story_id  — UUID of the story to delete (required)
//   reason    — reason for removal (required, max 500 chars)
// ---------------------------------------------------------------------------

export async function DELETE(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedAdmin();
    if (authError) return authError;

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body", code: "INVALID_BODY" },
        { status: 400 },
      );
    }

    const { story_id, reason } = body;

    // Validate story_id
    if (!story_id || typeof story_id !== "string") {
      return NextResponse.json(
        { error: "story_id is required and must be a string", code: "MISSING_STORY_ID" },
        { status: 400 },
      );
    }

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(story_id)) {
      return NextResponse.json(
        { error: "Invalid story_id format", code: "INVALID_STORY_ID" },
        { status: 400 },
      );
    }

    // Validate reason
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

    // Fetch the story to confirm it exists
    const storyRows = await db.execute(sql`
      SELECT id, creator_id, media_url, caption
      FROM stories
      WHERE id = ${story_id}
      LIMIT 1
    `);

    if (storyRows.length === 0) {
      return NextResponse.json(
        { error: "Story not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    const story = storyRows[0] as Record<string, unknown>;
    const creatorId = story.creator_id as string;

    // Log the admin removal action before deleting
    await db.execute(sql`
      INSERT INTO story_admin_removals (story_id, creator_id, admin_id, reason, media_url, caption, removed_at)
      VALUES (
        ${story_id},
        ${creatorId},
        ${user.id},
        ${reason.trim()},
        ${story.media_url as string},
        ${(story.caption as string | null) ?? null},
        NOW()
      )
      ON CONFLICT DO NOTHING
    `).catch((logErr) => {
      // If the audit table doesn't exist yet, log and continue.
      // The deletion itself is more important than the audit log.
      console.warn("Failed to log admin story removal (audit table may not exist):", logErr);
    });

    // Delete associated views
    await db.execute(sql`
      DELETE FROM story_views WHERE story_id = ${story_id}
    `);

    // Delete associated reports
    await db.execute(sql`
      DELETE FROM story_reports WHERE story_id = ${story_id}
    `).catch(() => {
      // story_reports table might not exist yet
    });

    // Delete the story
    await db.execute(sql`
      DELETE FROM stories WHERE id = ${story_id}
    `);

    // Send notification to the creator about removal
    await db.execute(sql`
      INSERT INTO notifications (user_id, type, title, body, reference_id)
      VALUES (
        ${creatorId},
        'new_message',
        ${"Story removed by admin"},
        ${`Your story was removed. Reason: ${reason.trim()}`},
        ${story_id}
      )
    `).catch((notifErr) => {
      console.warn("Failed to notify creator about story removal:", notifErr);
    });

    return NextResponse.json({
      data: {
        story_id,
        action: "deleted",
        reason: reason.trim(),
      },
    });
  } catch (err) {
    console.error("DELETE /api/admin/stories error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
