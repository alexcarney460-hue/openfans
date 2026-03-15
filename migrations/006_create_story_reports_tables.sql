-- Story reports: user-submitted reports on stories
CREATE TABLE IF NOT EXISTS story_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  reporter_id TEXT NOT NULL REFERENCES users_table(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (char_length(reason) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(story_id, reporter_id)
);

CREATE INDEX IF NOT EXISTS story_reports_story_id_idx ON story_reports(story_id);
CREATE INDEX IF NOT EXISTS story_reports_reporter_id_idx ON story_reports(reporter_id);
CREATE INDEX IF NOT EXISTS story_reports_created_at_idx ON story_reports(created_at);

-- Audit log for admin story removals
CREATE TABLE IF NOT EXISTS story_admin_removals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL,
  creator_id TEXT NOT NULL,
  admin_id TEXT NOT NULL REFERENCES users_table(id),
  reason TEXT NOT NULL,
  media_url TEXT,
  caption TEXT,
  removed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS story_admin_removals_creator_id_idx ON story_admin_removals(creator_id);
CREATE INDEX IF NOT EXISTS story_admin_removals_admin_id_idx ON story_admin_removals(admin_id);
