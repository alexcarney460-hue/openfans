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

function validateUuid(value: string, label: string): NextResponse | null {
  if (!UUID_RE.test(value)) {
    return NextResponse.json(
      { error: `Invalid ${label}`, code: "INVALID_ID" },
      { status: 400 },
    );
  }
  return null;
}

// ---------------------------------------------------------------------------
// POST /api/highlights/[id]/stories
//
// Add a story to a highlight. Must be own story (active or expired within 48h).
// Body: { story_id: string }
// ---------------------------------------------------------------------------
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const highlightId = params.id;
    const idError = validateUuid(highlightId, "highlight ID");
    if (idError) return idError;

    // Verify highlight exists and is owned by user
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
        { error: "You can only add stories to your own highlights", code: "FORBIDDEN" },
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

    const { story_id } = body;

    if (!story_id || typeof story_id !== "string") {
      return NextResponse.json(
        { error: "story_id is required", code: "MISSING_STORY_ID" },
        { status: 400 },
      );
    }

    const storyIdError = validateUuid(story_id, "story ID");
    if (storyIdError) return storyIdError;

    // Verify the story belongs to this user and is within the 48h expired window
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const storyRows = await db.execute(sql`
      SELECT id, creator_id, expires_at
      FROM stories
      WHERE id = ${story_id}
      LIMIT 1
    `);

    if (storyRows.length === 0) {
      return NextResponse.json(
        { error: "Story not found", code: "STORY_NOT_FOUND" },
        { status: 404 },
      );
    }

    const story = storyRows[0];

    if (story.creator_id !== user.id) {
      return NextResponse.json(
        { error: "You can only add your own stories to highlights", code: "FORBIDDEN" },
        { status: 403 },
      );
    }

    // Check if story is active or expired within 48h
    const expiresAt = new Date(story.expires_at as string);
    const now = new Date();
    const isActive = expiresAt > now;
    const isRecentlyExpired = !isActive && expiresAt > cutoff;

    if (!isActive && !isRecentlyExpired) {
      return NextResponse.json(
        {
          error: "Story has been expired for more than 48 hours",
          code: "STORY_TOO_OLD",
        },
        { status: 400 },
      );
    }

    // Determine next position
    const posRows = await db.execute(sql`
      SELECT COALESCE(MAX(position), -1)::int + 1 AS next_pos
      FROM story_highlight_items
      WHERE highlight_id = ${highlightId}
    `);
    const nextPos = Number(posRows[0]?.next_pos ?? 0);

    const addedAt = now.toISOString();

    // Insert (upsert to handle duplicates gracefully)
    const result = await db.execute(sql`
      INSERT INTO story_highlight_items (highlight_id, story_id, position, added_at)
      VALUES (${highlightId}, ${story_id}, ${nextPos}, ${addedAt})
      ON CONFLICT (highlight_id, story_id) DO NOTHING
      RETURNING id, highlight_id, story_id, position, added_at
    `);

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Story is already in this highlight", code: "DUPLICATE" },
        { status: 409 },
      );
    }

    // Update highlight's updated_at timestamp
    await db.execute(sql`
      UPDATE story_highlights SET updated_at = ${addedAt} WHERE id = ${highlightId}
    `);

    return NextResponse.json({ data: result[0] }, { status: 201 });
  } catch (err) {
    console.error("POST /api/highlights/[id]/stories error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/highlights/[id]/stories
//
// Remove a story from a highlight.
// Body: { story_id: string }
// ---------------------------------------------------------------------------
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const highlightId = params.id;
    const idError = validateUuid(highlightId, "highlight ID");
    if (idError) return idError;

    // Verify highlight exists and is owned by user
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
        { error: "You can only remove stories from your own highlights", code: "FORBIDDEN" },
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

    const { story_id } = body;

    if (!story_id || typeof story_id !== "string") {
      return NextResponse.json(
        { error: "story_id is required", code: "MISSING_STORY_ID" },
        { status: 400 },
      );
    }

    const storyIdError = validateUuid(story_id, "story ID");
    if (storyIdError) return storyIdError;

    // Delete the item
    const deleteResult = await db.execute(sql`
      DELETE FROM story_highlight_items
      WHERE highlight_id = ${highlightId} AND story_id = ${story_id}
      RETURNING id
    `);

    if (deleteResult.length === 0) {
      return NextResponse.json(
        { error: "Story is not in this highlight", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    // Update highlight's updated_at timestamp
    await db.execute(sql`
      UPDATE story_highlights SET updated_at = ${new Date().toISOString()} WHERE id = ${highlightId}
    `);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/highlights/[id]/stories error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
