CREATE TABLE IF NOT EXISTS used_payment_transactions (
  payment_tx TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
