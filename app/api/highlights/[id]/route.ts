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

function validateId(id: string): NextResponse | null {
  if (!UUID_RE.test(id)) {
    return NextResponse.json(
      { error: "Invalid highlight ID", code: "INVALID_ID" },
      { status: 400 },
    );
  }
  return null;
}

// ---------------------------------------------------------------------------
// GET /api/highlights/[id]
//
// Return a single highlight with its stories. Public endpoint.
// ---------------------------------------------------------------------------
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const highlightId = params.id;
    const idError = validateId(highlightId);
    if (idError) return idError;

    // Fetch highlight metadata
    const highlightRows = await db.execute(sql`
      SELECT
        h.id,
        h.creator_id,
        h.name,
        h.cover_url,
        h.position,
        h.created_at,
        h.updated_at,
        u.username,
        u.display_name,
        u.avatar_url
      FROM story_highlights h
      JOIN users_table u ON u.id = h.creator_id
      WHERE h.id = ${highlightId}
      LIMIT 1
    `);

    if (highlightRows.length === 0) {
      return NextResponse.json(
        { error: "Highlight not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    const highlight = highlightRows[0];

    // Fetch stories in this highlight
    const storyRows = await db.execute(sql`
      SELECT
        s.id,
        s.media_url,
        s.media_type,
        s.caption,
        s.created_at,
        s.views_count,
        shi.position AS item_position,
        shi.added_at
      FROM story_highlight_items shi
      JOIN stories s ON s.id = shi.story_id
      WHERE shi.highlight_id = ${highlightId}
      ORDER BY shi.position ASC, shi.added_at ASC
    `);

    const stories = storyRows.map((r) => ({
      id: r.id as string,
      media_url: r.media_url as string,
      media_type: r.media_type as string,
      caption: r.caption as string | null,
      created_at: String(r.created_at),
      views_count: r.views_count as number,
      position: r.item_position as number,
      added_at: String(r.added_at),
    }));

    return NextResponse.json({
      data: {
        id: highlight.id,
        creator_id: highlight.creator_id,
        name: highlight.name,
        cover_url: highlight.cover_url,
        position: highlight.position,
        created_at: String(highlight.created_at),
        updated_at: String(highlight.updated_at),
        creator: {
          username: highlight.username,
          display_name: highlight.display_name,
          avatar_url: highlight.avatar_url,
        },
        stories,
      },
    });
  } catch (err) {
    console.error("GET /api/highlights/[id] error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/highlights/[id]
//
// Update name or cover_url. Creator only.
// Body: { name?: string, cover_url?: string | null }
// ---------------------------------------------------------------------------
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const highlightId = params.id;
    const idError = validateId(highlightId);
    if (idError) return idError;

    // Verify ownership
    const highlightRows = await db.execute(sql`
      SELECT id, creator_id FROM story_highlights
      WHERE id = ${highlightId}
      LIMIT 1
    `);

    if (highlightRows.length === 0) {
      return NextResponse.json(
        { error: "Highlight not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    if (highlightRows[0].creator_id !== user.id) {
      return NextResponse.json(
        { error: "You can only edit your own highlights", code: "FORBIDDEN" },
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

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json(
          { error: "name must be a non-empty string", code: "INVALID_NAME" },
          { status: 400 },
        );
      }
      if (name.trim().length > 50) {
        return NextResponse.json(
          { error: "name must be 50 characters or less", code: "NAME_TOO_LONG" },
          { status: 400 },
        );
      }
    }

    if (cover_url !== undefined && cover_url !== null && typeof cover_url !== "string") {
      return NextResponse.json(
        { error: "cover_url must be a string or null", code: "INVALID_COVER_URL" },
        { status: 400 },
      );
    }

    if (name === undefined && cover_url === undefined) {
      return NextResponse.json(
        { error: "No fields to update", code: "NO_UPDATES" },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const trimmedName = name !== undefined ? name.trim() : null;

    // Use separate queries to avoid passing JS booleans into SQL
    let result;
    if (cover_url !== undefined) {
      // Update both name and cover_url
      result = await db.execute(sql`
        UPDATE story_highlights
        SET
          name = COALESCE(${trimmedName}, name),
          cover_url = ${cover_url ?? null},
          updated_at = ${now}
        WHERE id = ${highlightId}
        RETURNING id, creator_id, name, cover_url, position, created_at, updated_at
      `);
    } else {
      // Update name only
      result = await db.execute(sql`
        UPDATE story_highlights
        SET
          name = COALESCE(${trimmedName}, name),
          updated_at = ${now}
        WHERE id = ${highlightId}
        RETURNING id, creator_id, name, cover_url, position, created_at, updated_at
      `);
    }

    return NextResponse.json({ data: result[0] });
  } catch (err) {
    console.error("PATCH /api/highlights/[id] error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/highlights/[id]
//
// Remove a highlight collection. Stories return to expired pool. Creator only.
// ---------------------------------------------------------------------------
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const highlightId = params.id;
    const idError = validateId(highlightId);
    if (idError) return idError;

    // Verify ownership
    const highlightRows = await db.execute(sql`
      SELECT id, creator_id FROM story_highlights
      WHERE id = ${highlightId}
      LIMIT 1
    `);

    if (highlightRows.length === 0) {
      return NextResponse.json(
        { error: "Highlight not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    if (highlightRows[0].creator_id !== user.id) {
      return NextResponse.json(
        { error: "You can only delete your own highlights", code: "FORBIDDEN" },
        { status: 403 },
      );
    }

    // Delete items first (cascade should handle, but be explicit)
    await db.execute(sql`
      DELETE FROM story_highlight_items WHERE highlight_id = ${highlightId}
    `);

    await db.execute(sql`
      DELETE FROM story_highlights WHERE id = ${highlightId}
    `);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/highlights/[id] error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
