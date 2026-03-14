export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { creatorProfilesTable, usersTable } from "@/utils/db/schema";
import { eq } from "drizzle-orm";
import { getAuthenticatedAdmin } from "@/utils/api/auth";

/**
 * GET /api/admin/verification
 * List pending verifications (admin only).
 * Optionally filter by status with ?status=pending|verified|rejected|unverified
 */
export async function GET(request: NextRequest) {
  try {
    const { error: authError } = await getAuthenticatedAdmin();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") || "pending";

    const validStatuses = ["unverified", "pending", "verified", "rejected"];
    if (!validStatuses.includes(statusFilter)) {
      return NextResponse.json(
        { error: "Invalid status filter", code: "INVALID_STATUS" },
        { status: 400 },
      );
    }

    const results = await db
      .select({
        creator_profile_id: creatorProfilesTable.id,
        user_id: creatorProfilesTable.user_id,
        verification_status: creatorProfilesTable.verification_status,
        verification_submitted_at: creatorProfilesTable.verification_submitted_at,
        verification_document_url: creatorProfilesTable.verification_document_url,
        verification_selfie_url: creatorProfilesTable.verification_selfie_url,
        verification_notes: creatorProfilesTable.verification_notes,
        date_of_birth: creatorProfilesTable.date_of_birth,
        legal_name: creatorProfilesTable.legal_name,
        display_name: usersTable.display_name,
        username: usersTable.username,
        email: usersTable.email,
        avatar_url: usersTable.avatar_url,
      })
      .from(creatorProfilesTable)
      .innerJoin(usersTable, eq(creatorProfilesTable.user_id, usersTable.id))
      .where(
        eq(
          creatorProfilesTable.verification_status,
          statusFilter as "unverified" | "pending" | "verified" | "rejected",
        ),
      );

    return NextResponse.json({ data: results });
  } catch (err) {
    console.error("GET /api/admin/verification error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/verification
 * Approve or reject a verification (admin only).
 *
 * Body:
 *   - creator_id: string (user_id of the creator)
 *   - action: "approve" | "reject"
 *   - notes?: string (required for reject)
 */
export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await getAuthenticatedAdmin();
    if (authError) return authError;

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body", code: "INVALID_BODY" },
        { status: 400 },
      );
    }

    const { creator_id, action, notes } = body;

    if (!creator_id || typeof creator_id !== "string") {
      return NextResponse.json(
        { error: "creator_id is required", code: "MISSING_CREATOR_ID" },
        { status: 400 },
      );
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: "action must be 'approve' or 'reject'", code: "INVALID_ACTION" },
        { status: 400 },
      );
    }

    if (action === "reject" && (!notes || typeof notes !== "string" || notes.trim().length === 0)) {
      return NextResponse.json(
        { error: "Rejection reason is required", code: "MISSING_NOTES" },
        { status: 400 },
      );
    }

    // Verify the creator profile exists and is pending
    const profile = await db
      .select({ verification_status: creatorProfilesTable.verification_status })
      .from(creatorProfilesTable)
      .where(eq(creatorProfilesTable.user_id, creator_id))
      .limit(1);

    if (profile.length === 0) {
      return NextResponse.json(
        { error: "Creator profile not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    if (profile[0].verification_status !== "pending") {
      return NextResponse.json(
        { error: "This verification is not in pending status", code: "NOT_PENDING" },
        { status: 400 },
      );
    }

    if (action === "approve") {
      await db
        .update(creatorProfilesTable)
        .set({
          verification_status: "verified",
          verification_notes: null,
        })
        .where(eq(creatorProfilesTable.user_id, creator_id));
    } else {
      await db
        .update(creatorProfilesTable)
        .set({
          verification_status: "rejected",
          verification_notes: notes.trim(),
        })
        .where(eq(creatorProfilesTable.user_id, creator_id));
    }

    return NextResponse.json({
      data: {
        creator_id,
        verification_status: action === "approve" ? "verified" : "rejected",
      },
    });
  } catch (err) {
    console.error("POST /api/admin/verification error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
