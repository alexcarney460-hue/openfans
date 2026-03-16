-- AI Chat Personas: creator-configured AI characters that fans pay to chat with
CREATE TABLE IF NOT EXISTS ai_chat_personas (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  creator_id TEXT NOT NULL REFERENCES users_table(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  personality TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  avatar_url TEXT,
  greeting_message TEXT DEFAULT 'Hey! How are you doing? 💕',
  price_per_message INTEGER NOT NULL DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  total_conversations INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  total_revenue_usdc INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_personas_creator ON ai_chat_personas(creator_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_personas_active ON ai_chat_personas(is_active);

-- AI Chat Conversations: one per fan per persona
CREATE TABLE IF NOT EXISTS ai_chat_conversations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  persona_id TEXT NOT NULL REFERENCES ai_chat_personas(id) ON DELETE CASCADE,
  fan_id TEXT NOT NULL REFERENCES users_table(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(persona_id, fan_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_conversations_fan ON ai_chat_conversations(fan_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_conversations_persona ON ai_chat_conversations(persona_id);

-- AI Chat Messages: individual messages within a conversation
CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  conversation_id TEXT NOT NULL REFERENCES ai_chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  cost_usdc INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_conversation ON ai_chat_messages(conversation_id, created_at);
