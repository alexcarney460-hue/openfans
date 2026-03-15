export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { subscriptionsTable, usersTable } from "@/utils/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getAuthenticatedUser } from "@/utils/api/auth";

const ALLOWED_SUBSCRIBER_LIST_ROLES = ["creator", "admin"] as const;

/**
 * GET /api/subscribers
 * Returns a list of users who have active subscriptions to the authenticated creator.
 */
export async function GET() {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    // Only creators and admins can view subscriber lists
    const userRecord = await db
      .select({ role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .limit(1);

    const userRole = userRecord[0]?.role;
    if (!userRole || !ALLOWED_SUBSCRIBER_LIST_ROLES.includes(userRole as typeof ALLOWED_SUBSCRIBER_LIST_ROLES[number])) {
      return NextResponse.json(
        { error: "Only creators and admins can view subscribers", code: "FORBIDDEN" },
        { status: 403 },
      );
    }

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
