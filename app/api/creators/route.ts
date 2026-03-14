import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { usersTable, creatorProfilesTable, postsTable } from "@/utils/db/schema";
import { eq, ilike, sql, and } from "drizzle-orm";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * GET /api/creators
 * List and search creators with their profiles.
 *
 * Query params:
 *   - category: filter by creator category
 *   - search: search by display_name or username
 *   - page: page number (default 1)
 *   - limit: results per page (default 20, max 100)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category")?.trim() || null;
    const search = searchParams.get("search")?.trim() || null;
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

    // Build conditions for the query
    const conditions = [
      eq(usersTable.role, "creator"),
      eq(creatorProfilesTable.is_featured, true).if(false), // placeholder, always included
    ].filter(Boolean);

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
      // Filter creators whose categories array contains the given category
      whereConditions.push(
        sql`${category} = ANY(${creatorProfilesTable.categories})` as any,
      );
    }

    if (search) {
      // Search in display_name or username (case-insensitive)
      whereConditions.push(
        sql`(${usersTable.display_name} ILIKE ${"%" + search + "%"} OR ${usersTable.username} ILIKE ${"%" + search + "%"})` as any,
      );
    }

    const whereClause =
      whereConditions.length === 1
        ? whereConditions[0]
        : and(...whereConditions);

    const creators = await baseQuery
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(sql`${creatorProfilesTable.total_subscribers} DESC`);

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

    return NextResponse.json({
      data: creators,
      meta: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
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
