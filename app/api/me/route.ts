import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/utils/api/auth";
import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { db } from "@/utils/db/db";
import { usersTable } from "@/utils/db/schema";
import { eq } from "drizzle-orm";
import { isValidStorageUrl } from "@/utils/validation";

/**
 * GET /api/me
 * Returns the authenticated user's full profile from the database.
 */
export async function GET() {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const rows = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        username: usersTable.username,
        display_name: usersTable.display_name,
        avatar_url: usersTable.avatar_url,
        role: usersTable.role,
        bio: usersTable.bio,
        banner_url: usersTable.banner_url,
      })
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "User profile not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: rows[0] });
  } catch (err) {
    console.error("GET /api/me error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/me
 * Update the authenticated user's profile.
 *
 * Body (all optional):
 *   - display_name: string
 *   - username: string
 *   - bio: string
 */
export async function PATCH(request: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body", code: "INVALID_BODY" },
        { status: 400 },
      );
    }

    const updates: Record<string, unknown> = {};

    if (typeof body.display_name === "string" && body.display_name.trim().length > 0) {
      updates.display_name = body.display_name.trim();
    }

    if (typeof body.username === "string" && body.username.trim().length > 0) {
      const cleaned = body.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
      if (cleaned.length < 3) {
        return NextResponse.json(
          { error: "Username must be at least 3 characters", code: "INVALID_USERNAME" },
          { status: 400 },
        );
      }
      updates.username = cleaned;
    }

    if (typeof body.bio === "string") {
      updates.bio = body.bio.trim();
    }

    if (typeof body.avatar_url === "string") {
      const trimmed = body.avatar_url.trim();
      if (trimmed && !isValidStorageUrl(trimmed)) {
        return NextResponse.json(
          { error: "avatar_url must be a valid HTTPS URL from an allowed domain", code: "INVALID_AVATAR_URL" },
          { status: 400 },
        );
      }
      updates.avatar_url = trimmed || null;
    }

    if (typeof body.banner_url === "string") {
      const trimmed = body.banner_url.trim();
      if (trimmed && !isValidStorageUrl(trimmed)) {
        return NextResponse.json(
          { error: "banner_url must be a valid HTTPS URL from an allowed domain", code: "INVALID_BANNER_URL" },
          { status: 400 },
        );
      }
      updates.banner_url = trimmed || null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update", code: "NO_UPDATES" },
        { status: 400 },
      );
    }

    updates.updated_at = new Date();

    const updated = await db
      .update(usersTable)
      .set(updates)
      .where(eq(usersTable.id, user.id))
      .returning({
        id: usersTable.id,
        email: usersTable.email,
        username: usersTable.username,
        display_name: usersTable.display_name,
        avatar_url: usersTable.avatar_url,
        role: usersTable.role,
        bio: usersTable.bio,
        banner_url: usersTable.banner_url,
      });

    if (updated.length === 0) {
      return NextResponse.json(
        { error: "User not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: updated[0] });
  } catch (err: unknown) {
    // Handle unique constraint violation for username
    if (err instanceof Error && err.message.includes("unique")) {
      return NextResponse.json(
        { error: "Username is already taken", code: "USERNAME_TAKEN" },
        { status: 409 },
      );
    }
    console.error("PATCH /api/me error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/me
 * Permanently deletes the authenticated user's account.
 * Removes the user from users_table (cascades to all related data)
 * and deletes the Supabase auth user.
 */
export async function DELETE() {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    // Delete from our users_table (cascades to subscriptions, posts, messages, etc.)
    await db.delete(usersTable).where(eq(usersTable.id, user.id));

    // Delete from Supabase auth using the service role key (admin privileges required)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("DELETE /api/me: Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL");
      return NextResponse.json(
        { error: "Account deletion is not configured", code: "CONFIG_ERROR" },
        { status: 500 },
      );
    }

    const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteAuthError) {
      console.error("DELETE /api/me: Failed to delete auth user:", deleteAuthError.message);
      return NextResponse.json(
        { error: "Failed to delete account", code: "AUTH_DELETE_FAILED" },
        { status: 500 },
      );
    }

    // Sign out the current session
    const supabase = createClient();
    await supabase.auth.signOut();

    return NextResponse.json({ data: { deleted: true } });
  } catch (err) {
    console.error("DELETE /api/me error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
