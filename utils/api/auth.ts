import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

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
