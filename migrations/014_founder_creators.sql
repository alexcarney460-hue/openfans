-- First 100 Founders promotion
-- Founders get locked in at 5% platform fee for life (even on adult content)

ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS is_founder BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS founder_number INTEGER;

-- Index for quick founder count queries
CREATE INDEX IF NOT EXISTS idx_creator_profiles_is_founder ON creator_profiles (is_founder) WHERE is_founder = true;
