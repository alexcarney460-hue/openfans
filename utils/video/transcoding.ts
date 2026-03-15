// ---------------------------------------------------------------------------
// Video Transcoding — Shared Types & Constants
// ---------------------------------------------------------------------------

/**
 * Available output quality levels for transcoded video variants.
 */
export type VideoQuality = "1080p" | "720p" | "480p" | "360p";

/**
 * Possible statuses for a video_assets record.
 */
export type VideoAssetStatus =
  | "uploaded"
  | "processing"
  | "ready"
  | "failed";

/**
 * Configuration for a single quality variant.
 */
export interface VideoQualityConfig {
  readonly quality: VideoQuality;
  readonly width: number;
  readonly height: number;
  /** Target video bitrate in kbps */
  readonly bitrate: number;
}

/**
 * Payload shape for a single transcoded variant delivered by the external
 * transcoding service via the webhook.
 */
export interface TranscodedVariant {
  readonly quality: VideoQuality;
  readonly url: string;
  readonly width: number;
  readonly height: number;
  readonly bitrate: number;
  readonly file_size_bytes?: number;
}

/**
 * Body accepted by POST /api/video/transcode (webhook from external service).
 */
export interface TranscodeWebhookPayload {
  readonly video_id: string;
  readonly status: "ready" | "failed";
  readonly variants?: readonly TranscodedVariant[];
  readonly thumbnail_url?: string;
  readonly duration?: number;
  readonly width?: number;
  readonly height?: number;
  readonly error_message?: string;
}

// ---------------------------------------------------------------------------
// Quality presets ordered from highest to lowest resolution.
// ---------------------------------------------------------------------------

export const VIDEO_QUALITIES: readonly VideoQualityConfig[] = [
  { quality: "1080p", width: 1920, height: 1080, bitrate: 4500 },
  { quality: "720p", width: 1280, height: 720, bitrate: 2500 },
  { quality: "480p", width: 854, height: 480, bitrate: 1200 },
  { quality: "360p", width: 640, height: 360, bitrate: 600 },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the list of quality presets that are at or below the original
 * video resolution.  A quality is included when BOTH its width and height
 * are <= the source dimensions.
 *
 * Example: a 1280x720 source returns ["720p", "480p", "360p"].
 */
export function getVideoQualitiesForResolution(
  width: number,
  height: number,
): readonly VideoQualityConfig[] {
  return VIDEO_QUALITIES.filter(
    (q) => q.width <= width && q.height <= height,
  );
}

/**
 * Validate that a string is a known VideoQuality value.
 */
export function isVideoQuality(value: string): value is VideoQuality {
  return ["1080p", "720p", "480p", "360p"].includes(value);
}

/**
 * Validate the shape of a TranscodeWebhookPayload at runtime.
 * Returns an error message string when invalid, or null when valid.
 */
export function validateWebhookPayload(
  body: unknown,
): string | null {
  if (body === null || typeof body !== "object") {
    return "Body must be a JSON object";
  }

  const obj = body as Record<string, unknown>;

  if (typeof obj.video_id !== "string" || obj.video_id.length === 0) {
    return "video_id is required and must be a non-empty string";
  }

  if (obj.status !== "ready" && obj.status !== "failed") {
    return "status must be 'ready' or 'failed'";
  }

  if (obj.status === "ready") {
    if (!Array.isArray(obj.variants) || obj.variants.length === 0) {
      return "variants array is required when status is 'ready'";
    }

    for (let i = 0; i < obj.variants.length; i++) {
      const v = obj.variants[i] as Record<string, unknown>;
      if (!isVideoQuality(String(v.quality ?? ""))) {
        return `variants[${i}].quality must be one of: 1080p, 720p, 480p, 360p`;
      }
      if (typeof v.url !== "string" || v.url.length === 0) {
        return `variants[${i}].url is required`;
      }
      if (typeof v.width !== "number" || v.width <= 0) {
        return `variants[${i}].width must be a positive number`;
      }
      if (typeof v.height !== "number" || v.height <= 0) {
        return `variants[${i}].height must be a positive number`;
      }
      if (typeof v.bitrate !== "number" || v.bitrate <= 0) {
        return `variants[${i}].bitrate must be a positive number`;
      }
    }

    if (typeof obj.thumbnail_url !== "string" || obj.thumbnail_url.length === 0) {
      return "thumbnail_url is required when status is 'ready'";
    }

    if (typeof obj.duration !== "number" || obj.duration <= 0) {
      return "duration must be a positive number when status is 'ready'";
    }
  }

  return null;
}
