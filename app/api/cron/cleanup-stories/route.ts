export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { sql } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";
import { timingSafeEqual } from "crypto";

/**
 * GET /api/cron/cleanup-stories
 *
 * Cron-compatible endpoint that deletes stories expired more than 48 hours ago.
 * This preserves a 24h buffer after the 24h story lifetime so creators can
 * review story performance before cleanup.
 *
 * Steps:
 * 1. Find stories where expires_at < (now - 48h)
 * 2. Delete associated media from Supabase Storage
 * 3. Delete story_views (cascade handles this, but explicit for safety)
 * 4. Delete the stories
 *
 * Protected by CRON_SECRET via timing-safe comparison.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret with timing-safe comparison
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || !authHeader) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const expectedToken = `Bearer ${cronSecret}`;

    // Timing-safe comparison to prevent timing attacks
    if (!isTimingSafeEqual(authHeader, expectedToken)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const now = new Date();
    const cutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    // Find stories expired more than 48 hours ago
    const expiredStories = await db.execute(sql`
      SELECT id, media_url, creator_id
      FROM stories
      WHERE expires_at < ${cutoff.toISOString()}
    `);

    if (expiredStories.length === 0) {
      return NextResponse.json({
        success: true,
        deleted: 0,
        media_deleted: 0,
        timestamp: now.toISOString(),
      });
    }

    // Delete media from Supabase Storage
    const supabase = createClient();
    let mediaDeleted = 0;
    const mediaErrors: string[] = [];

    for (const story of expiredStories) {
      const mediaUrl = story.media_url as string;
      const storagePath = extractStoragePath(mediaUrl);

      if (storagePath) {
        const { bucket, path } = storagePath;
        const { error: deleteError } = await supabase.storage
          .from(bucket)
          .remove([path]);

        if (deleteError) {
          console.error(
            `Failed to delete media for story ${story.id}:`,
            deleteError,
          );
          mediaErrors.push(String(story.id));
        } else {
          mediaDeleted++;
        }
      }
    }

    // Collect IDs for batch delete
    const storyIds = expiredStories.map((s) => s.id as string);

    // Delete story_views for these stories (cascade should handle, but explicit)
    await db.execute(sql`
      DELETE FROM story_views
      WHERE story_id = ANY(${storyIds}::uuid[])
    `);

    // Delete the stories
    const deleteResult = await db.execute(sql`
      DELETE FROM stories
      WHERE expires_at < ${cutoff.toISOString()}
    `);

    return NextResponse.json({
      success: true,
      deleted: storyIds.length,
      media_deleted: mediaDeleted,
      media_errors: mediaErrors.length > 0 ? mediaErrors : undefined,
      timestamp: now.toISOString(),
    });
  } catch (err) {
    console.error("Cron cleanup-stories error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * Timing-safe string comparison that handles different-length strings.
 * crypto.timingSafeEqual requires equal-length buffers, so we pad/hash first.
 */
function isTimingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf-8");
  const bufB = Buffer.from(b, "utf-8");

  // If lengths differ, still do a comparison to avoid timing leak on length
  if (bufA.length !== bufB.length) {
    // Compare against itself to burn the same time, then return false
    timingSafeEqual(bufA, bufA);
    return false;
  }

  return timingSafeEqual(bufA, bufB);
}

/**
 * Extract the Supabase Storage bucket and path from a public URL.
 *
 * Public URLs follow the pattern:
 *   https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
 *
 * Returns null if the URL doesn't match the expected pattern.
 */
function extractStoragePath(
  url: string,
): { bucket: string; path: string } | null {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(
      /\/storage\/v1\/object\/public\/([^/]+)\/(.+)/,
    );
    if (!match) return null;
    return { bucket: match[1], path: match[2] };
  } catch {
    return null;
  }
}
