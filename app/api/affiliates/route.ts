export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import {
  affiliatesTable,
  referralsTable,
  affiliateCommissionsTable,
  usersTable,
} from "@/utils/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getAuthenticatedUser } from "@/utils/api/auth";

function generateReferralCode(username: string): string {
  const randomBytes = new Uint8Array(4);
  crypto.getRandomValues(randomBytes);
  const suffix = Array.from(randomBytes)
    .map((b) => b.toString(36).charAt(0))
    .join("");
  return `${username}-${suffix}`;
}

/**
 * GET /api/affiliates
 * Returns the authenticated user's affiliate data including:
 * - Affiliate record (auto-created if missing)
 * - Referrals list with per-referral commission totals
 * - Commission history
 */
export async function GET() {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    // Get or create affiliate profile
    let affiliateRows = await db
      .select()
      .from(affiliatesTable)
      .where(eq(affiliatesTable.user_id, user.id))
      .limit(1);

    if (affiliateRows.length === 0) {
      // Get username for referral code
      const userRecord = await db
        .select({ username: usersTable.username })
        .from(usersTable)
        .where(eq(usersTable.id, user.id))
        .limit(1);

      const username = userRecord[0]?.username ?? "user";

      // Check if the plain username code is already taken
      const existingCode = await db
        .select({ id: affiliatesTable.id })
        .from(affiliatesTable)
        .where(eq(affiliatesTable.referral_code, username))
        .limit(1);

      const code =
        existingCode.length > 0 ? generateReferralCode(username) : username;

      affiliateRows = await db
        .insert(affiliatesTable)
        .values({
          user_id: user.id,
          referral_code: code,
        })
        .returning();
    }

    const currentAffiliate = affiliateRows[0];

    // Get referrals with per-referral commission totals and user role
    const referrals = await db
      .select({
        id: referralsTable.id,
        referred_user_id: referralsTable.referred_user_id,
        status: referralsTable.status,
        created_at: referralsTable.created_at,
        converted_at: referralsTable.converted_at,
        username: usersTable.username,
        display_name: usersTable.display_name,
        role: usersTable.role,
      })
      .from(referralsTable)
      .innerJoin(usersTable, eq(referralsTable.referred_user_id, usersTable.id))
      .where(eq(referralsTable.referrer_id, user.id))
      .orderBy(desc(referralsTable.created_at))
      .limit(100);

    // Get commission totals per referral
    const commissionsByReferral = await db
      .select({
        referral_id: affiliateCommissionsTable.referral_id,
        total: sql<number>`coalesce(sum(${affiliateCommissionsTable.commission_amount_usdc}), 0)`,
      })
      .from(affiliateCommissionsTable)
      .where(eq(affiliateCommissionsTable.affiliate_id, currentAffiliate.id))
      .groupBy(affiliateCommissionsTable.referral_id);

    const commissionMap = new Map(
      commissionsByReferral.map((c) => [c.referral_id, Number(c.total)])
    );

    const referralsWithCommission = referrals.map((ref) => ({
      ...ref,
      total_commission_usdc: commissionMap.get(ref.id) ?? 0,
    }));

    // Compute stats: creator vs fan referral counts
    const creatorReferrals = referrals.filter((r) => r.role === "creator").length;
    const fanReferrals = referrals.filter((r) => r.role === "subscriber").length;

    // Get recent commissions
    const commissions = await db
      .select()
      .from(affiliateCommissionsTable)
      .where(eq(affiliateCommissionsTable.affiliate_id, currentAffiliate.id))
      .orderBy(desc(affiliateCommissionsTable.created_at))
      .limit(50);

    return NextResponse.json({
      data: {
        affiliate: {
          referral_code: currentAffiliate.referral_code,
          referral_link: `https://openfans.online/ref/${currentAffiliate.referral_code}`,
          commission_rate: currentAffiliate.commission_rate,
          total_referrals: currentAffiliate.total_referrals,
          total_earnings_usdc: currentAffiliate.total_earnings_usdc,
          pending_earnings_usdc: currentAffiliate.pending_earnings_usdc,
          is_active: currentAffiliate.is_active,
          creator_referrals: creatorReferrals,
          fan_referrals: fanReferrals,
        },
        referrals: referralsWithCommission,
        commissions,
      },
    });
  } catch (error) {
    console.error("GET /api/affiliates error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
