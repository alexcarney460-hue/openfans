export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { dmcaRequestsTable, postsTable } from "@/utils/db/schema";
import { eq, sql } from "drizzle-orm";
import { getAuthenticatedAdmin } from "@/utils/api/auth";

const VALID_STATUSES = ["pending", "approved", "rejected", "counter_filed"] as const;
const VALID_ACTIONS = ["approve", "reject", "counter_filed"] as const;

type DmcaStatus = (typeof VALID_STATUSES)[number];
type DmcaAction = (typeof VALID_ACTIONS)[number];

/**
 * GET /api/admin/dmca
 * List DMCA requests with optional status filter.
 */
export async function GET(request: NextRequest) {
  try {
    const { error: authError } = await getAuthenticatedAdmin();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const statusFilter = (searchParams.get("status") || "pending") as DmcaStatus;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));
    const offset = (page - 1) * limit;

    if (!VALID_STATUSES.includes(statusFilter)) {
      return NextResponse.json(
        { error: "Invalid status filter", code: "INVALID_STATUS" },
        { status: 400 },
      );
    }

    const results = await db.execute(sql`
      SELECT
        d.*,
        p.title AS post_title,
        p.is_hidden AS post_is_hidden
      FROM dmca_requests d
      LEFT JOIN posts p ON d.post_id = p.id
      WHERE d.status = ${statusFilter}
      ORDER BY d.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(dmcaRequestsTable)
      .where(eq(dmcaRequestsTable.status, statusFilter));

    const total = countResult[0]?.count ?? 0;

    return NextResponse.json({
      data: results,
      meta: { page, limit, total, total_pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("GET /api/admin/dmca error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/dmca
 * Take action on a DMCA request.
 *
 * Body:
 *   - request_id: number (required)
 *   - action: "approve" | "reject" | "counter_filed" (required)
 *   - notes: string (optional admin notes)
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

    const { request_id, action, notes } = body;

    if (!request_id || typeof request_id !== "number") {
      return NextResponse.json(
        { error: "request_id is required and must be a number", code: "MISSING_REQUEST_ID" },
        { status: 400 },
      );
    }

    if (!action || !VALID_ACTIONS.includes(action as DmcaAction)) {
      return NextResponse.json(
        { error: `action must be one of: ${VALID_ACTIONS.join(", ")}`, code: "INVALID_ACTION" },
        { status: 400 },
      );
    }

    // Fetch the request
    const requestResults = await db
      .select()
      .from(dmcaRequestsTable)
      .where(eq(dmcaRequestsTable.id, request_id))
      .limit(1);

    if (requestResults.length === 0) {
      return NextResponse.json(
        { error: "DMCA request not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    const dmcaRequest = requestResults[0];
    const now = new Date();

    switch (action as DmcaAction) {
      case "approve": {
        // Hide the associated post if there is one
        if (dmcaRequest.post_id) {
          await db
            .update(postsTable)
            .set({ is_hidden: true })
            .where(eq(postsTable.id, dmcaRequest.post_id));
        }
        await db
          .update(dmcaRequestsTable)
          .set({
            status: "approved" as const,
            admin_notes: notes?.trim() || "DMCA takedown approved - content hidden",
            resolved_at: now,
          })
          .where(eq(dmcaRequestsTable.id, request_id));
        break;
      }

      case "reject": {
        await db
          .update(dmcaRequestsTable)
          .set({
            status: "rejected" as const,
            admin_notes: notes?.trim() || "DMCA request rejected",
            resolved_at: now,
          })
          .where(eq(dmcaRequestsTable.id, request_id));
        break;
      }

      case "counter_filed": {
        await db
          .update(dmcaRequestsTable)
          .set({
            status: "counter_filed" as const,
            admin_notes: notes?.trim() || "Counter-notification filed",
            resolved_at: now,
          })
          .where(eq(dmcaRequestsTable.id, request_id));
        break;
      }
    }

    const statusMap: Record<DmcaAction, DmcaStatus> = {
      approve: "approved",
      reject: "rejected",
      counter_filed: "counter_filed",
    };

    return NextResponse.json({
      data: {
        request_id,
        action,
        status: statusMap[action as DmcaAction],
      },
    });
  } catch (err) {
    console.error("POST /api/admin/dmca error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
