-- Add geo-blocking columns to creator_profiles
-- blocked_countries stores ISO 3166-1 alpha-2 country codes (e.g. 'US', 'GB')
-- blocked_regions stores country:region pairs (e.g. 'US:CA', 'US:TX')
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS blocked_countries TEXT[] DEFAULT '{}';
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS blocked_regions TEXT[] DEFAULT '{}';
