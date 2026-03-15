import { db } from "@/utils/db/db";
import {
  referralsTable,
  affiliatesTable,
  affiliateCommissionsTable,
  walletsTable,
  walletTransactionsTable,
} from "@/utils/db/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * Process referral commission when a referred creator earns revenue.
 *
 * Checks if the creator (who just received payment) was referred by someone.
 * If so, calculates 1% commission and credits the referrer's wallet.
 *
 * @param creatorId - The creator who earned the revenue
 * @param sourceType - "subscription" or "tip"
 * @param sourceAmountUsdc - The payment amount in cents (before platform fee)
 * @param paymentReference - Transaction reference ID
 * @param payerId - The user who made the payment (for wallet transaction records)
 */
export async function processReferralCommission(
  creatorId: string,
  sourceType: "subscription" | "tip",
  sourceAmountUsdc: number,
  paymentReference: string,
  payerId: string,
): Promise<void> {
  // Skip if amount is zero or negative
  if (sourceAmountUsdc <= 0) return;

  try {
    // Check if this creator was referred by someone
    const referral = await db
      .select({
        id: referralsTable.id,
        referrer_id: referralsTable.referrer_id,
      })
      .from(referralsTable)
      .where(
        and(
          eq(referralsTable.referred_user_id, creatorId),
          eq(referralsTable.status, "active"),
        ),
      )
      .limit(1);

    if (referral.length === 0) return;

    const { id: referralId, referrer_id: referrerId } = referral[0];

    // Get the referrer's affiliate record to find their commission rate
    const affiliate = await db
      .select({
        id: affiliatesTable.id,
        commission_rate: affiliatesTable.commission_rate,
        is_active: affiliatesTable.is_active,
      })
      .from(affiliatesTable)
      .where(eq(affiliatesTable.user_id, referrerId))
      .limit(1);

    if (affiliate.length === 0 || !affiliate[0].is_active) return;

    const { id: affiliateId, commission_rate: commissionRate } = affiliate[0];

    // Calculate commission (default 1%)
    const commissionAmountUsdc = Math.round(
      (sourceAmountUsdc * commissionRate) / 100,
    );

    // Minimum commission of 1 cent
    if (commissionAmountUsdc < 1) return;

    // Process all commission operations atomically
    await db.transaction(async (tx) => {
      // Record commission in the ledger
      await tx.insert(affiliateCommissionsTable).values({
        affiliate_id: affiliateId,
        referral_id: referralId,
        source_type: sourceType,
        source_amount_usdc: sourceAmountUsdc,
        commission_amount_usdc: commissionAmountUsdc,
        status: "pending",
      });

      // Update affiliate totals
      await tx
        .update(affiliatesTable)
        .set({
          total_earnings_usdc: sql`${affiliatesTable.total_earnings_usdc} + ${commissionAmountUsdc}`,
          pending_earnings_usdc: sql`${affiliatesTable.pending_earnings_usdc} + ${commissionAmountUsdc}`,
        })
        .where(eq(affiliatesTable.id, affiliateId));

      // Credit the referrer's wallet (upsert)
      const existingWallet = await tx
        .select()
        .from(walletsTable)
        .where(eq(walletsTable.user_id, referrerId))
        .limit(1);

      if (!existingWallet[0]) {
        await tx
          .insert(walletsTable)
          .values({ user_id: referrerId, balance_usdc: 0 });
      }

      const [updatedWallet] = await tx
        .update(walletsTable)
        .set({
          balance_usdc: sql`${walletsTable.balance_usdc} + ${commissionAmountUsdc}`,
          updated_at: new Date(),
        })
        .where(eq(walletsTable.user_id, referrerId))
        .returning();

      // Record wallet transaction for the referrer
      if (updatedWallet) {
        await tx.insert(walletTransactionsTable).values({
          wallet_id: updatedWallet.id,
          user_id: referrerId,
          type: "tip_received", // Using tip_received as closest match in enum
          amount_usdc: commissionAmountUsdc,
          balance_after: updatedWallet.balance_usdc,
          description: `Referral commission (${commissionRate}%) on ${sourceType}`,
          reference_id: paymentReference,
          related_user_id: payerId,
        });
      }
    });
  } catch (error) {
    // Don't fail the payment if commission processing fails
    console.error(
      "Referral commission processing error:",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
}
