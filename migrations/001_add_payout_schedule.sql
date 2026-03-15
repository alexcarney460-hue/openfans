-- Add payout_schedule column to creator_profiles table.
-- Values: 'manual' (default), 'weekly', 'monthly'
-- Run this migration before deploying the auto-payout cron job.

ALTER TABLE creator_profiles
ADD COLUMN IF NOT EXISTS payout_schedule TEXT NOT NULL DEFAULT 'manual';

-- Add a check constraint to restrict valid values
ALTER TABLE creator_profiles
ADD CONSTRAINT creator_profiles_payout_schedule_check
CHECK (payout_schedule IN ('manual', 'weekly', 'monthly'));
