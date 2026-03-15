import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import {
  usersTable,
  creatorProfilesTable,
  postsTable,
  subscriptionsTable,
} from "@/utils/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";

/**
 * Extracts the viewer's geo information from Vercel request headers.
 * Returns null values when headers are absent (e.g. localhost).
 */
function getViewerGeo(request: NextRequest): {
  country: string | null;
  region: string | null;
} {
  const country = request.headers.get("x-vercel-ip-country")?.toUpperCase() ?? null;
  const region = request.headers.get("x-vercel-ip-country-region")?.toUpperCase() ?? null;
  return { country, region };
}

/**
 * Checks whether a viewer from the given geo is blocked by the creator's settings.
 */
function isGeoBlocked(
  viewerCountry: string | null,
  viewerRegion: string | null,
  blockedCountries: string[],
  blockedRegions: string[],
): boolean {
  if (!viewerCountry) return false;
  if (blockedCountries.includes(viewerCountry)) return true;
  if (viewerRegion && blockedRegions.includes(`${viewerCountry}:${viewerRegion}`)) return true;
  return false;
}

/**
 * GET /api/creators/[username]
 * Return a single creator's public profile with recent posts,
 * subscriber count, and post count.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } },
) {
  try {
    const { username } = params;

    if (!username || username.trim().length === 0) {
      return NextResponse.json(
        { error: "Username is required", code: "INVALID_USERNAME" },
        { status: 400 },
      );
    }

    // Fetch user + creator profile
    const userResults = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        display_name: usersTable.display_name,
        bio: usersTable.bio,
        avatar_url: usersTable.avatar_url,
        banner_url: usersTable.banner_url,
        is_verified: usersTable.is_verified,
        created_at: usersTable.created_at,
        // Creator profile
        profile_id: creatorProfilesTable.id,
        subscription_price_usdc: creatorProfilesTable.subscription_price_usdc,
        premium_price_usdc: creatorProfilesTable.premium_price_usdc,
        vip_price_usdc: creatorProfilesTable.vip_price_usdc,
        total_subscribers: creatorProfilesTable.total_subscribers,
        total_earnings_usdc: creatorProfilesTable.total_earnings_usdc,
        categories: creatorProfilesTable.categories,
        is_featured: creatorProfilesTable.is_featured,
        payout_wallet: creatorProfilesTable.payout_wallet,
      })
      .from(usersTable)
      .innerJoin(
        creatorProfilesTable,
        eq(usersTable.id, creatorProfilesTable.user_id),
      )
      .where(
        and(
          eq(usersTable.username, username),
          eq(usersTable.role, "creator"),
        ),
      )
      .limit(1);

    if (userResults.length === 0) {
      return NextResponse.json(
        { error: "Creator not found", code: "CREATOR_NOT_FOUND" },
        { status: 404 },
      );
    }

    const creator = userResults[0];

    // Fetch geo-blocking data via raw SQL (columns may not be in schema)
    const geoResult = await db.execute(
      sql`SELECT
            COALESCE(blocked_countries, '{}') AS blocked_countries,
            COALESCE(blocked_regions, '{}') AS blocked_regions
          FROM creator_profiles
          WHERE user_id = ${creator.id}
          LIMIT 1`,
    );
    const geoRow = ((geoResult as any).rows ?? geoResult)?.[0] as
      | { blocked_countries: string[]; blocked_regions: string[] }
      | undefined;
    const blockedCountries: string[] = geoRow?.blocked_countries ?? [];
    const blockedRegions: string[] = geoRow?.blocked_regions ?? [];

    // Check if viewer is geo-blocked
    const { country: viewerCountry, region: viewerRegion } = getViewerGeo(request);

    if (isGeoBlocked(viewerCountry, viewerRegion, blockedCountries, blockedRegions)) {
      // Allow the creator to view their own profile
      let isOwnProfile = false;
      let isAdmin = false;
      try {
        const supabase = createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          if (authUser.id === creator.id) {
            isOwnProfile = true;
          } else {
            const adminCheck = await db
              .select({ role: usersTable.role })
              .from(usersTable)
              .where(eq(usersTable.id, authUser.id))
              .limit(1);
            if (adminCheck.length > 0 && adminCheck[0].role === "admin") {
              isAdmin = true;
            }
          }
        }
      } catch {
        // Auth check failed — treat as anonymous visitor
      }

      if (!isOwnProfile && !isAdmin) {
        return NextResponse.json(
          {
            error: "This profile is not available in your region",
            code: "GEO_BLOCKED",
          },
          { status: 451 },
        );
      }
    }

    // Get post count
    const postCountResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(postsTable)
      .where(eq(postsTable.creator_id, creator.id));

    const postCount = postCountResult[0]?.count ?? 0;

    // Get active subscriber count (real-time, not the cached total_subscribers)
    const subscriberCountResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(subscriptionsTable)
      .where(
        and(
          eq(subscriptionsTable.creator_id, creator.id),
          eq(subscriptionsTable.status, "active"),
        ),
      );

    const subscriberCount = subscriberCountResult[0]?.count ?? 0;

    // Get recent free/public posts (limit 10)
    const recentPosts = await db
      .select()
      .from(postsTable)
      .where(
        and(
          eq(postsTable.creator_id, creator.id),
          eq(postsTable.is_free, true),
          eq(postsTable.is_published, true),
          eq(postsTable.is_hidden, false),
        ),
      )
      .orderBy(desc(postsTable.created_at))
      .limit(10);

    // Omit earnings from public profile
    const { total_earnings_usdc, payout_wallet, ...publicProfile } = creator;

    return NextResponse.json({
      data: {
        ...publicProfile,
        subscriber_count: subscriberCount,
        post_count: postCount,
        recent_posts: recentPosts,
      },
    });
  } catch (error) {
    console.error("GET /api/creators/[username] error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
