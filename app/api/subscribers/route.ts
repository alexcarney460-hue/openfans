export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { subscriptionsTable, usersTable } from "@/utils/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getAuthenticatedUser } from "@/utils/api/auth";

/**
 * GET /api/subscribers
 * Returns a list of users who have active subscriptions to the authenticated creator.
 */
export async function GET() {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const subscribers = await db
      .select({
        id: subscriptionsTable.id,
        subscriber_id: subscriptionsTable.subscriber_id,
        username: usersTable.username,
        display_name: usersTable.display_name,
        avatar_url: usersTable.avatar_url,
        tier: subscriptionsTable.tier,
        status: subscriptionsTable.status,
        started_at: subscriptionsTable.started_at,
      })
      .from(subscriptionsTable)
      .innerJoin(
        usersTable,
        eq(subscriptionsTable.subscriber_id, usersTable.id),
      )
      .where(
        and(
          eq(subscriptionsTable.creator_id, user.id),
          eq(subscriptionsTable.status, "active"),
        ),
      )
      .orderBy(desc(subscriptionsTable.started_at));

    return NextResponse.json({ data: subscribers });
  } catch (error) {
    console.error("GET /api/subscribers error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
