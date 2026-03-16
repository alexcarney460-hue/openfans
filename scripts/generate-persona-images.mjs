/**
 * Generate unique AI images for all platform-owned AI creator personas
 * and update their profiles with the generated images.
 *
 * Supports three backends (in priority order):
 *   1. Replicate (FLUX 1.1 Pro) — best quality
 *   2. Together AI (FLUX.1 Schnell Free) — free tier
 *   3. Picsum placeholder — demo mode, no API key needed
 *
 * Usage:
 *   node scripts/generate-persona-images.mjs
 *   node scripts/generate-persona-images.mjs --dry-run
 *   node scripts/generate-persona-images.mjs --limit 3
 *   node scripts/generate-persona-images.mjs --backend picsum
 *   node scripts/generate-persona-images.mjs --username lunafrost
 */

import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load .env.local ─────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = resolve(__dirname, "../.env.local");
  try {
    const envFile = readFileSync(envPath, "utf8");
    const env = {};
    for (const line of envFile.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const val = trimmed.slice(eqIndex + 1).trim();
      env[key] = val;
    }
    return env;
  } catch {
    console.error("Could not read .env.local");
    process.exit(1);
  }
}

const envVars = loadEnv();

// ── Config ──────────────────────────────────────────────────────────────────

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;
const DATABASE_URL = envVars.DATABASE_URL;
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN || envVars.REPLICATE_API_TOKEN || "";
const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY || envVars.TOGETHER_API_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const sql = postgres(DATABASE_URL, { ssl: "require" });

// ── CLI Args ────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    dryRun: false,
    limit: 0,
    backend: "",
    username: "",
  };
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--dry-run":
        opts.dryRun = true;
        break;
      case "--limit":
        opts.limit = parseInt(args[++i], 10);
        break;
      case "--backend":
        opts.backend = args[++i];
        break;
      case "--username":
        opts.username = args[++i];
        break;
    }
  }
  return opts;
}

const opts = parseArgs();

// ── Backend Detection ───────────────────────────────────────────────────────

function detectBackend() {
  if (opts.backend) return opts.backend;
  if (REPLICATE_API_TOKEN) return "replicate";
  if (TOGETHER_API_KEY) return "together";
  return "picsum";
}

const BACKEND = detectBackend();

// ── Rate limiting ───────────────────────────────────────────────────────────

const DELAY_MS = {
  replicate: 2000,
  together: 1000,
  picsum: 100,
};

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Cost tracking ───────────────────────────────────────────────────────────

const COST_PER_IMAGE = {
  replicate: 0.04, // ~$0.04 per FLUX 1.1 Pro image
  together: 0.0,   // free tier
  picsum: 0.0,
};

let totalImagesGenerated = 0;

// ── Niche-specific prompt templates ─────────────────────────────────────────

const NICHE_PROMPTS = {
  fashion: {
    avatar: "stunning fashion portrait, editorial style, designer clothing, perfectly lit studio, high fashion makeup, confident expression, professional modeling pose, soft directional lighting, clean background",
    banner: "luxury fashion editorial set, designer clothing rack, glamorous backdrop, high-end boutique atmosphere, golden hour lighting, wide cinematic shot",
    content: [
      "editorial fashion photoshoot, dramatic lighting, haute couture outfit, artistic composition, magazine quality",
      "street style fashion photography, urban setting, trendy outfit, natural light, candid elegance",
      "luxury lifestyle flat lay, designer accessories, premium fabrics, aesthetic arrangement, top-down shot",
    ],
  },
  art: {
    avatar: "digital artist portrait, surrounded by colorful art, creative studio environment, artistic lighting, paint splashes, modern aesthetic",
    banner: "vibrant art studio panorama, colorful canvases, creative workspace, paint supplies, inspirational atmosphere, wide angle",
    content: [
      "stunning digital artwork, vivid colors, abstract composition, gallery quality, high detail",
      "creative process behind the scenes, artist workspace, works in progress, artistic tools, intimate atmosphere",
      "art exhibition display, modern gallery, spotlit artwork, clean white walls, sophisticated presentation",
    ],
  },
  fitness: {
    avatar: "athletic fitness portrait, modern gym background, premium athletic wear, confident powerful pose, dramatic lighting, professional sports photography",
    banner: "modern luxury gym interior, professional equipment, motivational atmosphere, dramatic lighting, wide panoramic shot",
    content: [
      "dynamic workout photography, athletic movement, gym setting, high energy, professional sports photography",
      "healthy meal preparation, colorful nutritious food, clean kitchen, aesthetic food photography",
      "outdoor fitness session, golden hour, athletic silhouette, scenic backdrop, motivational energy",
    ],
  },
  gaming: {
    avatar: "cyberpunk gamer portrait, neon lighting, RGB setup glow, gaming headset, futuristic aesthetic, dramatic shadows",
    banner: "epic gaming setup, RGB lighting, multiple monitors, neon glow, cyberpunk atmosphere, wide cinematic shot",
    content: [
      "intense gaming moment, dramatic screen glow, focused expression, esports atmosphere, cinematic",
      "retro gaming collection, vintage consoles, nostalgic setup, warm lighting, collector aesthetic",
      "gaming tournament atmosphere, competitive energy, arena lighting, dramatic moment, esports",
    ],
  },
  music: {
    avatar: "musician portrait, recording studio, artistic lighting, creative atmosphere, headphones, passionate expression, moody aesthetic",
    banner: "professional recording studio, mixing console, studio monitors, warm lighting, musical instruments, wide panoramic",
    content: [
      "live music performance, dramatic stage lighting, passionate musician, concert atmosphere, cinematic",
      "analog synthesizer setup, electronic music production, neon lights, futuristic studio, creative workspace",
      "vinyl records and headphones, warm lighting, music lover aesthetic, cozy listening session",
    ],
  },
  lifestyle: {
    avatar: "lifestyle influencer portrait, natural beauty, warm golden light, relaxed confidence, aesthetic background, editorial quality",
    banner: "luxury lifestyle scene, premium interior design, aesthetic decor, warm ambient lighting, aspirational atmosphere, wide shot",
    content: [
      "aesthetic coffee shop moment, warm tones, lifestyle photography, candid elegance, beautiful interior",
      "sunset rooftop scene, city skyline, golden hour, relaxed luxury, atmospheric mood",
      "curated lifestyle flat lay, premium products, aesthetic arrangement, soft lighting, minimalist elegance",
    ],
  },
  tech: {
    avatar: "tech visionary portrait, modern office, holographic displays, futuristic lighting, innovative aesthetic, clean professional look",
    banner: "futuristic tech workspace, holographic interfaces, sleek gadgets, blue accent lighting, panoramic wide shot",
    content: [
      "cutting edge technology showcase, futuristic gadgets, clean minimal design, product photography",
      "coding environment, multiple monitors, clean desk setup, ambient lighting, developer aesthetic",
      "AI and robotics concept, futuristic lab, advanced technology, cinematic lighting, innovation",
    ],
  },
  anime: {
    avatar: "anime-style character portrait, vibrant colors, detailed illustration, expressive eyes, beautiful art style, high quality digital art",
    banner: "anime cityscape, vibrant neon colors, detailed illustration, Japanese urban aesthetic, wide cinematic composition",
    content: [
      "detailed anime character illustration, dynamic pose, colorful background, professional manga quality",
      "anime landscape artwork, beautiful scenery, ethereal lighting, studio ghibli inspired, painterly",
      "chibi character design, cute aesthetic, pastel colors, kawaii style, detailed illustration",
    ],
  },
  cosplay: {
    avatar: "cosplay portrait, detailed costume craftsmanship, character transformation, professional photography, dramatic lighting",
    banner: "cosplay workshop panorama, costume materials, work in progress props, creative atmosphere, wide angle",
    content: [
      "epic cosplay photoshoot, detailed armor costume, dramatic pose, cinematic lighting, convention quality",
      "cosplay craft process, EVA foam work, painting details, workshop atmosphere, behind the scenes",
      "group cosplay scene, matching characters, convention atmosphere, fan gathering, energetic",
    ],
  },
  travel: {
    avatar: "travel photographer portrait, scenic backdrop, adventurous spirit, natural lighting, explorer aesthetic, wanderlust vibe",
    banner: "breathtaking landscape panorama, dramatic scenery, golden hour, travel destination, wide cinematic vista",
    content: [
      "exotic travel destination, beautiful architecture, golden hour, professional travel photography",
      "adventure travel scene, mountain landscape, dramatic sky, explorer silhouette, epic scale",
      "tropical beach paradise, crystal water, palm trees, sunset colors, dreamy atmosphere",
    ],
  },
  wellness: {
    avatar: "serene wellness portrait, natural setting, peaceful expression, soft golden light, meditation aesthetic, calm energy",
    banner: "tranquil zen garden panorama, peaceful water features, natural elements, serene atmosphere, wide panoramic",
    content: [
      "meditation scene, peaceful setting, candles and crystals, soft warm lighting, mindfulness aesthetic",
      "yoga pose in nature, sunrise light, flexible grace, outdoor wellness, inspiring tranquility",
      "holistic wellness arrangement, natural herbs, essential oils, zen stones, healing aesthetic",
    ],
  },
  photography: {
    avatar: "photographer portrait with camera, artistic lighting, creative eye, professional equipment, moody atmospheric",
    banner: "stunning landscape photography, golden hour, dramatic composition, professional quality, wide panoramic",
    content: [
      "award-winning photograph, perfect composition, dramatic lighting, storytelling through image",
      "photography equipment flat lay, premium cameras and lenses, professional gear, aesthetic arrangement",
      "black and white fine art photography, dramatic contrast, emotional depth, gallery quality",
    ],
  },
};

// Fallback for unknown niches
const DEFAULT_PROMPTS = NICHE_PROMPTS.lifestyle;

// ── Persona-specific keyword enrichment ─────────────────────────────────────

function enrichPrompt(basePrompt, persona) {
  const keywords = [];
  if (persona.display_name) keywords.push(persona.display_name);
  if (persona.bio) {
    // Extract descriptive words from bio
    const bioKeywords = persona.bio
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 4)
      .slice(0, 5)
      .join(", ");
    if (bioKeywords) keywords.push(bioKeywords);
  }
  const enrichment = keywords.length > 0 ? `, inspired by: ${keywords.join(", ")}` : "";
  return `${basePrompt}${enrichment}, 8k resolution, photorealistic, award-winning photography`;
}

// ── Image Generation Backends ───────────────────────────────────────────────

async function generateWithReplicate(prompt, aspectRatio = "1:1") {
  const response = await fetch(
    "https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
        Prefer: "wait",
      },
      body: JSON.stringify({
        input: {
          prompt,
          aspect_ratio: aspectRatio,
          output_format: "jpg",
          output_quality: 90,
        },
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Replicate API error ${response.status}: ${errText}`);
  }

  let result = await response.json();

  // If not using Prefer: wait, poll for completion
  if (result.status && result.status !== "succeeded" && result.status !== "failed") {
    let attempts = 0;
    const maxAttempts = 60; // 2 min max
    while (result.status !== "succeeded" && result.status !== "failed" && attempts < maxAttempts) {
      await delay(2000);
      const pollRes = await fetch(result.urls.get, {
        headers: { Authorization: `Bearer ${REPLICATE_API_TOKEN}` },
      });
      result = await pollRes.json();
      attempts++;
    }
  }

  if (result.status === "failed") {
    throw new Error(`Replicate generation failed: ${result.error || "unknown error"}`);
  }

  // FLUX output is a single URL string or array
  const output = result.output;
  if (Array.isArray(output)) return output[0];
  return output;
}

async function generateWithTogether(prompt, width = 1024, height = 1024) {
  const response = await fetch("https://api.together.xyz/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOGETHER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "black-forest-labs/FLUX.1-schnell-Free",
      prompt,
      width,
      height,
      n: 1,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Together API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  if (!data.data || !data.data[0]) {
    throw new Error("Together API returned no image data");
  }

  // Together returns either a URL or base64
  const imgData = data.data[0];
  if (imgData.url) return imgData.url;
  if (imgData.b64_json) return `data:image/png;base64,${imgData.b64_json}`;
  throw new Error("Together API returned unexpected format");
}

function generatePlaceholder(seed, width = 1024, height = 1024) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${width}/${height}`;
}

// ── Unified image generation ────────────────────────────────────────────────

async function generateImage(prompt, { type, username, index }) {
  const seed = `${username}-${type}-${index}`;

  switch (BACKEND) {
    case "replicate": {
      const aspectRatio =
        type === "avatar" ? "1:1" : type === "banner" ? "16:9" : "4:5";
      const url = await generateWithReplicate(prompt, aspectRatio);
      totalImagesGenerated++;
      return url;
    }
    case "together": {
      const dims =
        type === "avatar"
          ? { w: 1024, h: 1024 }
          : type === "banner"
            ? { w: 1440, h: 810 }
            : { w: 832, h: 1024 };
      const url = await generateWithTogether(prompt, dims.w, dims.h);
      totalImagesGenerated++;
      return url;
    }
    case "picsum":
    default: {
      const dims =
        type === "avatar"
          ? { w: 512, h: 512 }
          : type === "banner"
            ? { w: 1200, h: 400 }
            : { w: 640, h: 800 };
      totalImagesGenerated++;
      return generatePlaceholder(seed, dims.w, dims.h);
    }
  }
}

// ── Download image to buffer ────────────────────────────────────────────────

async function downloadImage(url) {
  // Handle base64 data URIs from Together
  if (url.startsWith("data:")) {
    const base64 = url.split(",")[1];
    return Buffer.from(base64, "base64");
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download image: ${res.status}`);
  const arrayBuf = await res.arrayBuffer();
  return Buffer.from(arrayBuf);
}

// ── Upload to Supabase Storage ──────────────────────────────────────────────

const STORAGE_BUCKET = "posts";

async function ensureBucket() {
  // Try to create the bucket if it doesn't exist
  const { error } = await supabase.storage.createBucket(STORAGE_BUCKET, {
    public: true,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    fileSizeLimit: 10 * 1024 * 1024, // 10MB
  });

  if (error && !error.message.includes("already exists")) {
    console.warn(`  Warning: Could not create bucket "${STORAGE_BUCKET}": ${error.message}`);
  }
}

async function uploadToStorage(imageBuffer, storagePath) {
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(storagePath, imageBuffer, {
    contentType: "image/jpeg",
    upsert: true,
  });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

// ── Determine niche from categories ─────────────────────────────────────────

function detectNiche(categories) {
  if (!categories || !Array.isArray(categories)) return "lifestyle";

  const cats = categories.map((c) => c.toLowerCase());
  const nicheMap = {
    fashion: ["fashion"],
    art: ["art"],
    fitness: ["fitness"],
    gaming: ["gaming"],
    music: ["music"],
    tech: ["tech"],
    anime: ["anime"],
    cosplay: ["cosplay"],
    travel: ["travel"],
    wellness: ["wellness"],
    photography: ["photography"],
  };

  for (const [niche, keywords] of Object.entries(nicheMap)) {
    if (cats.some((c) => keywords.some((k) => c.includes(k)))) {
      return niche;
    }
  }

  return "lifestyle";
}

// ── Fetch personas from database ────────────────────────────────────────────

async function fetchPersonas() {
  const rows = await sql`
    SELECT
      u.id,
      u.username,
      u.display_name,
      u.bio,
      u.avatar_url,
      u.banner_url,
      cp.categories
    FROM users_table u
    JOIN creator_profiles cp ON cp.user_id = u.id
    WHERE cp.is_platform_owned = true
    ORDER BY u.username
  `;
  return rows;
}

// ── Fetch posts for a persona ───────────────────────────────────────────────

async function fetchPosts(userId) {
  const rows = await sql`
    SELECT id, body, media_urls
    FROM posts
    WHERE creator_id = ${userId}
    ORDER BY created_at ASC
    LIMIT 3
  `;
  return rows;
}

// ── Process a single persona ────────────────────────────────────────────────

async function processPersona(persona, index, total) {
  const { id, username, display_name, bio, categories } = persona;
  const niche = detectNiche(categories);
  const prompts = NICHE_PROMPTS[niche] || DEFAULT_PROMPTS;

  console.log(`\n[${ index + 1}/${total}] ${display_name} (@${username}) — niche: ${niche}`);
  console.log(`  Backend: ${BACKEND}`);

  if (opts.dryRun) {
    console.log("  [DRY RUN] Would generate:");
    console.log(`    - Avatar (1:1): ${enrichPrompt(prompts.avatar, persona).slice(0, 80)}...`);
    console.log(`    - Banner (16:9): ${enrichPrompt(prompts.banner, persona).slice(0, 80)}...`);
    for (let i = 0; i < 3; i++) {
      console.log(`    - Content ${i + 1} (4:5): ${enrichPrompt(prompts.content[i], persona).slice(0, 80)}...`);
    }
    return { success: true, dryRun: true };
  }

  const results = { avatar: null, banner: null, content: [] };

  try {
    // 1. Generate avatar
    console.log("  Generating avatar...");
    const avatarPrompt = enrichPrompt(prompts.avatar, persona);
    const avatarUrl = await generateImage(avatarPrompt, { type: "avatar", username, index: 0 });
    await delay(DELAY_MS[BACKEND]);

    // Download and upload avatar
    const avatarBuffer = await downloadImage(avatarUrl);
    const avatarPath = `ai-content/${username}/avatar.jpg`;
    results.avatar = await uploadToStorage(avatarBuffer, avatarPath);
    console.log(`  Avatar uploaded: ${results.avatar}`);

    // 2. Generate banner
    console.log("  Generating banner...");
    const bannerPrompt = enrichPrompt(prompts.banner, persona);
    const bannerGenUrl = await generateImage(bannerPrompt, { type: "banner", username, index: 0 });
    await delay(DELAY_MS[BACKEND]);

    const bannerBuffer = await downloadImage(bannerGenUrl);
    const bannerPath = `ai-content/${username}/banner.jpg`;
    results.banner = await uploadToStorage(bannerBuffer, bannerPath);
    console.log(`  Banner uploaded: ${results.banner}`);

    // 3. Generate 3 content images
    for (let i = 0; i < 3; i++) {
      console.log(`  Generating content image ${i + 1}/3...`);
      const contentPrompt = enrichPrompt(prompts.content[i], persona);
      const contentUrl = await generateImage(contentPrompt, { type: "content", username, index: i });
      await delay(DELAY_MS[BACKEND]);

      const contentBuffer = await downloadImage(contentUrl);
      const contentPath = `ai-content/${username}/content-${i + 1}.jpg`;
      const publicUrl = await uploadToStorage(contentBuffer, contentPath);
      results.content.push(publicUrl);
      console.log(`  Content ${i + 1} uploaded: ${publicUrl}`);
    }

    // 4. Update database
    console.log("  Updating database...");

    // Update avatar_url
    await sql`
      UPDATE users_table
      SET avatar_url = ${results.avatar}
      WHERE id = ${id}
    `;

    // Update banner_url
    await sql`
      UPDATE users_table
      SET banner_url = ${results.banner}
      WHERE id = ${id}
    `;

    // Update posts with new content images
    const posts = await fetchPosts(id);
    for (let i = 0; i < Math.min(posts.length, results.content.length); i++) {
      await sql`
        UPDATE posts
        SET media_urls = ${sql.array([results.content[i]])}
        WHERE id = ${posts[i].id}
      `;
    }

    // Also update the ai_creator_directory entry if it exists
    await sql`
      UPDATE ai_creator_directory
      SET avatar_url = ${results.avatar},
          banner_url = ${results.banner}
      WHERE username = ${username}
    `;

    console.log(`  OK: ${display_name} fully updated with ${BACKEND} images!`);
    return { success: true };
  } catch (err) {
    console.error(`  ERROR: ${err.message}`);
    return { success: false, error: err.message };
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=============================================================");
  console.log("  OpenFans AI Persona Image Generator");
  console.log("=============================================================");
  console.log(`  Backend: ${BACKEND}`);
  console.log(`  Dry run: ${opts.dryRun}`);
  console.log(`  Limit:   ${opts.limit || "all"}`);
  console.log(`  Filter:  ${opts.username || "none"}`);
  console.log("=============================================================\n");

  // Ensure storage bucket exists
  if (!opts.dryRun) {
    await ensureBucket();
  }

  // Fetch personas
  let personas = await fetchPersonas();
  console.log(`Found ${personas.length} platform-owned AI creators.\n`);

  if (personas.length === 0) {
    console.log("No platform-owned creators found. Run seed scripts first.");
    await sql.end();
    return;
  }

  // Apply filters
  if (opts.username) {
    personas = personas.filter((p) => p.username === opts.username);
    if (personas.length === 0) {
      console.log(`No persona found with username "${opts.username}".`);
      await sql.end();
      return;
    }
  }

  if (opts.limit > 0) {
    personas = personas.slice(0, opts.limit);
  }

  console.log(`Processing ${personas.length} persona(s)...\n`);

  // Process each persona
  const results = { success: 0, failed: 0, skipped: 0 };

  for (let i = 0; i < personas.length; i++) {
    const result = await processPersona(personas[i], i, personas.length);
    if (result.dryRun) {
      results.skipped++;
    } else if (result.success) {
      results.success++;
    } else {
      results.failed++;
    }
  }

  // Summary
  console.log("\n=============================================================");
  console.log("  SUMMARY");
  console.log("=============================================================");
  console.log(`  Total personas processed: ${personas.length}`);
  console.log(`  Successful: ${results.success}`);
  console.log(`  Failed:     ${results.failed}`);
  console.log(`  Skipped:    ${results.skipped}`);
  console.log(`  Images generated: ${totalImagesGenerated}`);
  console.log(`  Backend used: ${BACKEND}`);

  const totalCost = totalImagesGenerated * COST_PER_IMAGE[BACKEND];
  if (totalCost > 0) {
    console.log(`  Estimated cost: $${totalCost.toFixed(2)}`);
  } else {
    console.log(`  Estimated cost: $0.00 (free)`);
  }

  console.log("=============================================================");
  console.log("Done!");

  await sql.end();
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
