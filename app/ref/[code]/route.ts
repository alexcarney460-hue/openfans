import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { affiliatesTable, usersTable } from "@/utils/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /ref/[code]
 * Resolves a referral code and redirects:
 *   - Fans → creator's profile page with ?ref= param (so they can subscribe)
 *   - Everyone → signup page with ?ref= param as fallback
 *
 * The referral code is tied to a creator. Visiting their link shows their profile
 * so fans can see who they're subscribing to.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { code: string } },
) {
  const { code } = params;

  try {
    // Look up the affiliate by referral code
    const rows = await db
      .select({
        user_id: affiliatesTable.user_id,
        is_active: affiliatesTable.is_active,
      })
      .from(affiliatesTable)
      .where(eq(affiliatesTable.referral_code, code))
      .limit(1);

    if (rows.length === 0 || !rows[0].is_active) {
      // Invalid or inactive code → redirect to signup with code anyway
      // (the signup will just ignore an invalid code gracefully)
      return NextResponse.redirect(
        new URL(`/signup?ref=${encodeURIComponent(code)}`, _request.url),
      );
    }

    // Get the creator's username
    const userRows = await db
      .select({ username: usersTable.username })
      .from(usersTable)
      .where(eq(usersTable.id, rows[0].user_id))
      .limit(1);

    const username = userRows[0]?.username;

    if (username) {
      // Redirect to creator's profile with ref param
      // Fans land on the creator's page and can subscribe; the ref code is
      // stored in a cookie or passed to signup if they decide to create an account
      return NextResponse.redirect(
        new URL(`/${username}?ref=${encodeURIComponent(code)}`, _request.url),
      );
    }

    // Fallback: no username found, go to signup
    return NextResponse.redirect(
      new URL(`/signup?ref=${encodeURIComponent(code)}`, _request.url),
    );
  } catch (error) {
    console.error("GET /ref/[code] error:", error);
    return NextResponse.redirect(new URL("/signup", _request.url));
  }
}
