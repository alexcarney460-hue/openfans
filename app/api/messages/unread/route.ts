export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { messagesTable } from "@/utils/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getAuthenticatedUser } from "@/utils/api/auth";

/**
 * GET /api/messages/unread
 * Returns the total count of unread messages for the authenticated user.
 */
export async function GET() {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    const result = await db.execute(sql`
      SELECT COUNT(*)::int AS count
      FROM messages
      WHERE receiver_id = ${user.id} AND is_read = false
    `);

    const count = (result as unknown as Array<{ count: number }>)[0]?.count ?? 0;

    return NextResponse.json({ data: { count } });
  } catch (error) {
    console.error("GET /api/messages/unread error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
