-- Create video_assets and video_variants tables
CREATE TABLE IF NOT EXISTS video_assets (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL REFERENCES users_table(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  storage_path TEXT,
  status TEXT NOT NULL DEFAULT 'uploaded',
  original_filename TEXT,
  file_size_bytes BIGINT,
  mime_type TEXT,
  duration_seconds REAL,
  width INTEGER,
  height INTEGER,
  thumbnail_url TEXT,
  hls_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_assets_creator_id ON video_assets(creator_id);
CREATE INDEX IF NOT EXISTS idx_video_assets_status ON video_assets(status);

CREATE TABLE IF NOT EXISTS video_variants (
  id TEXT PRIMARY KEY,
  video_asset_id TEXT NOT NULL REFERENCES video_assets(id) ON DELETE CASCADE,
  quality TEXT NOT NULL,
  url TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  bitrate_kbps INTEGER,
  file_size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_variants_video_asset_id ON video_variants(video_asset_id);
