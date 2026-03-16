-- House AI creators: platform-owned column + AI chat personas table

ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS is_platform_owned BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS ai_chat_personas (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  creator_id TEXT NOT NULL REFERENCES users_table(id) ON DELETE CASCADE,
  persona_name TEXT NOT NULL,
  personality TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  greeting_message TEXT,
  price_per_message_usdc INTEGER NOT NULL DEFAULT 25, -- cents
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ai_chat_personas_creator_id_unique UNIQUE(creator_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_personas_creator ON ai_chat_personas(creator_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_personas_active ON ai_chat_personas(is_active) WHERE is_active = true;
