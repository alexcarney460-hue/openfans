import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { validateMagicBytes } from "@/utils/validation";
import { checkRateLimit, getRateLimitKey } from "@/utils/rate-limit";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime"] as const;

const ALLOWED_TYPES = new Set<string>([
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_VIDEO_TYPES,
]);

const ALLOWED_BUCKETS = new Set(["avatars", "banners", "posts"]);

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

/**
 * POST /api/upload
 * Upload a file to Supabase Storage.
 *
 * Expects multipart/form-data with:
 *   - file: the file to upload
 *   - bucket: "avatars" | "banners" | "posts"
 *
 * Returns: { data: { url: string, path: string } }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", code: "AUTH_REQUIRED" },
        { status: 401 },
      );
    }

    // Rate limit: 20 requests per minute per user
    const rateLimited = checkRateLimit(request, getRateLimitKey(request, user.id), "upload", 20, 60_000);
    if (rateLimited) return rateLimited;

    // Parse form data
    const formData = await request.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json(
        { error: "Invalid form data", code: "INVALID_FORM" },
        { status: 400 },
      );
    }

    const file = formData.get("file");
    const bucket = formData.get("bucket");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided", code: "MISSING_FILE" },
        { status: 400 },
      );
    }

    if (typeof bucket !== "string" || !ALLOWED_BUCKETS.has(bucket)) {
      return NextResponse.json(
        {
          error: `Invalid bucket. Must be one of: ${Array.from(ALLOWED_BUCKETS).join(", ")}`,
          code: "INVALID_BUCKET",
        },
        { status: 400 },
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          error: `File type "${file.type}" not allowed. Accepted: JPG, PNG, GIF, WebP, MP4, MOV`,
          code: "INVALID_FILE_TYPE",
        },
        { status: 400 },
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File too large. Maximum size is 50MB.`,
          code: "FILE_TOO_LARGE",
        },
        { status: 400 },
      );
    }

    // Build a unique file path: userId/timestamp-originalName
    const extension = file.name.split(".").pop() || "bin";
    const sanitizedName = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 50);
    const filePath = `${user.id}/${Date.now()}-${sanitizedName}.${extension}`;

    // Read file buffer and validate magic bytes match the declared MIME type
    const arrayBuffer = await file.arrayBuffer();

    if (!validateMagicBytes(arrayBuffer, file.type)) {
      return NextResponse.json(
        {
          error: "File content does not match declared type",
          code: "MAGIC_BYTES_MISMATCH",
        },
        { status: 400 },
      );
    }

    // Upload to Supabase Storage
    const buffer = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file", code: "UPLOAD_FAILED" },
        { status: 500 },
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(filePath);

    return NextResponse.json(
      {
        data: {
          url: publicUrl,
          path: filePath,
          bucket,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("POST /api/upload error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
