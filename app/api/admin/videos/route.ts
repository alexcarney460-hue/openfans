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
const VALID_STATUSES: readonly string[] = [
  "uploaded",
  "processing",
  "ready",
  "failed",
];

// ---------------------------------------------------------------------------
// GET /api/admin/videos
//
// List all video assets with pagination and optional status filter.
// Admin-only.
//
// Query params:
//   page    — 1-based page number (default 1)
//   limit   — items per page (default 25, max 100)
//   status  — filter by VideoAssetStatus
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    // 1. Auth — admin only
    const { error: authError } = await getAuthenticatedAdmin();
    if (authError) return authError;

    // 2. Parse query params
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE),
    );
    const statusFilter = searchParams.get("status");

    if (statusFilter && !VALID_STATUSES.includes(statusFilter)) {
      return NextResponse.json(
        {
          error: `Invalid status filter. Must be one of: ${VALID_STATUSES.join(", ")}`,
          code: "INVALID_STATUS",
        },
        { status: 400 },
      );
    }

    const offset = (page - 1) * limit;

    // 3. Build WHERE clause
    const whereClause = statusFilter
      ? sql`WHERE va.status = ${statusFilter}`
      : sql``;

    // 4. Count total matching records
    const countResult = await db.execute(sql`
      SELECT COUNT(*)::int AS total
      FROM video_assets va
      ${whereClause}
    `);

    const total = (countResult[0] as Record<string, unknown>).total as number;

    // 5. Fetch paginated results with creator username
    const rows = await db.execute(sql`
      SELECT
        va.id,
        va.creator_id,
        u.username AS creator_username,
        va.status,
        va.original_filename,
        va.file_size_bytes,
        va.mime_type,
        va.duration_seconds,
        va.width,
        va.height,
        va.thumbnail_url,
        va.created_at,
        va.updated_at
      FROM video_assets va
      LEFT JOIN users_table u ON u.id = va.creator_id
      ${whereClause}
      ORDER BY va.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `);

    return NextResponse.json({
      data: rows,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("GET /api/admin/videos error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
