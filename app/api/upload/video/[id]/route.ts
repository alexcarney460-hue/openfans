export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/utils/api/auth";
import { db } from "@/utils/db/db";
import { sql } from "drizzle-orm";
import { deleteVideoFromStorage } from "@/utils/video/storage";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RouteParams {
  params: { id: string };
}

// ---------------------------------------------------------------------------
// GET /api/upload/video/[id]
// ---------------------------------------------------------------------------

/**
 * Get video asset status and URLs.
 * Returns the full video_assets record for the given ID.
 * Only the owning creator (or admin) can access their video assets.
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const { id } = params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Invalid video ID", code: "INVALID_ID" },
        { status: 400 },
      );
    }

    const result = await db.execute(sql`
      SELECT * FROM video_assets
      WHERE id = ${id}
      LIMIT 1
    `);

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Video not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    const videoAsset = result[0] as Record<string, unknown>;

    // Only the creator who owns this video (or an admin) can view it
    if (videoAsset.creator_id !== user.id) {
      // Check if user is admin
      const adminCheck = await db.execute(sql`
        SELECT role FROM users WHERE id = ${user.id} LIMIT 1
      `);

      if (adminCheck.length === 0 || adminCheck[0].role !== "admin") {
        return NextResponse.json(
          { error: "Video not found", code: "NOT_FOUND" },
          { status: 404 },
        );
      }
    }

    return NextResponse.json({ data: videoAsset }, { status: 200 });
  } catch (err) {
    console.error("GET /api/upload/video/[id] error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/upload/video/[id]
// ---------------------------------------------------------------------------

/**
 * Delete a video asset. Removes from both Supabase Storage and the database.
 * Only the owning creator can delete their own videos.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const { id } = params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Invalid video ID", code: "INVALID_ID" },
        { status: 400 },
      );
    }

    // Fetch the video asset and verify ownership
    const result = await db.execute(sql`
      SELECT id, creator_id, storage_path, status
      FROM video_assets
      WHERE id = ${id}
      LIMIT 1
    `);

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Video not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    const videoAsset = result[0] as Record<string, unknown>;

    // Only the creator who owns this video can delete it
    if (videoAsset.creator_id !== user.id) {
      return NextResponse.json(
        { error: "Video not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    // Don't allow deletion while transcoding is in progress
    if (videoAsset.status === "processing") {
      return NextResponse.json(
        {
          error: "Cannot delete a video that is currently being processed",
          code: "VIDEO_PROCESSING",
        },
        { status: 409 },
      );
    }

    // Delete from Supabase Storage
    const storagePath = videoAsset.storage_path as string | null;
    if (storagePath) {
      try {
        await deleteVideoFromStorage(storagePath);
      } catch (storageErr) {
        console.error("Failed to delete video from storage:", storageErr);
        // Continue with DB deletion even if storage deletion fails.
        // The storage file becomes orphaned but the user experience is unblocked.
      }
    }

    // Delete from database
    await db.execute(sql`
      DELETE FROM video_assets WHERE id = ${id}
    `);

    return NextResponse.json(
      { data: { id, deleted: true } },
      { status: 200 },
    );
  } catch (err) {
    console.error("DELETE /api/upload/video/[id] error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
