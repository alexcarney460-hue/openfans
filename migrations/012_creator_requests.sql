-- Creator request / waitlist system
-- Fans request creators they want on OpenFans; creators can then claim their page.

CREATE TABLE IF NOT EXISTS creator_requests (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  creator_name TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'onlyfans',
  platform_username TEXT NOT NULL,
  requested_by TEXT REFERENCES users_table(id) ON DELETE SET NULL,
  requested_by_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_creator_requests_unique
  ON creator_requests(platform, platform_username, COALESCE(requested_by, requested_by_email));

CREATE INDEX IF NOT EXISTS idx_creator_requests_platform_username
  ON creator_requests(platform, platform_username);

CREATE TABLE IF NOT EXISTS creator_claims (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  platform TEXT NOT NULL,
  platform_username TEXT NOT NULL,
  claim_token TEXT UNIQUE NOT NULL,
  claimed_by TEXT REFERENCES users_table(id),
  claimed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(platform, platform_username)
);
