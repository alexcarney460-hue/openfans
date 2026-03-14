export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { creatorProfilesTable, usersTable } from "@/utils/db/schema";
import { eq } from "drizzle-orm";
import { getAuthenticatedUser } from "@/utils/api/auth";

/**
 * GET /api/verification
 * Returns the current user's verification status.
 */
export async function GET() {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const profile = await db
      .select({
        verification_status: creatorProfilesTable.verification_status,
        verification_submitted_at: creatorProfilesTable.verification_submitted_at,
        verification_notes: creatorProfilesTable.verification_notes,
      })
      .from(creatorProfilesTable)
      .where(eq(creatorProfilesTable.user_id, user.id))
      .limit(1);

    if (profile.length === 0) {
      return NextResponse.json(
        { error: "Creator profile not found", code: "NO_CREATOR_PROFILE" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      data: {
        verification_status: profile[0].verification_status,
        verification_submitted_at: profile[0].verification_submitted_at,
        verification_notes: profile[0].verification_notes,
      },
    });
  } catch (err) {
    console.error("GET /api/verification error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/verification
 * Submit verification documents.
 *
 * Body (JSON):
 *   - legal_name: string (required)
 *   - date_of_birth: string YYYY-MM-DD (required, must be 18+)
 *   - document_url: string (required, Supabase storage URL)
 *   - selfie_url: string (required, Supabase storage URL)
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    // Verify the user is a creator
    const userResult = await db
      .select({ role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .limit(1);

    if (userResult.length === 0 || (userResult[0].role !== "creator" && userResult[0].role !== "admin")) {
      return NextResponse.json(
        { error: "Only creators can submit verification", code: "NOT_CREATOR" },
        { status: 403 },
      );
    }

    // Check creator profile exists
    const profile = await db
      .select({
        verification_status: creatorProfilesTable.verification_status,
      })
      .from(creatorProfilesTable)
      .where(eq(creatorProfilesTable.user_id, user.id))
      .limit(1);

    if (profile.length === 0) {
      return NextResponse.json(
        { error: "Creator profile not found", code: "NO_CREATOR_PROFILE" },
        { status: 404 },
      );
    }

    // Don't allow resubmission if already pending or verified
    if (profile[0].verification_status === "pending") {
      return NextResponse.json(
        { error: "Verification is already under review", code: "ALREADY_PENDING" },
        { status: 400 },
      );
    }

    if (profile[0].verification_status === "verified") {
      return NextResponse.json(
        { error: "You are already verified", code: "ALREADY_VERIFIED" },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body", code: "INVALID_BODY" },
        { status: 400 },
      );
    }

    const { legal_name, date_of_birth, document_url, selfie_url } = body;

    // Validate legal_name
    if (!legal_name || typeof legal_name !== "string" || legal_name.trim().length < 2) {
      return NextResponse.json(
        { error: "Legal name is required (minimum 2 characters)", code: "INVALID_LEGAL_NAME" },
        { status: 400 },
      );
    }

    // Validate date_of_birth format and age
    if (!date_of_birth || typeof date_of_birth !== "string") {
      return NextResponse.json(
        { error: "Date of birth is required", code: "MISSING_DOB" },
        { status: 400 },
      );
    }

    const dobMatch = date_of_birth.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!dobMatch) {
      return NextResponse.json(
        { error: "Date of birth must be in YYYY-MM-DD format", code: "INVALID_DOB_FORMAT" },
        { status: 400 },
      );
    }

    const dob = new Date(date_of_birth + "T00:00:00Z");
    if (isNaN(dob.getTime())) {
      return NextResponse.json(
        { error: "Invalid date of birth", code: "INVALID_DOB" },
        { status: 400 },
      );
    }

    // Check 18+ age
    const today = new Date();
    const eighteenYearsAgo = new Date(
      today.getFullYear() - 18,
      today.getMonth(),
      today.getDate(),
    );

    if (dob > eighteenYearsAgo) {
      return NextResponse.json(
        { error: "You must be at least 18 years old", code: "UNDERAGE" },
        { status: 400 },
      );
    }

    // Validate document and selfie URLs
    if (!document_url || typeof document_url !== "string") {
      return NextResponse.json(
        { error: "Government ID photo is required", code: "MISSING_DOCUMENT" },
        { status: 400 },
      );
    }

    if (!selfie_url || typeof selfie_url !== "string") {
      return NextResponse.json(
        { error: "Selfie holding ID is required", code: "MISSING_SELFIE" },
        { status: 400 },
      );
    }

    // Update creator profile with verification data
    await db
      .update(creatorProfilesTable)
      .set({
        legal_name: legal_name.trim(),
        date_of_birth,
        verification_document_url: document_url,
        verification_selfie_url: selfie_url,
        verification_status: "pending",
        verification_submitted_at: new Date(),
        verification_notes: null, // clear any previous rejection notes
      })
      .where(eq(creatorProfilesTable.user_id, user.id));

    return NextResponse.json(
      { data: { verification_status: "pending" } },
      { status: 200 },
    );
  } catch (err) {
    console.error("POST /api/verification error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
