import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { postsTable } from "@/utils/db/schema";
import { eq, sql } from "drizzle-orm";
import { checkRateLimit, getRateLimitKey } from "@/utils/rate-limit";

/**
 * POST /api/posts/[id]/view
 * Increments the view count for a post.
 * No auth required — anonymous views count.
 * Rate limited to 30 per minute per IP to prevent view botting.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const postId = parseInt(params.id, 10);
    if (isNaN(postId)) {
      return NextResponse.json(
        { error: "Invalid post ID", code: "INVALID_POST_ID" },
        { status: 400 },
      );
    }

    // Rate limit: 30 views per minute per IP
    const identifier = getRateLimitKey(request);
    const rateLimitResponse = await checkRateLimit(
      request,
      identifier,
      "post-view",
      30,
      60_000,
    );
    if (rateLimitResponse) return rateLimitResponse;

    // Atomically increment views_count
    const result = await db
      .update(postsTable)
      .set({ views_count: sql`${postsTable.views_count} + 1` })
      .where(eq(postsTable.id, postId))
      .returning({ id: postsTable.id });

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Post not found", code: "POST_NOT_FOUND" },
        { status: 404 },
      );
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error("POST /api/posts/[id]/view error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
