import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { dmcaRequestsTable } from "@/utils/db/schema";
import { checkRateLimit, getRateLimitKey } from "@/utils/rate-limit";
import { getAuthenticatedAdmin } from "@/utils/api/auth";
import { eq, sql } from "drizzle-orm";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_TEXT_LENGTH = 10000;
const MAX_NAME_LENGTH = 200;

const VALID_STATUSES = ["pending", "approved", "rejected", "counter_filed"] as const;
type DmcaStatus = (typeof VALID_STATUSES)[number];

/**
 * POST /api/dmca
 * Public endpoint: submit a DMCA takedown request.
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitKey = getRateLimitKey(request);
    const rateLimited = await checkRateLimit(request, rateLimitKey, "dmca", 3, 60_000);
    if (rateLimited) return rateLimited;

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body", code: "INVALID_BODY" },
        { status: 400 },
      );
    }

    // Honeypot anti-spam check
    if (body.website) {
      return NextResponse.json({ data: { success: true } });
    }

    const {
      complainant_name,
      complainant_email,
      copyrighted_work,
      infringing_urls,
      good_faith,
      accuracy_statement,
      signature,
    } = body;

    // Validate complainant_name
    if (typeof complainant_name !== "string" || complainant_name.trim().length === 0) {
      return NextResponse.json(
        { error: "Full legal name is required", code: "INVALID_NAME" },
        { status: 400 },
      );
    }
    if (complainant_name.trim().length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        { error: `Name must be under ${MAX_NAME_LENGTH} characters`, code: "NAME_TOO_LONG" },
        { status: 400 },
      );
    }

    // Validate email
    if (typeof complainant_email !== "string" || !EMAIL_REGEX.test(complainant_email.trim())) {
      return NextResponse.json(
        { error: "A valid email address is required", code: "INVALID_EMAIL" },
        { status: 400 },
      );
    }

    // Validate copyrighted_work
    if (typeof copyrighted_work !== "string" || copyrighted_work.trim().length === 0) {
      return NextResponse.json(
        { error: "Description of copyrighted work is required", code: "INVALID_WORK" },
        { status: 400 },
      );
    }
    if (copyrighted_work.trim().length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `Description must be under ${MAX_TEXT_LENGTH} characters`, code: "WORK_TOO_LONG" },
        { status: 400 },
      );
    }

    // Validate infringing_urls
    if (typeof infringing_urls !== "string" || infringing_urls.trim().length === 0) {
      return NextResponse.json(
        { error: "At least one infringing URL is required", code: "INVALID_URLS" },
        { status: 400 },
      );
    }
    if (infringing_urls.trim().length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `URLs must be under ${MAX_TEXT_LENGTH} characters`, code: "URLS_TOO_LONG" },
        { status: 400 },
      );
    }

    // Validate checkboxes
    if (good_faith !== true) {
      return NextResponse.json(
        { error: "You must confirm the good faith statement", code: "GOOD_FAITH_REQUIRED" },
        { status: 400 },
      );
    }
    if (accuracy_statement !== true) {
      return NextResponse.json(
        { error: "You must confirm the accuracy statement under penalty of perjury", code: "ACCURACY_REQUIRED" },
        { status: 400 },
      );
    }

    // Validate signature
    if (typeof signature !== "string" || signature.trim().length === 0) {
      return NextResponse.json(
        { error: "Electronic signature is required", code: "INVALID_SIGNATURE" },
        { status: 400 },
      );
    }
    if (signature.trim().length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        { error: `Signature must be under ${MAX_NAME_LENGTH} characters`, code: "SIGNATURE_TOO_LONG" },
        { status: 400 },
      );
    }

    const inserted = await db
      .insert(dmcaRequestsTable)
      .values({
        complainant_name: complainant_name.trim(),
        complainant_email: complainant_email.trim().toLowerCase(),
        copyrighted_work: copyrighted_work.trim(),
        infringing_urls: infringing_urls.trim(),
        good_faith: true,
        accuracy_statement: true,
        signature: signature.trim(),
      })
      .returning({ id: dmcaRequestsTable.id });

    return NextResponse.json(
      { data: { id: inserted[0].id }, message: "DMCA takedown request submitted successfully" },
      { status: 201 },
    );
  } catch (err) {
    console.error("POST /api/dmca error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/dmca
 * Admin-only: list all DMCA requests with optional status filter.
 */
export async function GET(request: NextRequest) {
  try {
    const { error: authError } = await getAuthenticatedAdmin();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") as DmcaStatus | null;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));
    const offset = (page - 1) * limit;

    if (statusFilter && !VALID_STATUSES.includes(statusFilter)) {
      return NextResponse.json(
        { error: "Invalid status filter", code: "INVALID_STATUS" },
        { status: 400 },
      );
    }

    const conditions = statusFilter
      ? sql`WHERE status = ${statusFilter}`
      : sql``;

    const results = await db.execute(sql`
      SELECT *
      FROM dmca_requests
      ${conditions}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    const countConditions = statusFilter
      ? eq(dmcaRequestsTable.status, statusFilter)
      : undefined;

    const countQuery = countConditions
      ? db.select({ count: sql<number>`count(*)::int` }).from(dmcaRequestsTable).where(countConditions)
      : db.select({ count: sql<number>`count(*)::int` }).from(dmcaRequestsTable);

    const countResult = await countQuery;
    const total = countResult[0]?.count ?? 0;

    return NextResponse.json({
      data: results,
      meta: { page, limit, total, total_pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("GET /api/dmca error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
