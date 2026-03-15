export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { sql } from "drizzle-orm";
import { timingSafeEqual } from "crypto";
import {
  validateWebhookPayload,
  type TranscodeWebhookPayload,
  type TranscodedVariant,
} from "@/utils/video/transcoding";

const MAX_VARIANTS = 20;

// ---------------------------------------------------------------------------
// Auth helper — timing-safe comparison of bearer tokens
// ---------------------------------------------------------------------------

function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : "";

  if (!token) return false;

  const cronSecret = process.env.CRON_SECRET;
  const webhookSecret = process.env.VIDEO_WEBHOOK_SECRET;

  if (cronSecret && cronSecret.length === token.length && timingSafeCompare(token, cronSecret)) return true;
  if (webhookSecret && webhookSecret.length === token.length && timingSafeCompare(token, webhookSecret)) return true;

  return false;
}

// ---------------------------------------------------------------------------
// POST /api/video/transcode
//
// Webhook called by the external transcoding service once processing
// completes (success or failure). Uses atomic UPDATE + transaction.
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

    // 3. Handle failure — atomic UPDATE with state guard
    if (payload.status === "failed") {
      const updated = await db.execute(sql`
        UPDATE video_assets
        SET status = 'failed',
            updated_at = ${now}
        WHERE id = ${payload.video_id}
          AND status IN ('processing', 'uploaded')
        RETURNING id
      `);

      if ((updated as unknown as Array<unknown>).length === 0) {
        return NextResponse.json(
          { error: "Video not found or already in terminal state", code: "INVALID_STATE" },
          { status: 409 },
        );
      }

      return NextResponse.json({
        success: true,
        video_id: payload.video_id,
        status: "failed",
      });
    }

    // 4. Success path — wrap status update + variant inserts in a transaction
    const variants = payload.variants as readonly TranscodedVariant[];

    if (variants.length > MAX_VARIANTS) {
      return NextResponse.json(
        { error: `Too many variants (max ${MAX_VARIANTS})`, code: "TOO_MANY_VARIANTS" },
        { status: 400 },
      );
    }

    let variantsInserted = 0;

    await db.transaction(async (tx) => {
      // Atomic status update with state guard
      const updated = await tx.execute(sql`
        UPDATE video_assets
        SET status = 'ready',
            thumbnail_url = ${payload.thumbnail_url ?? null},
            duration_seconds = ${payload.duration ?? null},
            width = ${payload.width ?? null},
            height = ${payload.height ?? null},
            updated_at = ${now}
        WHERE id = ${payload.video_id}
          AND status IN ('processing', 'uploaded')
        RETURNING id
      `);

      if ((updated as unknown as Array<unknown>).length === 0) {
        throw new Error("INVALID_STATE");
      }

      // Insert variants
      for (const variant of variants) {
        const variantId = crypto.randomUUID();
        await tx.execute(sql`
          INSERT INTO video_variants (
            id, video_asset_id, quality, url, width, height,
            bitrate_kbps, file_size_bytes, created_at
          ) VALUES (
            ${variantId}, ${payload.video_id}, ${variant.quality},
            ${variant.url}, ${variant.width}, ${variant.height},
            ${variant.bitrate}, ${variant.file_size_bytes ?? null}, ${now}
          )
          ON CONFLICT DO NOTHING
        `);
        variantsInserted++;
      }
    });

    return NextResponse.json({
      success: true,
      video_id: payload.video_id,
      status: "ready",
      variants_count: variantsInserted,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "INVALID_STATE") {
      return NextResponse.json(
        { error: "Video not found or already in terminal state", code: "INVALID_STATE" },
        { status: 409 },
      );
    }
    console.error("POST /api/video/transcode error:", err instanceof Error ? err.message : "Unknown error");
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
