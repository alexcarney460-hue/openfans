import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { usersTable, creatorProfilesTable } from "@/utils/db/schema";
import { eq, sql, and } from "drizzle-orm";

/**
 * Extracts viewer's geo from Vercel request headers.
 */
function getViewerGeo(request: NextRequest): {
  country: string | null;
  region: string | null;
} {
  const country = request.headers.get("x-vercel-ip-country")?.toUpperCase() ?? null;
  const region = request.headers.get("x-vercel-ip-country-region")?.toUpperCase() ?? null;
  return { country, region };
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const VALID_SORT_OPTIONS = ["popular", "new", "earnings"] as const;
type SortOption = (typeof VALID_SORT_OPTIONS)[number];

function isValidSort(value: string | null): value is SortOption {
  return value !== null && VALID_SORT_OPTIONS.includes(value as SortOption);
}

function getOrderByClause(sort: SortOption) {
  switch (sort) {
    case "new":
      return sql`${usersTable.created_at} DESC`;
    case "earnings":
      return sql`${creatorProfilesTable.total_earnings_usdc} DESC`;
    case "popular":
    default:
      return sql`${creatorProfilesTable.total_subscribers} DESC`;
  }
}

/**
 * GET /api/creators
 * List and search creators with their profiles.
 *
 * Query params:
 *   - category: filter by creator category
 *   - search: search by display_name or username
 *   - sort: "popular" (default) | "new" | "earnings"
 *   - featured: "true" to filter only featured creators
 *   - page: page number (default 1)
 *   - limit: results per page (default 20, max 100)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category")?.trim() || null;
    const search = searchParams.get("search")?.trim() || null;
    const sortParam = searchParams.get("sort")?.trim()?.toLowerCase() || null;
    const sort: SortOption = isValidSort(sortParam) ? sortParam : "popular";
    const featured = searchParams.get("featured") === "true";
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

    // Base query: join users with creator_profiles
    const baseQuery = db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        display_name: usersTable.display_name,
        bio: usersTable.bio,
        avatar_url: usersTable.avatar_url,
        banner_url: usersTable.banner_url,
        is_verified: usersTable.is_verified,
        created_at: usersTable.created_at,
        // Creator profile fields
        profile_id: creatorProfilesTable.id,
        subscription_price_usdc: creatorProfilesTable.subscription_price_usdc,
        total_subscribers: creatorProfilesTable.total_subscribers,
        categories: creatorProfilesTable.categories,
        is_featured: creatorProfilesTable.is_featured,
        post_count: sql<number>`(SELECT count(*)::int FROM posts WHERE posts.creator_id = ${usersTable.id})`,
      })
      .from(usersTable)
      .innerJoin(
        creatorProfilesTable,
        eq(usersTable.id, creatorProfilesTable.user_id),
      );

    // Build WHERE clause dynamically
    const whereConditions: ReturnType<typeof eq>[] = [
      eq(usersTable.role, "creator"),
    ];

    if (category) {
      whereConditions.push(
        sql`${category} = ANY(${creatorProfilesTable.categories})` as any,
      );
    }

    if (search) {
      whereConditions.push(
        sql`(${usersTable.display_name} ILIKE ${"%" + search + "%"} OR ${usersTable.username} ILIKE ${"%" + search + "%"})` as any,
      );
    }

    if (featured) {
      whereConditions.push(
        eq(creatorProfilesTable.is_featured, true),
      );
    }

    // Filter out creators who have geo-blocked the viewer's location
    const { country: viewerCountry, region: viewerRegion } = getViewerGeo(request);
    if (viewerCountry) {
      whereConditions.push(
        sql`NOT (COALESCE(${creatorProfilesTable}.blocked_countries, '{}') @> ARRAY[${viewerCountry}]::text[])` as any,
      );
      const countryRegion = viewerRegion ? `${viewerCountry}:${viewerRegion}` : null;
      if (countryRegion) {
        whereConditions.push(
          sql`NOT (COALESCE(${creatorProfilesTable}.blocked_regions, '{}') @> ARRAY[${countryRegion}]::text[])` as any,
        );
      }
    }

    const whereClause =
      whereConditions.length === 1
        ? whereConditions[0]
        : and(...whereConditions);

    const creators = await baseQuery
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(getOrderByClause(sort));

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(usersTable)
      .innerJoin(
        creatorProfilesTable,
        eq(usersTable.id, creatorProfilesTable.user_id),
      )
      .where(whereClause);

    const total = countResult[0]?.count ?? 0;

    // Get distinct categories from all creators (for dynamic category filters)
    const categoriesResult = await db
      .select({
        category: sql<string>`DISTINCT unnest(${creatorProfilesTable.categories})`,
      })
      .from(creatorProfilesTable)
      .orderBy(sql`1`);

    const allCategories = categoriesResult.map((r) => r.category).filter(Boolean);

    return NextResponse.json({
      data: creators,
      categories: allCategories,
      meta: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
        sort,
      },
    });
  } catch (error) {
    console.error("GET /api/creators error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
