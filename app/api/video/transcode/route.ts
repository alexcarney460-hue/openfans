export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { sql } from "drizzle-orm";
import {
  validateWebhookPayload,
  type TranscodeWebhookPayload,
  type TranscodedVariant,
} from "@/utils/video/transcoding";

// ---------------------------------------------------------------------------
// Auth helper — accepts either CRON_SECRET or VIDEO_WEBHOOK_SECRET
// ---------------------------------------------------------------------------

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : "";

  if (!token) return false;

  const cronSecret = process.env.CRON_SECRET;
  const webhookSecret = process.env.VIDEO_WEBHOOK_SECRET;

  if (cronSecret && token === cronSecret) return true;
  if (webhookSecret && token === webhookSecret) return true;

  return false;
}

// ---------------------------------------------------------------------------
// POST /api/video/transcode
//
// Webhook called by the external transcoding service once processing
// completes (success or failure).
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // 1. Auth
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { error: "Unauthorized", code: "AUTH_REQUIRED" },
        { status: 401 },
      );
    }

    // 2. Parse & validate body
    const body: unknown = await request.json().catch(() => null);

    const validationError = validateWebhookPayload(body);
    if (validationError) {
      return NextResponse.json(
        { error: validationError, code: "INVALID_PAYLOAD" },
        { status: 400 },
      );
    }

    const payload = body as TranscodeWebhookPayload;
    const now = new Date().toISOString();

    // 3. Verify the video exists and is in a valid state for updates
    const existing = await db.execute(sql`
      SELECT id, status
      FROM video_assets
      WHERE id = ${payload.video_id}
      LIMIT 1
    `);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Video not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    const currentStatus = (existing[0] as Record<string, unknown>).status;
    if (currentStatus !== "processing" && currentStatus !== "uploaded") {
      return NextResponse.json(
        {
          error: `Video is in '${currentStatus}' state and cannot be updated`,
          code: "INVALID_STATE",
        },
        { status: 409 },
      );
    }

    // 4. Handle failure case
    if (payload.status === "failed") {
      await db.execute(sql`
        UPDATE video_assets
        SET status = 'failed',
            updated_at = ${now}
        WHERE id = ${payload.video_id}
      `);

      return NextResponse.json({
        success: true,
        video_id: payload.video_id,
        status: "failed",
      });
    }

    // 5. Success path — update video_assets and insert variants
    await db.execute(sql`
      UPDATE video_assets
      SET status = 'ready',
          thumbnail_url = ${payload.thumbnail_url ?? null},
          duration_seconds = ${payload.duration ?? null},
          width = ${payload.width ?? null},
          height = ${payload.height ?? null},
          updated_at = ${now}
      WHERE id = ${payload.video_id}
    `);

    // 6. Insert each variant into video_variants
    const variants = payload.variants as readonly TranscodedVariant[];
    const insertedVariants: Array<Record<string, unknown>> = [];

    for (const variant of variants) {
      const variantId = crypto.randomUUID();
      const result = await db.execute(sql`
        INSERT INTO video_variants (
          id,
          video_asset_id,
          quality,
          url,
          width,
          height,
          bitrate_kbps,
          file_size_bytes,
          created_at
        ) VALUES (
          ${variantId},
          ${payload.video_id},
          ${variant.quality},
          ${variant.url},
          ${variant.width},
          ${variant.height},
          ${variant.bitrate},
          ${variant.file_size_bytes ?? null},
          ${now}
        )
        RETURNING *
      `);
      insertedVariants.push(result[0] as Record<string, unknown>);
    }

    return NextResponse.json({
      success: true,
      video_id: payload.video_id,
      status: "ready",
      variants_count: insertedVariants.length,
    });
  } catch (err) {
    console.error("POST /api/video/transcode error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
