export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/utils/api/auth";
import { db } from "@/utils/db/db";
import { usersTable } from "@/utils/db/schema";
import { eq, sql } from "drizzle-orm";
import { checkRateLimit, getRateLimitKey } from "@/utils/rate-limit";
import { uploadVideoToStorage } from "@/utils/video/storage";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB

const ALLOWED_MIME_TYPES = new Set([
  "video/mp4",
  "video/quicktime", // .mov
  "video/webm",
  "video/x-msvideo", // .avi
  "video/x-matroska", // .mkv
]);

const ALLOWED_EXTENSIONS = new Set(["mp4", "mov", "webm", "avi", "mkv"]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getFileExtension(filename: string): string {
  return (filename.split(".").pop() || "").toLowerCase();
}

function isAllowedVideoType(file: File): boolean {
  const ext = getFileExtension(file.name);
  return ALLOWED_MIME_TYPES.has(file.type) || ALLOWED_EXTENSIONS.has(ext);
}

// ---------------------------------------------------------------------------
// POST /api/upload/video
// ---------------------------------------------------------------------------

/**
 * Upload a video file to Supabase Storage and create a video_assets record.
 *
 * Expects multipart/form-data with:
 *   - file: the video file
 *
 * Returns: { data: VideoAsset }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    // 2. Verify creator role
    const dbUser = await db
      .select({ role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .limit(1);

    if (
      dbUser.length === 0 ||
      (dbUser[0].role !== "creator" && dbUser[0].role !== "admin")
    ) {
      return NextResponse.json(
        { error: "Only creators can upload videos", code: "CREATOR_REQUIRED" },
        { status: 403 },
      );
    }

    // 3. Rate limit: 10 uploads per hour
    const rateLimited = await checkRateLimit(
      request,
      getRateLimitKey(request, user.id),
      "video-upload",
      10,
      3_600_000, // 1 hour
    );
    if (rateLimited) return rateLimited;

    // 4. Parse form data
    const formData = await request.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json(
        { error: "Invalid form data", code: "INVALID_FORM" },
        { status: 400 },
      );
    }

    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No video file provided", code: "MISSING_FILE" },
        { status: 400 },
      );
    }

    // 5. Validate file type
    if (!isAllowedVideoType(file)) {
      return NextResponse.json(
        {
          error: `File type "${file.type}" not allowed. Accepted: MP4, MOV, WebM, AVI, MKV`,
          code: "INVALID_FILE_TYPE",
        },
        { status: 400 },
      );
    }

    // 6. Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: "File too large. Maximum size is 500MB.",
          code: "FILE_TOO_LARGE",
        },
        { status: 400 },
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "File is empty", code: "EMPTY_FILE" },
        { status: 400 },
      );
    }

    // 7. Upload to Supabase Storage
    let storagePath: string;
    let storageUrl: string;

    try {
      const result = await uploadVideoToStorage(file, user.id);
      storagePath = result.path;
      storageUrl = result.url;
    } catch (uploadErr) {
      console.error("Video storage upload error:", uploadErr);
      return NextResponse.json(
        { error: "Failed to upload video file", code: "UPLOAD_FAILED" },
        { status: 500 },
      );
    }

    // 8. Create video_assets record via raw SQL
    const videoId = crypto.randomUUID();
    const now = new Date().toISOString();

    const insertResult = await db.execute(sql`
      INSERT INTO video_assets (
        id,
        creator_id,
        original_url,
        storage_path,
        status,
        original_filename,
        file_size_bytes,
        mime_type,
        duration_seconds,
        width,
        height,
        thumbnail_url,
        hls_url,
        created_at,
        updated_at
      ) VALUES (
        ${videoId},
        ${user.id},
        ${storageUrl},
        ${storagePath},
        'uploaded',
        ${file.name},
        ${file.size},
        ${file.type},
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        ${now},
        ${now}
      )
      RETURNING *
    `);

    const videoAsset = insertResult[0];

    return NextResponse.json({ data: videoAsset }, { status: 201 });
  } catch (err) {
    console.error("POST /api/upload/video error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
