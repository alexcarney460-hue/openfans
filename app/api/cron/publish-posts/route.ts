export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { postsTable } from "@/utils/db/schema";
import { eq, and, lte } from "drizzle-orm";

/**
 * GET /api/cron/publish-posts
 *
 * Vercel cron job that publishes scheduled posts whose scheduled_at
 * timestamp has passed. Runs every 5 minutes.
 *
 * Protected by CRON_SECRET to prevent unauthorized invocations.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const now = new Date();

    // Find all unpublished posts whose scheduled time has passed
    const published = await db
      .update(postsTable)
      .set({ is_published: true })
      .where(
        and(
          eq(postsTable.is_published, false),
          eq(postsTable.is_hidden, false),
          lte(postsTable.scheduled_at, now),
        ),
      )
      .returning({ id: postsTable.id });

    return NextResponse.json({
      ok: true,
      published_count: published.length,
      published_ids: published.map((p) => p.id),
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("CRON /api/cron/publish-posts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
