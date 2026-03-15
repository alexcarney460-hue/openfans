-- Add video_asset_id column to posts table
-- Links a post to its video asset (one video per post)
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS video_asset_id TEXT
REFERENCES video_assets(id) ON DELETE SET NULL;
