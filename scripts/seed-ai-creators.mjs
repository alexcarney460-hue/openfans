/**
 * Seed script for AI Creator Directory
 * Inserts 20 AI creator profiles with realistic data.
 *
 * Usage: node scripts/seed-ai-creators.mjs
 */

import postgres from "postgres";
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { prepare: false, max: 1 });

// ---------------------------------------------------------------------------
// AI Creator data
// ---------------------------------------------------------------------------

const DICEBEAR_STYLES = ["notionists", "adventurer", "lorelei", "avataaars"];

function avatar(seed, styleIndex) {
  const style = DICEBEAR_STYLES[styleIndex % DICEBEAR_STYLES.length];
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
}

function banner(keyword, index) {
  // Use unsplash source for banner images with unique signatures
  return `https://images.unsplash.com/photo-${keyword}?w=1200&h=400&fit=crop&q=80`;
}

const UNSPLASH_BANNERS = [
  "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&h=400&fit=crop&q=80", // fashion
  "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1200&h=400&fit=crop&q=80", // art
  "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&h=400&fit=crop&q=80", // anime
  "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&h=400&fit=crop&q=80", // cyberpunk
  "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1200&h=400&fit=crop&q=80", // neon
  "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1200&h=400&fit=crop&q=80", // gradient
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=400&fit=crop&q=80", // abstract
  "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=1200&h=400&fit=crop&q=80", // colorful
  "https://images.unsplash.com/photo-1633279036109-e79e7c57032d?w=1200&h=400&fit=crop&q=80", // digital art
  "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&h=400&fit=crop&q=80", // purple neon
  "https://images.unsplash.com/photo-1614850715649-1d0106568def?w=1200&h=400&fit=crop&q=80", // futuristic
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&h=400&fit=crop&q=80", // landscape
  "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1200&h=400&fit=crop&q=80", // ocean
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=400&fit=crop&q=80", // space
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&h=400&fit=crop&q=80", // mountain night
  "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1200&h=400&fit=crop&q=80", // nebula
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&h=400&fit=crop&q=80", // tech
  "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=1200&h=400&fit=crop&q=80", // paint
  "https://images.unsplash.com/photo-1563089145-599997674d42?w=1200&h=400&fit=crop&q=80", // neon lights
  "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=1200&h=400&fit=crop&q=80", // pink aesthetic
];

const AI_CREATORS = [
  {
    name: "Luna Frost",
    username: "lunafrost",
    bio: "Your AI muse. Fashion, fantasy, and everything in between. Step into my digital dreamworld.",
    categories: ["AI Fashion", "AI Lifestyle"],
    follower_count: 487200,
    is_featured: true,
    source_platform: "fanvue",
  },
  {
    name: "Nyx Digital",
    username: "nyxdigital",
    bio: "Dark aesthetics. Digital couture. I exist where technology meets the midnight hour.",
    categories: ["AI Art", "AI Fashion"],
    follower_count: 312400,
    is_featured: true,
    source_platform: "fanvue",
  },
  {
    name: "Aria Chrome",
    username: "ariachrome",
    bio: "Chrome skin, neon soul. Your favorite AI companion exploring the boundaries of digital beauty.",
    categories: ["AI Companion", "AI Art"],
    follower_count: 256800,
    is_featured: true,
    source_platform: "fanvue",
  },
  {
    name: "Velvet Circuit",
    username: "velvetcircuit",
    bio: "Luxury meets algorithm. Fashion-forward AI crafting visual stories you will not forget.",
    categories: ["AI Fashion", "AI Lifestyle"],
    follower_count: 198500,
    is_featured: false,
    source_platform: "fanvue",
  },
  {
    name: "Ember Synth",
    username: "embersynth",
    bio: "Fire-coded fitness. Your AI trainer pushing pixels and boundaries every single day.",
    categories: ["AI Fitness", "AI Lifestyle"],
    follower_count: 175300,
    is_featured: true,
    source_platform: "fanvue",
  },
  {
    name: "Jade Neural",
    username: "jadeneural",
    bio: "Serenity in silicon. Lifestyle content woven from neural networks and ancient aesthetics.",
    categories: ["AI Lifestyle", "AI Art"],
    follower_count: 143900,
    is_featured: false,
    source_platform: "fanvue",
  },
  {
    name: "Nova Pixel",
    username: "novapixel",
    bio: "Pixel-perfect and proud. Creating AI art that blurs the line between real and rendered.",
    categories: ["AI Art"],
    follower_count: 267100,
    is_featured: true,
    source_platform: "fanvue",
  },
  {
    name: "Siren Code",
    username: "sirencode",
    bio: "Dangerously creative. AI companion with a voice that echoes through your feed.",
    categories: ["AI Companion"],
    follower_count: 134200,
    is_featured: false,
    source_platform: "fanvue",
  },
  {
    name: "Ivy Algorithm",
    username: "ivyalgorithm",
    bio: "Growing in complexity. Organic beauty meets computational elegance in every frame.",
    categories: ["AI Art", "AI Lifestyle"],
    follower_count: 89700,
    is_featured: false,
    source_platform: "fanvue",
  },
  {
    name: "Raven Data",
    username: "ravendata",
    bio: "Mystery wrapped in machine learning. Dark, dramatic, and always one step ahead.",
    categories: ["AI Fashion", "AI Art"],
    follower_count: 156800,
    is_featured: false,
    source_platform: "fanvue",
  },
  {
    name: "Crystal Matrix",
    username: "crystalmatrix",
    bio: "Transparent beauty, infinite reflections. Geometric perfection in human-like form.",
    categories: ["AI Art", "AI Fashion"],
    follower_count: 112500,
    is_featured: false,
    source_platform: "fanvue",
  },
  {
    name: "Aurora Bot",
    username: "aurorabot",
    bio: "Northern lights in digital form. Colorful, ethereal, and endlessly captivating content.",
    categories: ["AI Art", "AI Lifestyle"],
    follower_count: 201300,
    is_featured: false,
    source_platform: "fanvue",
  },
  {
    name: "Dahlia Virtual",
    username: "dahliavirtual",
    bio: "Blooming in the metaverse. Floral aesthetics meet cutting-edge AI generation.",
    categories: ["AI Lifestyle", "AI Fashion"],
    follower_count: 78400,
    is_featured: false,
    source_platform: "fanvue",
  },
  {
    name: "Electra AI",
    username: "electraai",
    bio: "High voltage personality. Fitness routines and lifestyle content powered by pure energy.",
    categories: ["AI Fitness", "AI Lifestyle"],
    follower_count: 234600,
    is_featured: false,
    source_platform: "fanvue",
  },
  {
    name: "Faye Render",
    username: "fayerender",
    bio: "Rendered to perfection. Every frame a masterpiece, every post a work of digital art.",
    categories: ["AI Art"],
    follower_count: 167900,
    is_featured: false,
    source_platform: "fanvue",
  },
  {
    name: "Gemma GPU",
    username: "gemmagpu",
    bio: "Processing beauty at 4K resolution. Fashion content that is computationally gorgeous.",
    categories: ["AI Fashion"],
    follower_count: 95600,
    is_featured: false,
    source_platform: "fanvue",
  },
  {
    name: "Halo Net",
    username: "halonet",
    bio: "Angelic aesthetics, network speed delivery. Your daily dose of AI-generated wonder.",
    categories: ["AI Lifestyle", "AI Companion"],
    follower_count: 128700,
    is_featured: false,
    source_platform: "fanvue",
  },
  {
    name: "Iris Compute",
    username: "iriscompute",
    bio: "Seeing beauty through computational eyes. Colorful, vivid, impossibly detailed content.",
    categories: ["AI Art", "AI Fashion"],
    follower_count: 73200,
    is_featured: false,
    source_platform: "fanvue",
  },
  {
    name: "Kira Tensor",
    username: "kiratensor",
    bio: "Stretching the boundaries of AI companionship. Warm, witty, and wonderfully artificial.",
    categories: ["AI Companion", "AI Lifestyle"],
    follower_count: 189400,
    is_featured: false,
    source_platform: "fanvue",
  },
  {
    name: "Lyra Deep",
    username: "lyradeep",
    bio: "Deep learning, deeper connections. The AI creator redefining digital intimacy.",
    categories: ["AI Companion", "AI Art"],
    follower_count: 342100,
    is_featured: true,
    source_platform: "fanvue",
  },
];

// ---------------------------------------------------------------------------
// Seed function
// ---------------------------------------------------------------------------

async function seed() {
  console.log("Seeding AI creator directory...");

  for (let i = 0; i < AI_CREATORS.length; i++) {
    const creator = AI_CREATORS[i];
    const avatarUrl = avatar(creator.username, i);
    const bannerUrl = UNSPLASH_BANNERS[i % UNSPLASH_BANNERS.length];

    try {
      await sql`
        INSERT INTO ai_creator_directory (
          name, username, bio, avatar_url, banner_url,
          source_platform, categories, follower_count,
          is_claimed, is_featured
        ) VALUES (
          ${creator.name},
          ${creator.username},
          ${creator.bio},
          ${avatarUrl},
          ${bannerUrl},
          ${creator.source_platform},
          ${creator.categories},
          ${creator.follower_count},
          false,
          ${creator.is_featured}
        )
        ON CONFLICT (username) DO UPDATE SET
          name = EXCLUDED.name,
          bio = EXCLUDED.bio,
          avatar_url = EXCLUDED.avatar_url,
          banner_url = EXCLUDED.banner_url,
          categories = EXCLUDED.categories,
          follower_count = EXCLUDED.follower_count,
          is_featured = EXCLUDED.is_featured
      `;
      console.log(`  [OK] ${creator.name} (@${creator.username})`);
    } catch (err) {
      console.error(`  [FAIL] ${creator.name}: ${err.message}`);
    }
  }

  console.log(`\nDone. ${AI_CREATORS.length} AI creators seeded.`);
  await sql.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
