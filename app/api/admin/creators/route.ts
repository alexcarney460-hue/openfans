export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { usersTable, creatorProfilesTable } from "@/utils/db/schema";
import { eq, sql } from "drizzle-orm";
import { getAuthenticatedAdmin } from "@/utils/api/auth";

/**
 * GET /api/admin/creators
 * List all creators with their profile data (subscribers, earnings, categories, verified status).
 */
export async function GET() {
  try {
    const { error: authError } = await getAuthenticatedAdmin();
    if (authError) return authError;

    const creators = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        display_name: usersTable.display_name,
        avatar_url: usersTable.avatar_url,
        is_verified: usersTable.is_verified,
        created_at: usersTable.created_at,
        total_subscribers: creatorProfilesTable.total_subscribers,
        total_earnings_usdc: creatorProfilesTable.total_earnings_usdc,
        categories: creatorProfilesTable.categories,
        subscription_price_usdc: creatorProfilesTable.subscription_price_usdc,
        is_featured: creatorProfilesTable.is_featured,
      })
      .from(usersTable)
      .innerJoin(
        creatorProfilesTable,
        eq(usersTable.id, creatorProfilesTable.user_id),
      )
      .where(eq(usersTable.role, "creator"))
      .orderBy(sql`${creatorProfilesTable.total_earnings_usdc} DESC`);

    return NextResponse.json({ data: { creators } });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("GET /api/admin/creators error:", message);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
