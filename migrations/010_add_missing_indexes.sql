CREATE INDEX IF NOT EXISTS idx_payouts_creator_id ON payouts(creator_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_reference_id ON wallet_transactions(reference_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id_type ON wallet_transactions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_posts_creator_id_published ON posts(creator_id, is_published);
CREATE INDEX IF NOT EXISTS idx_subscriptions_subscriber_creator ON subscriptions(subscriber_id, creator_id);
