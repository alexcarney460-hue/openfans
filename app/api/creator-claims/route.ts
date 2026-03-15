import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { sql } from "drizzle-orm";
import { getAuthenticatedAdmin } from "@/utils/api/auth";
import { randomBytes } from "crypto";

// Helper: cast RowList to plain array
function rows<T = Record<string, unknown>>(result: unknown): T[] {
  return result as T[];
}

// ---------------------------------------------------------------------------
// POST /api/creator-claims — Generate a claim link (admin only)
// Body: { platform_username, platform? }
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const { error: authError } = await getAuthenticatedAdmin();
  if (authError) return authError;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const platformUsername = String(body.platform_username ?? "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
  const platform = String(body.platform ?? "onlyfans").trim().toLowerCase();

  if (!platformUsername) {
    return NextResponse.json(
      { error: "platform_username is required" },
      { status: 400 },
    );
  }

  try {
    const existingRows = rows<{
      id: string;
      claim_token: string;
      status: string;
    }>(
      await db.execute(sql`
        SELECT id, claim_token, status FROM creator_claims
        WHERE platform = ${platform} AND platform_username = ${platformUsername}
        LIMIT 1
      `),
    );

    if (existingRows.length > 0) {
      const claim = existingRows[0];
      return NextResponse.json({
        data: {
          claim_token: claim.claim_token,
          status: claim.status,
          claim_url: `/claim/${claim.claim_token}`,
          already_existed: true,
        },
      });
    }

    // Generate secure token
    const claimToken = randomBytes(32).toString("hex");

    await db.execute(sql`
      INSERT INTO creator_claims (platform, platform_username, claim_token)
      VALUES (${platform}, ${platformUsername}, ${claimToken})
    `);

    return NextResponse.json({
      data: {
        claim_token: claimToken,
        status: "pending",
        claim_url: `/claim/${claimToken}`,
      },
    });
  } catch (err) {
    console.error("POST /api/creator-claims error:", err);
    return NextResponse.json(
      { error: "Failed to generate claim link" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// GET /api/creator-claims?token=xxx — Validate a claim token (public)
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { error: "token is required" },
      { status: 400 },
    );
  }

  try {
    const claimRows = rows<{
      id: string;
      platform: string;
      platform_username: string;
      status: string;
      claimed_at: string | null;
      created_at: string;
    }>(
      await db.execute(sql`
        SELECT id, platform, platform_username, status, claimed_at, created_at
        FROM creator_claims
        WHERE claim_token = ${token}
        LIMIT 1
      `),
    );

    if (claimRows.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired claim token" },
        { status: 404 },
      );
    }

    const claim = claimRows[0];

    const countRows = rows<{ waitlist_count: string }>(
      await db.execute(sql`
        SELECT COUNT(*) AS waitlist_count FROM creator_requests
        WHERE platform = ${claim.platform} AND platform_username = ${claim.platform_username}
      `),
    );

    const nameRows = rows<{ creator_name: string }>(
      await db.execute(sql`
        SELECT creator_name FROM creator_requests
        WHERE platform = ${claim.platform} AND platform_username = ${claim.platform_username}
        ORDER BY created_at DESC LIMIT 1
      `),
    );

    return NextResponse.json({
      data: {
        ...claim,
        creator_name: nameRows[0]?.creator_name ?? claim.platform_username,
        waitlist_count: Number(countRows[0]?.waitlist_count ?? 0),
      },
    });
  } catch (err) {
    console.error("GET /api/creator-claims error:", err);
    return NextResponse.json(
      { error: "Failed to validate claim token" },
      { status: 500 },
    );
  }
}
