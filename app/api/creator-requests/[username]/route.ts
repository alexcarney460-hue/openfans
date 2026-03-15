import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { sql } from "drizzle-orm";

// Helper: cast RowList to plain array
function rows<T = Record<string, unknown>>(result: unknown): T[] {
  return result as T[];
}

// ---------------------------------------------------------------------------
// GET /api/creator-requests/[username] — stats for a specific creator
// Public endpoint. Returns waitlist count + recent requesters.
// ---------------------------------------------------------------------------
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const platformUsername = username.replace(/^@/, "").toLowerCase().trim();

  if (!platformUsername) {
    return NextResponse.json(
      { error: "Username is required" },
      { status: 400 },
    );
  }

  try {
    const countRows = rows<{
      waitlist_count: string;
      first_requested_at: string | null;
      last_requested_at: string | null;
    }>(
      await db.execute(sql`
        SELECT
          COUNT(*) AS waitlist_count,
          MIN(created_at) AS first_requested_at,
          MAX(created_at) AS last_requested_at
        FROM creator_requests
        WHERE platform_username = ${platformUsername}
      `),
    );

    const row = countRows[0];
    const waitlistCount = Number(row?.waitlist_count ?? 0);

    if (waitlistCount === 0) {
      return NextResponse.json({
        data: {
          platform_username: platformUsername,
          waitlist_count: 0,
          recent_requesters: [],
        },
      });
    }

    const nameRows = rows<{ creator_name: string; platform: string }>(
      await db.execute(sql`
        SELECT creator_name, platform FROM creator_requests
        WHERE platform_username = ${platformUsername}
        ORDER BY created_at DESC LIMIT 1
      `),
    );

    const recentRows = rows<{ display: string; created_at: string }>(
      await db.execute(sql`
        SELECT
          CASE
            WHEN cr.requested_by IS NOT NULL THEN COALESCE(u.display_name, u.username, 'Fan')
            ELSE CONCAT(LEFT(cr.requested_by_email, 2), '***')
          END AS display,
          cr.created_at
        FROM creator_requests cr
        LEFT JOIN users_table u ON u.id = cr.requested_by
        WHERE cr.platform_username = ${platformUsername}
        ORDER BY cr.created_at DESC
        LIMIT 10
      `),
    );

    return NextResponse.json({
      data: {
        platform_username: platformUsername,
        creator_name: nameRows[0]?.creator_name ?? platformUsername,
        platform: nameRows[0]?.platform ?? "onlyfans",
        waitlist_count: waitlistCount,
        first_requested_at: row?.first_requested_at,
        last_requested_at: row?.last_requested_at,
        recent_requesters: recentRows,
      },
    });
  } catch (err) {
    console.error("GET /api/creator-requests/[username] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch request stats" },
      { status: 500 },
    );
  }
}
