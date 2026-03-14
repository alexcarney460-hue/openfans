export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { contentReportsTable, postsTable } from "@/utils/db/schema";
import { eq, sql } from "drizzle-orm";
import { getAuthenticatedAdmin } from "@/utils/api/auth";

const VALID_STATUSES = ["pending", "reviewed", "action_taken", "dismissed"] as const;
const VALID_ACTIONS = ["dismiss", "hide_post", "remove_post", "warn"] as const;

type ReportStatus = (typeof VALID_STATUSES)[number];
type ModerationAction = (typeof VALID_ACTIONS)[number];

/**
 * GET /api/admin/moderation
 * List content reports with optional status filter.
 *
 * Query params:
 *   - status: filter by report status (default: "pending")
 *   - page: page number (default: 1)
 *   - limit: results per page (default: 20, max: 100)
 */
export async function GET(request: NextRequest) {
  try {
    const { error: authError } = await getAuthenticatedAdmin();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const statusFilter = (searchParams.get("status") || "pending") as ReportStatus;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));
    const offset = (page - 1) * limit;

    if (!VALID_STATUSES.includes(statusFilter)) {
      return NextResponse.json(
        { error: "Invalid status filter", code: "INVALID_STATUS" },
        { status: 400 },
      );
    }

    // Use raw SQL for the two user joins (reporter + reported)
    const results: Record<string, unknown>[] = await db.execute(sql`
      SELECT
        cr.id,
        cr.reporter_id,
        cr.post_id,
        cr.reported_user_id,
        cr.reason,
        cr.description,
        cr.status,
        cr.admin_notes,
        cr.created_at,
        cr.resolved_at,
        reporter.username AS reporter_username,
        reporter.display_name AS reporter_display_name,
        reported.username AS reported_username,
        reported.display_name AS reported_display_name,
        p.title AS post_title,
        p.body AS post_body,
        p.media_type AS post_media_type,
        p.media_urls AS post_media_urls,
        p.is_hidden AS post_is_hidden
      FROM content_reports cr
      LEFT JOIN users_table reporter ON cr.reporter_id = reporter.id
      LEFT JOIN users_table reported ON cr.reported_user_id = reported.id
      LEFT JOIN posts p ON cr.post_id = p.id
      WHERE cr.status = ${statusFilter}
      ORDER BY cr.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `) as unknown as Record<string, unknown>[];

    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(contentReportsTable)
      .where(eq(contentReportsTable.status, statusFilter));

    const total = countResult[0]?.count ?? 0;

    return NextResponse.json({
      data: results,
      meta: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("GET /api/admin/moderation error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/moderation
 * Take action on a content report.
 *
 * Body:
 *   - report_id: number (required)
 *   - action: "dismiss" | "hide_post" | "remove_post" | "warn" (required)
 *   - notes: string (optional admin notes)
 */
export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await getAuthenticatedAdmin();
    if (authError) return authError;

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body", code: "INVALID_BODY" },
        { status: 400 },
      );
    }

    const { report_id, action, notes } = body;

    if (!report_id || typeof report_id !== "number") {
      return NextResponse.json(
        { error: "report_id is required and must be a number", code: "MISSING_REPORT_ID" },
        { status: 400 },
      );
    }

    if (!action || !VALID_ACTIONS.includes(action as ModerationAction)) {
      return NextResponse.json(
        { error: `action must be one of: ${VALID_ACTIONS.join(", ")}`, code: "INVALID_ACTION" },
        { status: 400 },
      );
    }

    // Fetch the report
    const reportResults = await db
      .select()
      .from(contentReportsTable)
      .where(eq(contentReportsTable.id, report_id))
      .limit(1);

    if (reportResults.length === 0) {
      return NextResponse.json(
        { error: "Report not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    const report = reportResults[0];
    const now = new Date();

    switch (action as ModerationAction) {
      case "dismiss": {
        await db
          .update(contentReportsTable)
          .set({
            status: "dismissed" as const,
            admin_notes: notes?.trim() || null,
            resolved_at: now,
          })
          .where(eq(contentReportsTable.id, report_id));
        break;
      }

      case "hide_post": {
        if (report.post_id) {
          await db
            .update(postsTable)
            .set({ is_hidden: true })
            .where(eq(postsTable.id, report.post_id));
        }
        await db
          .update(contentReportsTable)
          .set({
            status: "action_taken" as const,
            admin_notes: notes?.trim() || "Post hidden by admin",
            resolved_at: now,
          })
          .where(eq(contentReportsTable.id, report_id));
        break;
      }

      case "remove_post": {
        if (report.post_id) {
          await db
            .delete(postsTable)
            .where(eq(postsTable.id, report.post_id));
        }
        await db
          .update(contentReportsTable)
          .set({
            status: "action_taken" as const,
            admin_notes: notes?.trim() || "Post removed by admin",
            resolved_at: now,
          })
          .where(eq(contentReportsTable.id, report_id));
        break;
      }

      case "warn": {
        await db
          .update(contentReportsTable)
          .set({
            status: "reviewed" as const,
            admin_notes: notes?.trim() || "Creator warned",
            resolved_at: now,
          })
          .where(eq(contentReportsTable.id, report_id));
        break;
      }
    }

    return NextResponse.json({
      data: {
        report_id,
        action,
        status: action === "dismiss" ? "dismissed" : action === "warn" ? "reviewed" : "action_taken",
      },
    });
  } catch (err) {
    console.error("POST /api/admin/moderation error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
