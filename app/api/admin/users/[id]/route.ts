export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { usersTable } from "@/utils/db/schema";
import { eq } from "drizzle-orm";
import { getAuthenticatedAdmin } from "@/utils/api/auth";

/**
 * PATCH /api/admin/users/[id]
 * Suspend or unsuspend a user.
 *
 * Body:
 *   - { action: "suspend", reason: string }
 *   - { action: "unsuspend" }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { user: adminUser, error: authError } = await getAuthenticatedAdmin();
    if (authError) return authError;

    const { id } = params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Invalid user ID", code: "INVALID_ID" },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.action) {
      return NextResponse.json(
        { error: "Body must contain { action: 'suspend' | 'unsuspend' }", code: "INVALID_BODY" },
        { status: 400 },
      );
    }

    const { action } = body;

    if (action !== "suspend" && action !== "unsuspend") {
      return NextResponse.json(
        { error: "action must be 'suspend' or 'unsuspend'", code: "INVALID_ACTION" },
        { status: 400 },
      );
    }

    // Validate reason for suspend action
    if (action === "suspend") {
      if (!body.reason || typeof body.reason !== "string" || body.reason.trim().length === 0) {
        return NextResponse.json(
          { error: "A reason is required when suspending a user", code: "REASON_REQUIRED" },
          { status: 400 },
        );
      }
    }

    // Fetch the target user
    const targetUser = await db
      .select({
        id: usersTable.id,
        role: usersTable.role,
        username: usersTable.username,
        is_suspended: usersTable.is_suspended,
      })
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);

    if (targetUser.length === 0) {
      return NextResponse.json(
        { error: "User not found", code: "USER_NOT_FOUND" },
        { status: 404 },
      );
    }

    // Cannot suspend other admins
    if (targetUser[0].role === "admin") {
      return NextResponse.json(
        { error: "Cannot suspend an admin user", code: "CANNOT_SUSPEND_ADMIN" },
        { status: 403 },
      );
    }

    // Build update payload immutably
    const updatePayload =
      action === "suspend"
        ? {
            is_suspended: true,
            suspended_at: new Date(),
            suspension_reason: body.reason.trim(),
            updated_at: new Date(),
          }
        : {
            is_suspended: false,
            suspended_at: null,
            suspension_reason: null,
            updated_at: new Date(),
          };

    const updated = await db
      .update(usersTable)
      .set(updatePayload)
      .where(eq(usersTable.id, id))
      .returning({
        id: usersTable.id,
        username: usersTable.username,
        display_name: usersTable.display_name,
        is_suspended: usersTable.is_suspended,
        suspended_at: usersTable.suspended_at,
        suspension_reason: usersTable.suspension_reason,
      });

    if (updated.length === 0) {
      return NextResponse.json(
        { error: "Failed to update user", code: "UPDATE_FAILED" },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: { user: updated[0] } });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("PATCH /api/admin/users/[id] error:", message);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
