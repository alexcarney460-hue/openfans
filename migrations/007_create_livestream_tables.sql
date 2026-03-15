-- Migration 007: Create livestream tables
-- Supports live streaming sessions, viewer tracking, and live chat

-- Main live_streams table
CREATE TABLE IF NOT EXISTS live_streams (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  creator_id TEXT NOT NULL REFERENCES users_table(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  stream_key TEXT UNIQUE NOT NULL,
  playback_url TEXT,
  thumbnail_url TEXT,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  viewer_count INTEGER NOT NULL DEFAULT 0,
  peak_viewers INTEGER NOT NULL DEFAULT 0,
  is_subscriber_only BOOLEAN NOT NULL DEFAULT false,
  chat_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_streams_creator_id ON live_streams(creator_id);
CREATE INDEX IF NOT EXISTS idx_live_streams_status ON live_streams(status);
CREATE INDEX IF NOT EXISTS idx_live_streams_scheduled_at ON live_streams(scheduled_at);

-- Viewer tracking table
CREATE TABLE IF NOT EXISTS live_stream_viewers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  stream_id TEXT NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  viewer_id TEXT NOT NULL REFERENCES users_table(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  UNIQUE(stream_id, viewer_id)
);

CREATE INDEX IF NOT EXISTS idx_live_stream_viewers_stream_id ON live_stream_viewers(stream_id);
CREATE INDEX IF NOT EXISTS idx_live_stream_viewers_viewer_id ON live_stream_viewers(viewer_id);

-- Live chat messages table
CREATE TABLE IF NOT EXISTS live_chat_messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  stream_id TEXT NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES users_table(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_chat_messages_stream_id ON live_chat_messages(stream_id);
CREATE INDEX IF NOT EXISTS idx_live_chat_messages_sender_id ON live_chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_live_chat_messages_created_at ON live_chat_messages(stream_id, created_at DESC);
