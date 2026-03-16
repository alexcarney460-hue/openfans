CREATE TABLE IF NOT EXISTS ai_generations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  creator_id TEXT NOT NULL REFERENCES users_table(id),
  type TEXT NOT NULL DEFAULT 'image',
  prompt TEXT NOT NULL,
  style TEXT,
  result_url TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  cost_credits INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_generations_creator ON ai_generations(creator_id, created_at DESC);
