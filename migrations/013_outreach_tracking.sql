-- Outreach tracking for automated Instagram comment campaigns
-- Tracks which creators have been contacted and the result

CREATE TABLE IF NOT EXISTS outreach_log (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  platform_username TEXT NOT NULL,
  instagram_handle TEXT,
  action TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  comment_text TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outreach_log_username ON outreach_log(platform_username);
CREATE INDEX IF NOT EXISTS idx_outreach_log_status ON outreach_log(status);
CREATE INDEX IF NOT EXISTS idx_outreach_log_created ON outreach_log(created_at);
