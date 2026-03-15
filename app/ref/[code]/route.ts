import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/utils/db/db";
import { affiliatesTable, usersTable } from "@/utils/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /ref/[code]
 * Resolves a referral code and redirects based on auth status:
 *   - NOT logged in → /signup?ref=CODE (so they sign up with the code)
 *   - Logged in → /@creator-username (the referrer's profile)
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
      // Invalid or inactive code — redirect to signup with code anyway
      // (the signup will just ignore an invalid code gracefully)
      return NextResponse.redirect(
        new URL(`/signup?ref=${encodeURIComponent(code)}`, _request.url),
      );
    }

    // Check if visitor is logged in
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Get the creator's username for profile redirect
    const userRows = await db
      .select({ username: usersTable.username })
      .from(usersTable)
      .where(eq(usersTable.id, rows[0].user_id))
      .limit(1);

    const username = userRows[0]?.username;

    if (user) {
      // Logged in — redirect to the referrer's profile page
      if (username) {
        return NextResponse.redirect(
          new URL(`/${username}`, _request.url),
        );
      }
      // Fallback if no username found
      return NextResponse.redirect(new URL("/", _request.url));
    }

    // Not logged in — redirect to signup with ref code
    return NextResponse.redirect(
      new URL(`/signup?ref=${encodeURIComponent(code)}`, _request.url),
    );
  } catch (error) {
    console.error("GET /ref/[code] error:", error);
    return NextResponse.redirect(new URL("/signup", _request.url));
  }
}
