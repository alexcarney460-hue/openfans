-- Migration 008: Add ticket pricing to streams and purchase tracking table

-- Add ticket_price column (in cents) to live_streams
ALTER TABLE live_streams
  ADD COLUMN IF NOT EXISTS ticket_price INTEGER NOT NULL DEFAULT 500;

-- Purchase ledger for PPV stream access
CREATE TABLE IF NOT EXISTS live_stream_purchases (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  stream_id TEXT NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  buyer_id TEXT NOT NULL REFERENCES users_table(id) ON DELETE CASCADE,
  amount_usdc INTEGER NOT NULL,
  payment_tx TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- No UNIQUE on (stream_id, buyer_id) — viewers can purchase multiple 20-min windows

CREATE INDEX IF NOT EXISTS idx_live_stream_purchases_stream_id
  ON live_stream_purchases(stream_id);

CREATE INDEX IF NOT EXISTS idx_live_stream_purchases_buyer_id
  ON live_stream_purchases(buyer_id);
