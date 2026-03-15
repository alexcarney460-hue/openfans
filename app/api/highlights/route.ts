export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/utils/api/auth";
import { db } from "@/utils/db/db";
import { sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface HighlightRow {
  readonly id: string;
  readonly creator_id: string;
  readonly name: string;
  readonly cover_url: string | null;
  readonly position: number;
  readonly created_at: string;
  readonly updated_at: string;
  readonly story_count: number;
  readonly first_media_url: string | null;
}

// ---------------------------------------------------------------------------
// GET /api/highlights
//
// Public: pass ?creator_id=<uuid> to fetch any creator's highlights.
// Authenticated without creator_id: returns the caller's own highlights.
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get("creator_id");

    let targetCreatorId: string;

    if (creatorId) {
      if (!UUID_RE.test(creatorId)) {
        return NextResponse.json(
          { error: "Invalid creator_id format", code: "INVALID_ID" },
          { status: 400 },
        );
      }
      targetCreatorId = creatorId;
    } else {
      // Fall back to authenticated user
      const { user, error } = await getAuthenticatedUser();
      if (error) return error;
      targetCreatorId = user.id;
    }

    const rows = await db.execute(sql`
      SELECT
        h.id,
        h.creator_id,
        h.name,
        h.cover_url,
        h.position,
        h.created_at,
        h.updated_at,
        COALESCE(item_counts.cnt, 0)::int AS story_count,
        first_items.media_url AS first_media_url
      FROM story_highlights h
      LEFT JOIN (
        SELECT highlight_id, COUNT(*)::int AS cnt
        FROM story_highlight_items
        GROUP BY highlight_id
      ) item_counts ON item_counts.highlight_id = h.id
      LEFT JOIN LATERAL (
        SELECT s.media_url
        FROM story_highlight_items shi
        JOIN stories s ON s.id = shi.story_id
        WHERE shi.highlight_id = h.id
        ORDER BY shi.position ASC, shi.added_at ASC
        LIMIT 1
      ) first_items ON true
      WHERE h.creator_id = ${targetCreatorId}
      ORDER BY h.position ASC, h.created_at ASC
    `);

    const highlights: HighlightRow[] = rows.map((r) => ({
      id: r.id as string,
      creator_id: r.creator_id as string,
      name: r.name as string,
      cover_url: r.cover_url as string | null,
      position: r.position as number,
      created_at: String(r.created_at),
      updated_at: String(r.updated_at),
      story_count: Number(r.story_count),
      first_media_url: r.first_media_url as string | null,
    }));

    return NextResponse.json({ data: highlights });
  } catch (err) {
    console.error("GET /api/highlights error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/highlights
//
// Create a new highlight collection. Auth required, creator only.
// Body: { name: string (required, max 50), cover_url?: string }
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    // Verify user is a creator
    const userRows = await db.execute(sql`
      SELECT role FROM users_table WHERE id = ${user.id} LIMIT 1
    `);

    if (userRows.length === 0 || userRows[0].role !== "creator") {
      return NextResponse.json(
        { error: "Only creators can create highlights", code: "CREATOR_REQUIRED" },
        { status: 403 },
      );
    }

    // Parse body
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body", code: "INVALID_BODY" },
        { status: 400 },
      );
    }

    const { name, cover_url } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "name is required", code: "MISSING_NAME" },
        { status: 400 },
      );
    }

    const trimmedName = name.trim();
    if (trimmedName.length > 50) {
      return NextResponse.json(
        { error: "name must be 50 characters or less", code: "NAME_TOO_LONG" },
        { status: 400 },
      );
    }

    if (cover_url !== undefined && cover_url !== null && typeof cover_url !== "string") {
      return NextResponse.json(
        { error: "cover_url must be a string", code: "INVALID_COVER_URL" },
        { status: 400 },
      );
    }

    // Determine next position
    const posRows = await db.execute(sql`
      SELECT COALESCE(MAX(position), -1)::int + 1 AS next_pos
      FROM story_highlights
      WHERE creator_id = ${user.id}
    `);
    const nextPos = Number(posRows[0]?.next_pos ?? 0);

    const now = new Date().toISOString();

    const result = await db.execute(sql`
      INSERT INTO story_highlights (creator_id, name, cover_url, position, created_at, updated_at)
      VALUES (
        ${user.id},
        ${trimmedName},
        ${cover_url ?? null},
        ${nextPos},
        ${now},
        ${now}
      )
      RETURNING id, creator_id, name, cover_url, position, created_at, updated_at
    `);

    return NextResponse.json(
      { data: { ...result[0], story_count: 0, first_media_url: null } },
      { status: 201 },
    );
  } catch (err) {
    console.error("POST /api/highlights error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
