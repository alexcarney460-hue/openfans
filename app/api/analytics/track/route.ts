import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { db } from "@/utils/db/db";
import { analyticsEventsTable } from "@/utils/db/schema";
import { checkRateLimit, getRateLimitKey } from "@/utils/rate-limit";
import { getAuthenticatedUser } from "@/utils/api/auth";

const VALID_EVENT_TYPES = new Set([
  "page_view",
  "profile_view",
  "post_view",
  "post_click",
  "subscribe_click",
  "tip_click",
  "ppv_click",
  "share_click",
  "message_click",
  "signup_click",
  "login_click",
  "wallet_connect_click",
]);

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

function extractIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

/**
 * POST /api/analytics/track
 * Lightweight event recording. Auth is optional — anonymous visitors
 * can track page_view, profile_view, and post_view events.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = extractIp(request);
    const ipHash = hashIp(ip);

    // Rate limit: 60 events per minute per IP hash
    const rateLimitKey = getRateLimitKey(request);
    const rateLimitResponse = await checkRateLimit(
      request,
      rateLimitKey,
      "analytics:track",
      60,
      60_000,
    );
    if (rateLimitResponse) return rateLimitResponse;

    // Parse body
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const { event_type, target_id, metadata } = body as {
      event_type?: string;
      target_id?: string;
      metadata?: string;
    };

    // Validate event_type
    if (!event_type || !VALID_EVENT_TYPES.has(event_type)) {
      return NextResponse.json(
        { error: "Invalid event_type" },
        { status: 400 },
      );
    }

    // Try to get authenticated user (optional — don't fail if not logged in)
    let userId: string | undefined;
    try {
      const { user } = await getAuthenticatedUser();
      if (user) {
        userId = user.id;
      }
    } catch {
      // Auth is optional — continue without user_id
    }

    const userAgent = request.headers.get("user-agent") ?? undefined;
    const referrer = request.headers.get("referer") ?? undefined;

    // INSERT — fast, no heavy queries
    await db.insert(analyticsEventsTable).values({
      event_type: event_type as typeof analyticsEventsTable.$inferInsert.event_type,
      user_id: userId,
      target_id: typeof target_id === "string" ? target_id : undefined,
      metadata: typeof metadata === "string" ? metadata : undefined,
      ip_hash: ipHash,
      user_agent: userAgent,
      referrer: referrer,
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/analytics/track error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
