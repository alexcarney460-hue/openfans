/**
 * Shared types and constants for the live streaming feature.
 */

export type StreamStatus = "scheduled" | "live" | "ended" | "cancelled";

export interface StreamRecord {
  readonly id: string;
  readonly creator_id: string;
  readonly title: string;
  readonly description: string | null;
  readonly status: StreamStatus;
  readonly stream_key: string;
  readonly playback_url: string | null;
  readonly thumbnail_url: string | null;
  readonly scheduled_at: string | null;
  readonly started_at: string | null;
  readonly ended_at: string | null;
  readonly viewer_count: number;
  readonly peak_viewers: number;
  readonly is_subscriber_only: boolean;
  readonly chat_enabled: boolean;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface ChatMessage {
  readonly id: string;
  readonly stream_id: string;
  readonly sender_id: string;
  readonly body: string;
  readonly is_pinned: boolean;
  readonly created_at: string;
  readonly sender_username?: string;
  readonly sender_avatar_url?: string | null;
}

export interface StreamViewer {
  readonly id: string;
  readonly stream_id: string;
  readonly viewer_id: string;
  readonly joined_at: string;
  readonly left_at: string | null;
  readonly username?: string;
  readonly avatar_url?: string | null;
}

/** Maximum character length for a single chat message. */
export const MAX_CHAT_LENGTH = 500;

/** Maximum chat messages per user per minute. */
export const CHAT_RATE_LIMIT = 30;

/** Valid status transitions: key = current status, value = allowed next statuses. */
export const VALID_STATUS_TRANSITIONS: Record<StreamStatus, readonly StreamStatus[]> = {
  scheduled: ["live", "cancelled"],
  live: ["ended"],
  ended: [],
  cancelled: [],
} as const;

/** UUID v4 regex for validation. */
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
