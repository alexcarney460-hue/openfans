import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { sql } from "drizzle-orm";
import { getAuthenticatedUser } from "@/utils/api/auth";

// Helper: cast RowList to plain array
function rows<T = Record<string, unknown>>(result: unknown): T[] {
  return result as T[];
}

// ---------------------------------------------------------------------------
// GET /api/creator-requests — list most-requested creators with waitlist counts
// Public endpoint. Supports ?page=1&limit=20
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));
  const offset = (page - 1) * limit;

  try {
    const data = rows(
      await db.execute(sql`
        SELECT
          cr.platform,
          cr.platform_username,
          cr.creator_name,
          COUNT(*) AS waitlist_count,
          MIN(cr.created_at) AS first_requested_at,
          MAX(cr.created_at) AS last_requested_at,
          COALESCE(cc.status, 'unclaimed') AS claim_status
        FROM creator_requests cr
        LEFT JOIN creator_claims cc
          ON cc.platform = cr.platform AND cc.platform_username = cr.platform_username
        GROUP BY cr.platform, cr.platform_username, cr.creator_name, cc.status
        ORDER BY COUNT(*) DESC, MAX(cr.created_at) DESC
        LIMIT ${limit} OFFSET ${offset}
      `),
    );

    const countRows = rows<{ total: string }>(
      await db.execute(sql`
        SELECT COUNT(DISTINCT (platform, platform_username)) AS total
        FROM creator_requests
      `),
    );
    const total = Number(countRows[0]?.total ?? 0);

    return NextResponse.json({
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("GET /api/creator-requests error:", err);
    return NextResponse.json(
      { error: "Failed to fetch creator requests" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/creator-requests — request a creator
// Body: { creator_name, platform_username, platform?, email? }
// Auth users use user.id; anonymous users must provide email.
// Rate limit: 20 requests per hour per user/email.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const creatorName = String(body.creator_name ?? "").trim();
  const platformUsername = String(body.platform_username ?? "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
  const platform = String(body.platform ?? "onlyfans").trim().toLowerCase();

  if (!creatorName || creatorName.length > 200) {
    return NextResponse.json(
      { error: "creator_name is required (max 200 chars)" },
      { status: 400 },
    );
  }
  if (!platformUsername || platformUsername.length > 100) {
    return NextResponse.json(
      { error: "platform_username is required (max 100 chars)" },
      { status: 400 },
    );
  }
  if (!/^[a-z0-9._-]+$/.test(platformUsername)) {
    return NextResponse.json(
      { error: "Invalid platform username format" },
      { status: 400 },
    );
  }

  // Determine identity
  const authResult = await getAuthenticatedUser({ allowSuspended: true });
  const userId = authResult.user?.id ?? null;
  let email: string | null = null;

  if (!userId) {
    email = String(body.email ?? "").trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Email is required for anonymous requests" },
        { status: 400 },
      );
    }
  }

  try {
    // Rate limit: 20 requests per hour
    const rateRows = rows<{ cnt: string }>(
      await db.execute(sql`
        SELECT COUNT(*) AS cnt FROM creator_requests
        WHERE created_at > NOW() - INTERVAL '1 hour'
          AND (
            (requested_by IS NOT NULL AND requested_by = ${userId})
            OR (requested_by_email IS NOT NULL AND requested_by_email = ${email})
          )
      `),
    );
    if (Number(rateRows[0]?.cnt ?? 0) >= 20) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later." },
        { status: 429 },
      );
    }

    // Check for duplicate
    const dupeRows = rows(
      await db.execute(sql`
        SELECT id FROM creator_requests
        WHERE platform = ${platform}
          AND platform_username = ${platformUsername}
          AND (
            (requested_by IS NOT NULL AND requested_by = ${userId})
            OR (requested_by_email IS NOT NULL AND requested_by_email = ${email})
          )
        LIMIT 1
      `),
    );
    if (dupeRows.length > 0) {
      const countRows = rows<{ waitlist_count: string }>(
        await db.execute(sql`
          SELECT COUNT(*) AS waitlist_count FROM creator_requests
          WHERE platform = ${platform} AND platform_username = ${platformUsername}
        `),
      );
      return NextResponse.json({
        data: {
          already_requested: true,
          waitlist_count: Number(countRows[0]?.waitlist_count ?? 1),
        },
      });
    }

    // Insert
    await db.execute(sql`
      INSERT INTO creator_requests (creator_name, platform, platform_username, requested_by, requested_by_email)
      VALUES (${creatorName}, ${platform}, ${platformUsername}, ${userId}, ${email})
    `);

    // Return updated count
    const countRows = rows<{ waitlist_count: string }>(
      await db.execute(sql`
        SELECT COUNT(*) AS waitlist_count FROM creator_requests
        WHERE platform = ${platform} AND platform_username = ${platformUsername}
      `),
    );

    return NextResponse.json({
      data: {
        success: true,
        waitlist_count: Number(countRows[0]?.waitlist_count ?? 1),
      },
    });
  } catch (err) {
    console.error("POST /api/creator-requests error:", err);
    return NextResponse.json(
      { error: "Failed to submit request" },
      { status: 500 },
    );
  }
}
