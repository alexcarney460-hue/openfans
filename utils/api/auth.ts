import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { usersTable } from "@/utils/db/schema";
import { eq } from "drizzle-orm";

/**
 * Extracts the authenticated user from the Supabase session.
 * Returns the user object on success, or a 401 NextResponse on failure.
 */
export async function getAuthenticatedUser(): Promise<
  | { user: { id: string; email?: string }; error: null }
  | { user: null; error: NextResponse }
> {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      error: NextResponse.json(
        { error: "Unauthorized", code: "AUTH_REQUIRED" },
        { status: 401 },
      ),
    };
  }

  return { user: { id: user.id, email: user.email }, error: null };
}

/**
 * Extracts the authenticated user and verifies they have the admin role.
 * Returns the user object on success, or a 401/403 NextResponse on failure.
 */
export async function getAuthenticatedAdmin(): Promise<
  | { user: { id: string; email?: string }; error: null }
  | { user: null; error: NextResponse }
> {
  const { user, error } = await getAuthenticatedUser();
  if (error) return { user: null, error };

  const dbUser = await db
    .select({ role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, user.id))
    .limit(1);

  if (dbUser.length === 0 || dbUser[0].role !== "admin") {
    return {
      user: null,
      error: NextResponse.json(
        { error: "Forbidden", code: "ADMIN_REQUIRED" },
        { status: 403 },
      ),
    };
  }

  return { user, error: null };
}
