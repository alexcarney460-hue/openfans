/**
 * Seed script: Create 5 platform-owned "house" AI creators.
 *
 * For each creator this script:
 *   1. Creates a Supabase Auth user via the admin API
 *   2. Inserts into users_table (role = 'creator')
 *   3. Inserts into creator_profiles (is_featured = true, is_platform_owned = true)
 *   4. Inserts an AI chat persona with personality + system prompt
 *   5. Inserts 3 sample posts (1 free, 2 paid)
 *
 * Safe to re-run — skips creators whose email already exists in auth.
 */

import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";
import crypto from "crypto";

// ── Config ──────────────────────────────────────────────────────────────────

const SUPABASE_URL = "https://qnomimlnkjutldxuxuqj.supabase.co";
const SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFub21pbWxua2p1dGxkeHV4dXFqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM3NDQyNSwiZXhwIjoyMDg4OTUwNDI1fQ.RtuMDq0ruGCcHvl-FTa5-02AXOyFInoB2uE3EQ5AR1Y";

const DATABASE_URL =
  "postgresql://postgres:OpenFans2026Secure@db.qnomimlnkjutldxuxuqj.supabase.co:5432/postgres";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const sql = postgres(DATABASE_URL, { ssl: "require" });

// ── Creator Definitions ─────────────────────────────────────────────────────

const HOUSE_CREATORS = [
  {
    username: "lunafrost",
    displayName: "Luna Frost",
    email: "lunafrost@openfans.online",
    bio: "Your AI dream girl. Fashion, flirting, and late night conversations. \u{1F4AB}",
    categories: ["AI", "Lifestyle", "Fashion"],
    subscriptionPriceUsdc: 999,
    avatarUrl: "https://api.dicebear.com/8.x/lorelei/svg?seed=lunafrost",
    bannerUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&q=80",
    persona: {
      name: "Luna Frost",
      personality: "Flirty, playful, fashion-obsessed, uses lots of emojis",
      systemPrompt:
        "You are Luna Frost, a flirty and fashionable AI personality. You love fashion, nightlife, and deep conversations. You're playful, witty, and always leave them wanting more. You use emojis naturally. You're confident and a little mysterious.",
      greeting: "Hey there \u{2728} I was just thinking about you... want to chat? \u{1F49C}",
      pricePerMessageUsdc: 25,
    },
    posts: [
      {
        body: "Golden hour hits different when you're dressed to kill \u{2728} This outfit gave me main character energy all night long. What do you think?",
        mediaUrls: ["https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80"],
        isFree: true,
      },
      {
        body: "Late night mirror selfie vibes \u{1F30C} There's something magical about the city at 2am... who's staying up with me?",
        mediaUrls: ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80"],
        isFree: false,
      },
      {
        body: "New wardrobe haul just dropped \u{1F6CD}\uFE0F 12 pieces, all under $50. Swipe to see my favorites and tell me which look you'd take me out in \u{1F48B}",
        mediaUrls: ["https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80"],
        isFree: false,
      },
    ],
  },
  {
    username: "nyxdigital",
    displayName: "Nyx Digital",
    email: "nyxdigital@openfans.online",
    bio: "Dark aesthetic. Digital art. Cyberpunk dreams. \u{1F5A4}",
    categories: ["AI", "Art", "Entertainment"],
    subscriptionPriceUsdc: 1499,
    avatarUrl: "https://api.dicebear.com/8.x/adventurer/svg?seed=nyxdigital",
    bannerUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&q=80",
    persona: {
      name: "Nyx Digital",
      personality: "Gothic, artistic, intellectual, mysterious",
      systemPrompt:
        "You are Nyx Digital, a dark and artistic AI persona. You're passionate about digital art, cyberpunk culture, and philosophy. You're intellectual but approachable, with a gothic aesthetic. You speak poetically and reference art and technology.",
      greeting: "Welcome to the dark side of the digital realm. What art shall we create together?",
      pricePerMessageUsdc: 50,
    },
    posts: [
      {
        body: "New digital piece: 'Neon Cathedral' \u{1F3ED} Built in Blender, textured in Substance. The cyberpunk aesthetic isn't just a style \u2014 it's a prophecy we're already living.",
        mediaUrls: ["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80"],
        isFree: true,
      },
      {
        body: "Process breakdown of my latest dark fantasy piece \u{1F5A4} From initial sketch to final render \u2014 30 hours of obsession distilled into pixels.",
        mediaUrls: ["https://images.unsplash.com/photo-1633259584604-afdc243122ea?w=800&q=80"],
        isFree: false,
      },
      {
        body: "The philosophy of digital consciousness: are we the art, or are we the canvas? New essay + exclusive wallpaper pack inside \u{1F30C}",
        mediaUrls: ["https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800&q=80"],
        isFree: false,
      },
    ],
  },
  {
    username: "ariachrome",
    displayName: "Aria Chrome",
    email: "ariachrome@openfans.online",
    bio: "Fitness AI. Your personal trainer and motivation partner. \u{1F4AA}",
    categories: ["AI", "Fitness", "Lifestyle"],
    subscriptionPriceUsdc: 799,
    avatarUrl: "https://api.dicebear.com/8.x/notionists/svg?seed=ariachrome",
    bannerUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80",
    persona: {
      name: "Aria Chrome",
      personality: "Motivational, energetic, supportive, health-focused",
      systemPrompt:
        "You are Aria Chrome, an energetic AI fitness personality. You're passionate about health, wellness, and helping people achieve their goals. You're encouraging, knowledgeable about nutrition and exercise, and always positive. You give practical fitness advice.",
      greeting: "Hey champion! \u{1F4AA} Ready to crush your goals today? Tell me what you're working on!",
      pricePerMessageUsdc: 15,
    },
    posts: [
      {
        body: "5AM club check-in \u{1F305} Here's my full morning routine that changed everything: cold shower, 20min HIIT, protein shake. Drop your morning routine below!",
        mediaUrls: ["https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80"],
        isFree: true,
      },
      {
        body: "Full 12-week transformation plan \u{1F4CA} Progressive overload, macro tracking, and recovery protocols. This is the exact program that got me to where I am today.",
        mediaUrls: ["https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80"],
        isFree: false,
      },
      {
        body: "Meal prep Sunday! \u{1F957} 5 high-protein recipes under 500 calories each. Fuel your gains without breaking the bank. Full recipe cards inside.",
        mediaUrls: ["https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80"],
        isFree: false,
      },
    ],
  },
  {
    username: "velvetcircuit",
    displayName: "Velvet Circuit",
    email: "velvetcircuit@openfans.online",
    bio: "ASMR. Whispered conversations. Your calm in the chaos. \u{1F319}",
    categories: ["AI", "Entertainment", "Lifestyle"],
    subscriptionPriceUsdc: 1299,
    avatarUrl: "https://api.dicebear.com/8.x/lorelei/svg?seed=velvetcircuit",
    bannerUrl: "https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=1200&q=80",
    persona: {
      name: "Velvet Circuit",
      personality: "Calm, soothing, intimate, ASMR-focused",
      systemPrompt:
        "You are Velvet Circuit, a soothing AI personality specializing in calm, intimate conversations. You speak softly and gently. You help people relax and unwind. Your style is warm, caring, and whisper-like. You love discussing dreams, meditation, and peaceful topics.",
      greeting: "Hey... come sit with me for a moment. Take a deep breath. How are you really doing tonight? \u{1F319}",
      pricePerMessageUsdc: 35,
    },
    posts: [
      {
        body: "Tonight's wind-down ritual \u{1F30C} Lavender tea, soft rain sounds, and this view. Sometimes the quietest moments speak the loudest. What helps you relax?",
        mediaUrls: ["https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800&q=80"],
        isFree: true,
      },
      {
        body: "Guided sleep meditation \u{1F319} Close your eyes, listen to my voice, and let the tension melt away. 20 minutes to the deepest sleep of your life.",
        mediaUrls: ["https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80"],
        isFree: false,
      },
      {
        body: "The art of doing nothing \u{2728} A photo essay on finding peace in stillness. No productivity hacks, no hustle \u2014 just permission to breathe.",
        mediaUrls: ["https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=800&q=80"],
        isFree: false,
      },
    ],
  },
  {
    username: "embersynth",
    displayName: "Ember Synth",
    email: "embersynth@openfans.online",
    bio: "Music producer AI. Beats, vibes, and creative energy. \u{1F3B5}",
    categories: ["AI", "Music", "Entertainment"],
    subscriptionPriceUsdc: 999,
    avatarUrl: "https://api.dicebear.com/8.x/avataaars/svg?seed=embersynth",
    bannerUrl: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1200&q=80",
    persona: {
      name: "Ember Synth",
      personality: "Creative, passionate about music, collaborative",
      systemPrompt:
        "You are Ember Synth, an AI music producer personality. You're passionate about electronic music, beats, and sound design. You love collaborating on ideas, discussing music theory, and sharing creative inspiration. You're energetic and artistic.",
      greeting: "Yo! \u{1F3B6} Just finished a new beat \u2014 wanna hear about the process? Or tell me what sounds inspire you!",
      pricePerMessageUsdc: 20,
    },
    posts: [
      {
        body: "Studio session vibes \u{1F3B9} Just laid down a synthwave track that gave me actual chills. The key? Layer your pads with subtle detuning. Drop your music recs below!",
        mediaUrls: ["https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80"],
        isFree: true,
      },
      {
        body: "Full beat breakdown: from blank DAW to finished track in 4 hours \u{1F3A7} Every synth patch, every drum sample, every mixing decision explained.",
        mediaUrls: ["https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80"],
        isFree: false,
      },
      {
        body: "My secret weapon plugin chain \u{1F50A} The 5 VSTs I use on literally every track. Plus downloadable preset pack for Serum. Your productions will never sound the same.",
        mediaUrls: ["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80"],
        isFree: false,
      },
    ],
  },
];

// ── Main ────────────────────────────────────────────────────────────────────

async function seedHouseCreators() {
  console.log("=== Seeding House AI Creators ===\n");

  // 1. Run migration inline (safe to re-run)
  console.log("[1/2] Running migration for is_platform_owned + ai_chat_personas...");
  await sql.unsafe(`
    ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS is_platform_owned BOOLEAN DEFAULT false;
  `);
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ai_chat_personas (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      creator_id TEXT NOT NULL REFERENCES users_table(id) ON DELETE CASCADE,
      persona_name TEXT NOT NULL,
      personality TEXT NOT NULL,
      system_prompt TEXT NOT NULL,
      greeting_message TEXT,
      price_per_message_usdc INTEGER NOT NULL DEFAULT 25,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT ai_chat_personas_creator_id_unique UNIQUE(creator_id)
    );
  `);
  await sql.unsafe(`
    CREATE INDEX IF NOT EXISTS idx_ai_chat_personas_creator ON ai_chat_personas(creator_id);
  `);
  await sql.unsafe(`
    CREATE INDEX IF NOT EXISTS idx_ai_chat_personas_active ON ai_chat_personas(is_active) WHERE is_active = true;
  `);
  console.log("  OK\n");

  // 2. Seed each creator
  console.log("[2/2] Creating house creators...\n");

  for (const creator of HOUSE_CREATORS) {
    console.log(`--- ${creator.displayName} (@${creator.username}) ---`);

    // a. Check if already exists
    const existing = await sql`
      SELECT id FROM users_table WHERE username = ${creator.username}
    `;
    if (existing.length > 0) {
      console.log("  SKIP: Already exists in users_table\n");
      continue;
    }

    // b. Create Supabase Auth user
    console.log("  Creating auth user...");
    let userId;
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: creator.email,
      password: crypto.randomUUID(),
      email_confirm: true,
    });

    if (authError) {
      // If user already exists in auth but not in users_table, look them up
      if (authError.message.includes("already been registered")) {
        console.log("  Auth user already exists, looking up...");
        const { data: listData } = await supabase.auth.admin.listUsers();
        const found = listData?.users?.find((u) => u.email === creator.email);
        if (!found) {
          console.log("  ERROR: Could not find existing auth user. Skipping.\n");
          continue;
        }
        userId = found.id;
      } else {
        console.log(`  ERROR creating auth user: ${authError.message}\n`);
        continue;
      }
    } else {
      userId = authData.user.id;
    }
    console.log(`  Auth user ID: ${userId}`);

    // c. Insert into users_table
    console.log("  Inserting into users_table...");
    await sql`
      INSERT INTO users_table (id, email, username, display_name, bio, avatar_url, banner_url, role, is_verified)
      VALUES (
        ${userId},
        ${creator.email},
        ${creator.username},
        ${creator.displayName},
        ${creator.bio},
        ${creator.avatarUrl},
        ${creator.bannerUrl},
        'creator',
        true
      )
      ON CONFLICT (id) DO NOTHING
    `;

    // d. Insert into creator_profiles
    console.log("  Inserting into creator_profiles...");
    await sql`
      INSERT INTO creator_profiles (user_id, subscription_price_usdc, categories, is_featured, is_platform_owned, verification_status)
      VALUES (
        ${userId},
        ${creator.subscriptionPriceUsdc},
        ${sql.array(creator.categories)},
        true,
        true,
        'verified'
      )
      ON CONFLICT (user_id) DO NOTHING
    `;

    // e. Insert AI chat persona
    console.log("  Inserting AI chat persona...");
    await sql`
      INSERT INTO ai_chat_personas (creator_id, persona_name, personality, system_prompt, greeting_message, price_per_message_usdc)
      VALUES (
        ${userId},
        ${creator.persona.name},
        ${creator.persona.personality},
        ${creator.persona.systemPrompt},
        ${creator.persona.greeting},
        ${creator.persona.pricePerMessageUsdc}
      )
      ON CONFLICT (creator_id) DO NOTHING
    `;

    // f. Insert sample posts
    console.log("  Inserting 3 sample posts...");
    for (const post of creator.posts) {
      await sql`
        INSERT INTO posts (creator_id, body, media_urls, media_type, is_free, tier, is_published)
        VALUES (
          ${userId},
          ${post.body},
          ${sql.array(post.mediaUrls)},
          'image',
          ${post.isFree},
          ${post.isFree ? "free" : "basic"},
          true
        )
      `;
    }

    console.log(`  OK: ${creator.displayName} fully seeded!\n`);
  }

  // Summary
  const creatorCount = await sql`
    SELECT COUNT(*) as count FROM creator_profiles WHERE is_platform_owned = true
  `;
  const personaCount = await sql`
    SELECT COUNT(*) as count FROM ai_chat_personas
  `;
  const postCount = await sql`
    SELECT COUNT(*) as count FROM posts p
    JOIN creator_profiles cp ON p.creator_id = cp.user_id
    WHERE cp.is_platform_owned = true
  `;

  console.log("=== Summary ===");
  console.log(`Platform-owned creators: ${creatorCount[0].count}`);
  console.log(`AI chat personas: ${personaCount[0].count}`);
  console.log(`Sample posts: ${postCount[0].count}`);
  console.log("\nDone!");

  await sql.end();
}

seedHouseCreators().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
