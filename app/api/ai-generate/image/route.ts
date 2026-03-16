import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/utils/api/auth";
import { db } from "@/utils/db/db";
import { usersTable } from "@/utils/db/schema";
import { eq, sql } from "drizzle-orm";

// -- Types --

interface GenerateImageRequest {
  readonly prompt: string;
  readonly style?: string;
  readonly aspect_ratio?: string;
  readonly negative_prompt?: string;
}

const VALID_STYLES = new Set([
  "photorealistic",
  "anime",
  "digital_art",
  "fashion",
  "portrait",
]);

const VALID_ASPECT_RATIOS = new Set(["1:1", "4:5", "16:9", "9:16"]);

const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_HOURS = 1;

// Style-to-prompt-suffix mapping for enhanced generation quality
const STYLE_PROMPTS: Record<string, string> = {
  photorealistic:
    "photorealistic, ultra detailed, professional photography, natural lighting, 8k",
  anime:
    "anime style, high quality anime art, vibrant colors, detailed illustration",
  digital_art:
    "digital art, trending on artstation, highly detailed, concept art",
  fashion:
    "fashion photography, editorial style, studio lighting, vogue magazine quality",
  portrait:
    "portrait photography, professional headshot, shallow depth of field, studio lighting",
};

// Aspect ratio to picsum dimensions mapping
const ASPECT_DIMENSIONS: Record<string, { w: number; h: number }> = {
  "1:1": { w: 1024, h: 1024 },
  "4:5": { w: 820, h: 1024 },
  "16:9": { w: 1024, h: 576 },
  "9:16": { w: 576, h: 1024 },
};

// -- Helpers --

function buildEnhancedPrompt(prompt: string, style?: string): string {
  const base = prompt.trim();
  if (style && STYLE_PROMPTS[style]) {
    return `${base}, ${STYLE_PROMPTS[style]}`;
  }
  return base;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

async function generatePlaceholder(
  prompt: string,
  aspectRatio: string,
): Promise<string> {
  const dims = ASPECT_DIMENSIONS[aspectRatio] ?? ASPECT_DIMENSIONS["1:1"];
  const seed = hashString(prompt);
  return `https://picsum.photos/seed/${seed}/${dims.w}/${dims.h}`;
}

async function generateWithReplicate(
  prompt: string,
  aspectRatio: string,
  negativePrompt?: string,
): Promise<string> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    throw new Error("REPLICATE_API_TOKEN not configured");
  }

  // Create prediction
  const createRes = await fetch(
    "https://api.replicate.com/v1/predictions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "black-forest-labs/flux-1.1-pro",
        input: {
          prompt,
          aspect_ratio: aspectRatio,
          ...(negativePrompt ? { negative_prompt: negativePrompt } : {}),
        },
      }),
    },
  );

  if (!createRes.ok) {
    const errBody = await createRes.text().catch(() => "Unknown error");
    throw new Error(`Replicate API error: ${createRes.status} - ${errBody}`);
  }

  const prediction = await createRes.json();

  // Poll for completion (max 120 seconds)
  const maxPolls = 60;
  const pollInterval = 2000;

  for (let i = 0; i < maxPolls; i++) {
    await new Promise((resolve) => setTimeout(resolve, pollInterval));

    const pollRes = await fetch(
      `https://api.replicate.com/v1/predictions/${prediction.id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (!pollRes.ok) {
      continue;
    }

    const result = await pollRes.json();

    if (result.status === "succeeded") {
      // Flux returns output as a string URL or array
      const output = result.output;
      if (typeof output === "string") {
        return output;
      }
      if (Array.isArray(output) && output.length > 0) {
        return output[0];
      }
      throw new Error("Unexpected output format from Replicate");
    }

    if (result.status === "failed" || result.status === "canceled") {
      throw new Error(
        `Image generation ${result.status}: ${result.error ?? "Unknown error"}`,
      );
    }
  }

  throw new Error("Image generation timed out after 120 seconds");
}

async function generateWithTogether(
  prompt: string,
  aspectRatio: string,
): Promise<string> {
  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) {
    throw new Error("TOGETHER_API_KEY not configured");
  }

  const dims = ASPECT_DIMENSIONS[aspectRatio] ?? ASPECT_DIMENSIONS["1:1"];

  const res = await fetch("https://api.together.xyz/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "black-forest-labs/FLUX.1-schnell-Free",
      prompt,
      width: dims.w,
      height: dims.h,
      steps: 4,
      n: 1,
      response_format: "url",
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "Unknown error");
    throw new Error(`Together API error: ${res.status} - ${errBody}`);
  }

  const data = await res.json();
  const url = data?.data?.[0]?.url;
  if (!url) {
    throw new Error("No image URL returned from Together API");
  }

  return url;
}

// -- Route Handlers --

export async function GET(request: NextRequest) {
  const { user, error: authError } = await getAuthenticatedUser();
  if (authError) return authError;

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10), 50);

  try {
    const rows = await db.execute(
      sql`SELECT id, prompt, style, result_url, status, created_at
          FROM ai_generations
          WHERE creator_id = ${user.id}
          ORDER BY created_at DESC
          LIMIT ${limit}`,
    );

    return NextResponse.json({ data: rows });
  } catch (err) {
    console.error("Failed to load AI generation history:", err);
    return NextResponse.json({ data: [] });
  }
}

export async function POST(request: NextRequest) {
  // 1. Auth
  const { user, error: authError } = await getAuthenticatedUser();
  if (authError) return authError;

  // 2. Verify creator role
  const dbUser = await db
    .select({ role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, user.id))
    .limit(1);

  if (
    dbUser.length === 0 ||
    (dbUser[0].role !== "creator" && dbUser[0].role !== "admin")
  ) {
    return NextResponse.json(
      { error: "Only creators can generate AI content", code: "CREATOR_REQUIRED" },
      { status: 403 },
    );
  }

  // 3. Parse and validate input
  let body: GenerateImageRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const { prompt, style, aspect_ratio, negative_prompt } = body;

  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    return NextResponse.json(
      { error: "Prompt is required" },
      { status: 400 },
    );
  }

  if (prompt.trim().length > 2000) {
    return NextResponse.json(
      { error: "Prompt must be 2000 characters or less" },
      { status: 400 },
    );
  }

  if (style && !VALID_STYLES.has(style)) {
    return NextResponse.json(
      { error: `Invalid style. Must be one of: ${Array.from(VALID_STYLES).join(", ")}` },
      { status: 400 },
    );
  }

  const resolvedAspectRatio = aspect_ratio ?? "1:1";
  if (!VALID_ASPECT_RATIOS.has(resolvedAspectRatio)) {
    return NextResponse.json(
      { error: `Invalid aspect ratio. Must be one of: ${Array.from(VALID_ASPECT_RATIOS).join(", ")}` },
      { status: 400 },
    );
  }

  // 4. Rate limiting check
  const oneHourAgo = new Date(
    Date.now() - RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000,
  );

  const rateLimitResult = await db.execute(
    sql`SELECT COUNT(*)::int as count FROM ai_generations
        WHERE creator_id = ${user.id}
        AND created_at > ${oneHourAgo.toISOString()}`,
  );

  const recentCount = (rateLimitResult as unknown as Array<{ count: number }>)[0]
    ?.count ?? 0;

  if (recentCount >= RATE_LIMIT_MAX) {
    return NextResponse.json(
      {
        error: `Rate limit exceeded. Maximum ${RATE_LIMIT_MAX} generations per hour.`,
        code: "RATE_LIMIT",
        remaining: 0,
      },
      { status: 429 },
    );
  }

  // 5. Generate the image
  const enhancedPrompt = buildEnhancedPrompt(prompt.trim(), style);
  let resultUrl: string;
  let generationMode: string;

  try {
    if (process.env.REPLICATE_API_TOKEN) {
      resultUrl = await generateWithReplicate(
        enhancedPrompt,
        resolvedAspectRatio,
        negative_prompt,
      );
      generationMode = "replicate";
    } else if (process.env.TOGETHER_API_KEY) {
      resultUrl = await generateWithTogether(
        enhancedPrompt,
        resolvedAspectRatio,
      );
      generationMode = "together";
    } else {
      resultUrl = await generatePlaceholder(
        prompt.trim(),
        resolvedAspectRatio,
      );
      generationMode = "placeholder";
    }
  } catch (err) {
    console.error("AI image generation failed:", err);
    const message =
      err instanceof Error ? err.message : "Image generation failed";
    return NextResponse.json(
      { error: message, code: "GENERATION_FAILED" },
      { status: 500 },
    );
  }

  // 6. Track in ai_generations table
  try {
    await db.execute(
      sql`INSERT INTO ai_generations (creator_id, type, prompt, style, result_url, status, cost_credits)
          VALUES (${user.id}, 'image', ${prompt.trim()}, ${style ?? null}, ${resultUrl}, 'completed', 1)`,
    );
  } catch (err) {
    console.error("Failed to track AI generation:", err);
    // Non-blocking: still return the generated image
  }

  // 7. Calculate remaining credits
  const remaining = Math.max(0, RATE_LIMIT_MAX - recentCount - 1);

  return NextResponse.json({
    data: {
      url: resultUrl,
      prompt: prompt.trim(),
      style: style ?? null,
      aspect_ratio: resolvedAspectRatio,
      mode: generationMode,
    },
    remaining,
  });
}
