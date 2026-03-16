import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rows<T = Record<string, unknown>>(result: unknown): T[] {
  return result as T[];
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const VALID_SORTS = ["popular", "new"] as const;
type SortOption = (typeof VALID_SORTS)[number];

function isValidSort(v: string | null): v is SortOption {
  return v !== null && (VALID_SORTS as readonly string[]).includes(v);
}

/**
 * Build WHERE fragment from optional search + category filters.
 * Returns a sql fragment (which may be empty).
 */
function buildWhereFragment(
  search: string | null,
  category: string | null,
) {
  if (search && category) {
    return sql`WHERE (d.name ILIKE ${"%" + search + "%"} OR d.username ILIKE ${"%" + search + "%"}) AND ${category} = ANY(d.categories)`;
  }
  if (search) {
    return sql`WHERE (d.name ILIKE ${"%" + search + "%"} OR d.username ILIKE ${"%" + search + "%"})`;
  }
  if (category) {
    return sql`WHERE ${category} = ANY(d.categories)`;
  }
  return sql``;
}

// ---------------------------------------------------------------------------
// GET /api/ai-creators
// Public endpoint. Lists AI creators from the ai_creator_directory table.
//
// Query params:
//   search   - filter by name or username (ILIKE)
//   category - filter by category (e.g. "AI Fashion")
//   sort     - "popular" (default) | "new"
//   page     - page number (default 1)
//   limit    - results per page (default 20, max 50)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || null;
    const category = searchParams.get("category")?.trim() || null;
    const sortParam = searchParams.get("sort")?.trim()?.toLowerCase() || null;
    const sort: SortOption = isValidSort(sortParam) ? sortParam : "popular";
    const page = Math.max(
      1,
      parseInt(searchParams.get("page") || String(DEFAULT_PAGE), 10) || DEFAULT_PAGE,
    );
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(
        1,
        parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT,
      ),
    );
    const offset = (page - 1) * limit;

    const whereFragment = buildWhereFragment(search, category);
    const orderFragment =
      sort === "new"
        ? sql`ORDER BY d.created_at DESC`
        : sql`ORDER BY d.follower_count DESC`;

    // Main query: LEFT JOIN to count requests for each AI creator
    const data = rows(
      await db.execute(sql`
        SELECT
          d.id,
          d.name,
          d.username,
          d.bio,
          d.avatar_url,
          d.banner_url,
          d.source_platform,
          d.source_url,
          d.categories,
          d.follower_count,
          d.is_claimed,
          d.is_featured,
          d.created_at,
          COALESCE(rc.request_count, 0)::int AS request_count
        FROM ai_creator_directory d
        LEFT JOIN (
          SELECT platform_username, COUNT(*) AS request_count
          FROM creator_requests
          WHERE platform = 'openfans'
          GROUP BY platform_username
        ) rc ON rc.platform_username = d.username
        ${whereFragment}
        ${orderFragment}
        LIMIT ${limit} OFFSET ${offset}
      `),
    );

    // Count query
    const countResult = rows<{ total: number }>(
      await db.execute(sql`
        SELECT COUNT(*)::int AS total
        FROM ai_creator_directory d
        ${whereFragment}
      `),
    );

    const total = countResult[0]?.total ?? 0;

    return NextResponse.json({
      data,
      meta: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
        sort,
      },
    });
  } catch (error) {
    console.error("GET /api/ai-creators error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
