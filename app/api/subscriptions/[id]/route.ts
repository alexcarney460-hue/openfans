export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { subscriptionsTable } from "@/utils/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthenticatedUser } from "@/utils/api/auth";

/**
 * PATCH /api/subscriptions/[id]
 *
 * Update subscription settings. Currently supports toggling auto_renew.
 *
 * Body: { auto_renew: boolean }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const { id } = await params;
    const subscriptionId = parseInt(id, 10);

    if (isNaN(subscriptionId)) {
      return NextResponse.json(
        { error: "Invalid subscription ID", code: "INVALID_ID" },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body.auto_renew !== "boolean") {
      return NextResponse.json(
        { error: "auto_renew (boolean) is required", code: "INVALID_BODY" },
        { status: 400 },
      );
    }

    // Only allow the subscriber to update their own subscription
    const updated = await db
      .update(subscriptionsTable)
      .set({ auto_renew: body.auto_renew })
      .where(
        and(
          eq(subscriptionsTable.id, subscriptionId),
          eq(subscriptionsTable.subscriber_id, user.id),
        ),
      )
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: "Subscription not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: updated[0] });
  } catch (error) {
    console.error("PATCH /api/subscriptions/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
