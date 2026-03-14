export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { usersTable } from "@/utils/db/schema";
import { eq } from "drizzle-orm";
import { getAuthenticatedAdmin } from "@/utils/api/auth";

/**
 * POST /api/admin/creators/[id]/verify
 * Toggle a creator's verified status.
 *
 * Body: { verified: boolean }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { error: authError } = await getAuthenticatedAdmin();
    if (authError) return authError;

    const { id } = params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Invalid user ID", code: "INVALID_ID" },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body.verified !== "boolean") {
      return NextResponse.json(
        { error: "Body must contain { verified: boolean }", code: "INVALID_BODY" },
        { status: 400 },
      );
    }

    // Verify the user exists and is a creator
    const existingUser = await db
      .select({ id: usersTable.id, role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: "User not found", code: "USER_NOT_FOUND" },
        { status: 404 },
      );
    }

    if (existingUser[0].role !== "creator") {
      return NextResponse.json(
        { error: "User is not a creator", code: "NOT_CREATOR" },
        { status: 400 },
      );
    }

    // Update the verified status
    const updated = await db
      .update(usersTable)
      .set({
        is_verified: body.verified,
        updated_at: new Date(),
      })
      .where(eq(usersTable.id, id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: "Failed to update user", code: "UPDATE_FAILED" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      data: {
        user: {
          id: updated[0].id,
          username: updated[0].username,
          display_name: updated[0].display_name,
          is_verified: updated[0].is_verified,
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("POST /api/admin/creators/[id]/verify error:", message);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
