-- AI Creator Directory
-- A curated listing of AI creators from across the web that fans can browse and request.

CREATE TABLE IF NOT EXISTS ai_creator_directory (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  bio TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  source_platform TEXT DEFAULT 'fanvue',
  source_url TEXT,
  categories TEXT[] DEFAULT '{}',
  follower_count INTEGER DEFAULT 0,
  is_claimed BOOLEAN DEFAULT false,
  claimed_by TEXT REFERENCES users_table(id),
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_directory_categories ON ai_creator_directory USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_ai_directory_username ON ai_creator_directory(username);
CREATE INDEX IF NOT EXISTS idx_ai_directory_featured ON ai_creator_directory(is_featured) WHERE is_featured = true;
