export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { usersTable } from "@/utils/db/schema";
import { or, ilike, ne, and, sql } from "drizzle-orm";
import { getAuthenticatedUser } from "@/utils/api/auth";

/**
 * GET /api/users/search?q=username
 * Search for users by username or display name.
 * Returns up to 10 results. Excludes the current user.
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();

    if (!query || query.length < 1) {
      return NextResponse.json({ data: [] });
    }

    const searchPattern = `%${query}%`;

    const users = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        display_name: usersTable.display_name,
        avatar_url: usersTable.avatar_url,
      })
      .from(usersTable)
      .where(
        and(
          ne(usersTable.id, user.id),
          or(
            ilike(usersTable.username, searchPattern),
            ilike(usersTable.display_name, searchPattern),
          ),
        ),
      )
      .limit(10);

    return NextResponse.json({ data: users });
  } catch (error) {
    console.error("GET /api/users/search error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
