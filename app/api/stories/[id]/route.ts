export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getAuthenticatedAdmin } from "@/utils/api/auth";
import { db } from "@/utils/db/db";
import { sql } from "drizzle-orm";

/**
 * GET /api/stories/[id]
 *
 * Return a single story and record that the current user viewed it.
 * View is recorded via upsert (no duplicates per user per story).
 * Increments views_count only on first view.
 */
export async function GET(
  _request: NextRequest,
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

    // Fetch the story with creator info
    const storyRows = await db.execute(sql`
      SELECT
        s.id,
        s.creator_id,
        s.media_url,
        s.media_type,
        s.caption,
        s.expires_at,
        s.views_count,
        s.created_at,
        u.username,
        u.display_name,
        u.avatar_url
      FROM stories s
      JOIN users_table u ON u.id = s.creator_id
      WHERE s.id = ${storyId}
      LIMIT 1
    `);

    if (storyRows.length === 0) {
      return NextResponse.json(
        { error: "Story not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    const story = storyRows[0];

    // Check if story is expired (still return for creator, but not others)
    const isExpired = new Date(story.expires_at as string) <= new Date();
    const isOwner = story.creator_id === user.id;

    if (isExpired && !isOwner) {
      return NextResponse.json(
        { error: "Story has expired", code: "STORY_EXPIRED" },
        { status: 410 },
      );
    }

    // Record view (upsert) and increment views_count atomically if first view
    // Only record views for non-owners
    if (!isOwner) {
      const insertResult = await db.execute(sql`
        INSERT INTO story_views (story_id, viewer_id, viewed_at)
        VALUES (${storyId}, ${user.id}, ${new Date().toISOString()})
        ON CONFLICT (story_id, viewer_id) DO NOTHING
        RETURNING id
      `);

      // If a row was inserted (first view), increment the counter
      if (insertResult.length > 0) {
        const updateResult = await db.execute(sql`
          UPDATE stories
          SET views_count = views_count + 1
          WHERE id = ${storyId}
          RETURNING views_count
        `);

        // Send milestone notifications at 10, 50, 100, 500 views
        const newViewCount = updateResult.length > 0
          ? (updateResult[0].views_count as number)
          : null;

        if (newViewCount !== null) {
          const MILESTONES = [10, 50, 100, 500] as const;
          if (MILESTONES.includes(newViewCount as typeof MILESTONES[number])) {
            const creatorId = story.creator_id as string;
            db.execute(sql`
              INSERT INTO notifications (user_id, type, title, body, reference_id)
              VALUES (
                ${creatorId},
                'new_message',
                ${`Your story reached ${newViewCount} views!`},
                ${`Your story${story.caption ? ` "${(story.caption as string).slice(0, 50)}"` : ""} just hit ${newViewCount} views. Keep creating!`},
                ${storyId}
              )
            `).catch((notifErr) => {
              console.warn("Failed to create story milestone notification:", notifErr);
            });
          }
        }
      }
    }

    // Re-fetch the updated views_count
    const updatedRows = await db.execute(sql`
      SELECT views_count FROM stories WHERE id = ${storyId}
    `);

    const viewsCount = updatedRows.length > 0
      ? updatedRows[0].views_count
      : story.views_count;

    return NextResponse.json({
      data: {
        id: story.id,
        creator_id: story.creator_id,
        media_url: story.media_url,
        media_type: story.media_type,
        caption: story.caption,
        expires_at: story.expires_at,
        views_count: viewsCount,
        created_at: story.created_at,
        is_expired: isExpired,
        creator: {
          username: story.username,
          display_name: story.display_name,
          avatar_url: story.avatar_url,
        },
      },
    });
  } catch (err) {
    console.error("GET /api/stories/[id] error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/stories/[id]
 *
 * Delete a story. Creator can delete own stories, admin can delete any.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const storyId = params.id;

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storyId)) {
      return NextResponse.json(
        { error: "Invalid story ID", code: "INVALID_ID" },
        { status: 400 },
      );
    }

    // Fetch the story to check ownership
    const storyRows = await db.execute(sql`
      SELECT id, creator_id, media_url FROM stories WHERE id = ${storyId} LIMIT 1
    `);

    if (storyRows.length === 0) {
      return NextResponse.json(
        { error: "Story not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    const story = storyRows[0];

    // Check authorization: must be owner or admin
    if (story.creator_id !== user.id) {
      // Check if admin
      const adminCheck = await getAuthenticatedAdmin();
      if (adminCheck.error) {
        return NextResponse.json(
          { error: "You can only delete your own stories", code: "FORBIDDEN" },
          { status: 403 },
        );
      }
    }

    // Delete associated views first (cascade should handle this, but be explicit)
    await db.execute(sql`
      DELETE FROM story_views WHERE story_id = ${storyId}
    `);

    // Delete the story
    await db.execute(sql`
      DELETE FROM stories WHERE id = ${storyId}
    `);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/stories/[id] error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
