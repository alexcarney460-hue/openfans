import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/utils/api/auth";
import { db } from "@/utils/db/db";
import { creatorProfilesTable, usersTable } from "@/utils/db/schema";
import { eq, and, sql } from "drizzle-orm";

/** Validates a 2-letter ISO country code */
function isValidCountryCode(code: string): boolean {
  return /^[A-Z]{2}$/.test(code);
}

/** Validates a region code in "CC:RR" format (country:region) */
function isValidRegionCode(code: string): boolean {
  return /^[A-Z]{2}:[A-Z0-9]{1,5}$/.test(code);
}

/**
 * GET /api/creator-profile/geo-blocking
 * Returns the authenticated creator's geo-blocking settings.
 */
export async function GET() {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  try {
    const results = await db
      .select({
        blocked_countries: sql<string[]>`COALESCE(${creatorProfilesTable}.blocked_countries, '{}')`,
        blocked_regions: sql<string[]>`COALESCE(${creatorProfilesTable}.blocked_regions, '{}')`,
      })
      .from(creatorProfilesTable)
      .innerJoin(usersTable, eq(usersTable.id, creatorProfilesTable.user_id))
      .where(
        and(
          eq(creatorProfilesTable.user_id, user.id),
          eq(usersTable.role, "creator"),
        ),
      )
      .limit(1);

    if (results.length === 0) {
      return NextResponse.json(
        { error: "Creator profile not found", code: "NOT_CREATOR" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      data: {
        blocked_countries: results[0].blocked_countries ?? [],
        blocked_regions: results[0].blocked_regions ?? [],
      },
    });
  } catch (err) {
    console.error("GET /api/creator-profile/geo-blocking error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/creator-profile/geo-blocking
 * Updates the authenticated creator's geo-blocking settings.
 * Body: { blocked_countries: string[], blocked_regions: string[] }
 */
export async function PUT(request: NextRequest) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  try {
    const body = await request.json();

    const blockedCountries: unknown = body.blocked_countries;
    const blockedRegions: unknown = body.blocked_regions;

    // Validate types
    if (!Array.isArray(blockedCountries) || !Array.isArray(blockedRegions)) {
      return NextResponse.json(
        {
          error: "blocked_countries and blocked_regions must be arrays",
          code: "INVALID_INPUT",
        },
        { status: 400 },
      );
    }

    // Validate and normalize country codes
    const normalizedCountries: string[] = [];
    for (const code of blockedCountries) {
      if (typeof code !== "string") {
        return NextResponse.json(
          { error: "Each country code must be a string", code: "INVALID_INPUT" },
          { status: 400 },
        );
      }
      const upper = code.toUpperCase().trim();
      if (!isValidCountryCode(upper)) {
        return NextResponse.json(
          {
            error: `Invalid country code: "${code}". Must be a 2-letter ISO code.`,
            code: "INVALID_COUNTRY_CODE",
          },
          { status: 400 },
        );
      }
      normalizedCountries.push(upper);
    }

    // Validate and normalize region codes
    const normalizedRegions: string[] = [];
    for (const code of blockedRegions) {
      if (typeof code !== "string") {
        return NextResponse.json(
          { error: "Each region code must be a string", code: "INVALID_INPUT" },
          { status: 400 },
        );
      }
      const upper = code.toUpperCase().trim();
      if (!isValidRegionCode(upper)) {
        return NextResponse.json(
          {
            error: `Invalid region code: "${code}". Must be in "CC:RR" format (e.g. "US:CA").`,
            code: "INVALID_REGION_CODE",
          },
          { status: 400 },
        );
      }
      normalizedRegions.push(upper);
    }

    // Deduplicate
    const uniqueCountries = Array.from(new Set(normalizedCountries));
    const uniqueRegions = Array.from(new Set(normalizedRegions));

    // Verify user is a creator and update
    const result = await db.execute(
      sql`UPDATE creator_profiles
          SET blocked_countries = ${uniqueCountries}::text[],
              blocked_regions = ${uniqueRegions}::text[]
          WHERE user_id = ${user.id}
          AND EXISTS (
            SELECT 1 FROM users WHERE users.id = ${user.id} AND users.role IN ('creator', 'admin')
          )
          RETURNING blocked_countries, blocked_regions`,
    );

    const rows = (result as any).rows ?? result;
    if (!rows || (Array.isArray(rows) && rows.length === 0)) {
      return NextResponse.json(
        { error: "Creator profile not found", code: "NOT_CREATOR" },
        { status: 404 },
      );
    }

    const updated = Array.isArray(rows) ? rows[0] : rows;

    return NextResponse.json({
      data: {
        blocked_countries: (updated as Record<string, unknown>).blocked_countries ?? uniqueCountries,
        blocked_regions: (updated as Record<string, unknown>).blocked_regions ?? uniqueRegions,
      },
    });
  } catch (err) {
    console.error("PUT /api/creator-profile/geo-blocking error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
