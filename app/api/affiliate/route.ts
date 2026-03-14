import { NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import {
  affiliatesTable,
  referralsTable,
  affiliateCommissionsTable,
  usersTable,
} from "@/utils/db/schema";
import { eq, desc } from "drizzle-orm";
import { getAuthenticatedUser } from "@/utils/api/auth";

function generateReferralCode(username: string): string {
  const suffix = Math.random().toString(36).substring(2, 8);
  return `${username}-${suffix}`;
}

/**
 * GET /api/affiliate
 * Returns the user's affiliate profile, referrals, and commissions.
 */
export async function GET() {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    // Get or create affiliate profile
    let affiliate = await db
      .select()
      .from(affiliatesTable)
      .where(eq(affiliatesTable.user_id, user.id))
      .limit(1);

    if (affiliate.length === 0) {
      // Get username for referral code
      const userRecord = await db
        .select({ username: usersTable.username })
        .from(usersTable)
        .where(eq(usersTable.id, user.id))
        .limit(1);

      const username = userRecord[0]?.username ?? "user";
      const code = generateReferralCode(username);

      affiliate = await db
        .insert(affiliatesTable)
        .values({
          user_id: user.id,
          referral_code: code,
        })
        .returning();
    }

    const currentAffiliate = affiliate[0];

    // Get referrals
    const referrals = await db
      .select({
        id: referralsTable.id,
        referred_user_id: referralsTable.referred_user_id,
        status: referralsTable.status,
        created_at: referralsTable.created_at,
        converted_at: referralsTable.converted_at,
        username: usersTable.username,
        display_name: usersTable.display_name,
      })
      .from(referralsTable)
      .innerJoin(usersTable, eq(referralsTable.referred_user_id, usersTable.id))
      .where(eq(referralsTable.referrer_id, user.id))
      .orderBy(desc(referralsTable.created_at))
      .limit(50);

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
        },
        referrals,
        commissions,
      },
    });
  } catch (error) {
    console.error("GET /api/affiliate error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
