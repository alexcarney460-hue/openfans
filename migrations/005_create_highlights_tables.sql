-- Story highlights: named collections of stories that persist on a creator's profile
CREATE TABLE IF NOT EXISTS story_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id TEXT NOT NULL REFERENCES users_table(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) <= 50),
  cover_url TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS story_highlights_creator_id_idx ON story_highlights(creator_id);

-- Story highlight items: junction table linking stories to highlights
CREATE TABLE IF NOT EXISTS story_highlight_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  highlight_id UUID NOT NULL REFERENCES story_highlights(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(highlight_id, story_id)
);

CREATE INDEX IF NOT EXISTS story_highlight_items_highlight_id_idx ON story_highlight_items(highlight_id);
CREATE INDEX IF NOT EXISTS story_highlight_items_story_id_idx ON story_highlight_items(story_id);
