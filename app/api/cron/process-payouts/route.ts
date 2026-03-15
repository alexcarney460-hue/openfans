export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import {
  payoutsTable,
  walletsTable,
  walletTransactionsTable,
} from "@/utils/db/schema";
import { sql } from "drizzle-orm";
import { createNotification } from "@/utils/notifications";

/** Minimum payout amount in cents. Must match the manual payout request minimum. */
const MINIMUM_PAYOUT_CENTS = 500; // $5.00

/** Days between payouts for each schedule type. */
const SCHEDULE_INTERVALS: Record<string, number> = {
  weekly: 7,
  monthly: 30,
};

interface EligibleCreator {
  user_id: string;
  wallet_address: string;
  balance_usdc: number;
  minimum_balance_usdc: number;
  wallet_id: number;
  payout_schedule: string;
}

/**
 * GET /api/cron/process-payouts
 *
 * Cron-compatible endpoint that creates payout records for creators
 * who have configured automatic payout schedules (weekly or monthly).
 *
 * For each qualifying creator:
 * - payout_schedule is 'weekly' or 'monthly'
 * - Last payout was N+ days ago (or they have never had a payout)
 * - Available balance (balance - minimum_balance) >= $5 minimum
 * - A connected wallet_address on their user profile
 *
 * Creates payout records with status 'pending' for admin processing.
 * Protected by CRON_SECRET to prevent unauthorized invocation.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const now = new Date();

    const results = {
      processed: 0,
      payouts_created: 0,
      skipped_insufficient_balance: 0,
      skipped_too_recent: 0,
      errors: 0,
      details: [] as Array<{
        user_id: string;
        amount_usdc: number;
        status: "created" | "skipped" | "error";
        reason?: string;
      }>,
    };

    // Find creators with automatic payout schedules who have a wallet and sufficient balance.
    // We use raw SQL because payout_schedule is a column added outside the Drizzle schema.
    const eligibleCreatorsRaw = await db.execute(sql`
      SELECT
        u.id AS user_id,
        u.wallet_address,
        w.balance_usdc,
        w.minimum_balance_usdc,
        w.id AS wallet_id,
        cp.payout_schedule
      FROM creator_profiles cp
      JOIN users_table u ON u.id = cp.user_id
      JOIN wallets w ON w.user_id = cp.user_id
      WHERE cp.payout_schedule IN ('weekly', 'monthly')
        AND u.wallet_address IS NOT NULL
        AND u.wallet_address != ''
        AND u.is_suspended = false
        AND (w.balance_usdc - w.minimum_balance_usdc) >= ${MINIMUM_PAYOUT_CENTS}
    `);
    const eligibleCreators = eligibleCreatorsRaw as unknown as EligibleCreator[];

    for (const creator of eligibleCreators) {
      results.processed++;

      try {
        // Check when the last payout was created for this creator
        const intervalDays = SCHEDULE_INTERVALS[creator.payout_schedule];
        if (!intervalDays) {
          results.skipped_too_recent++;
          results.details.push({
            user_id: creator.user_id,
            amount_usdc: 0,
            status: "skipped",
            reason: `Unknown schedule: ${creator.payout_schedule}`,
          });
          continue;
        }

        const cutoffDate = new Date(now.getTime() - intervalDays * 24 * 60 * 60 * 1000);

        const recentPayoutsRaw = await db.execute(sql`
          SELECT COUNT(*)::text AS count
          FROM payouts
          WHERE creator_id = ${creator.user_id}
            AND created_at > ${cutoffDate}
        `);
        const recentPayouts = recentPayoutsRaw as unknown as Array<{ count: string }>;

        const recentCount = parseInt(recentPayouts[0]?.count ?? "0", 10);
        if (recentCount > 0) {
          results.skipped_too_recent++;
          results.details.push({
            user_id: creator.user_id,
            amount_usdc: 0,
            status: "skipped",
            reason: `Payout created within last ${intervalDays} days`,
          });
          continue;
        }

        // Calculate available balance
        const availableBalance = creator.balance_usdc - creator.minimum_balance_usdc;

        if (availableBalance < MINIMUM_PAYOUT_CENTS) {
          results.skipped_insufficient_balance++;
          results.details.push({
            user_id: creator.user_id,
            amount_usdc: 0,
            status: "skipped",
            reason: `Available balance $${(availableBalance / 100).toFixed(2)} below minimum`,
          });
          continue;
        }

        // Wrap debit + payout + transaction in a single DB transaction
        let payoutCreated = false;
        let payoutId: number | null = null;

        try {
          await db.transaction(async (tx) => {
            // Atomically debit the wallet — only succeeds if sufficient funds above minimum
            const updatedRows = await tx
              .update(walletsTable)
              .set({
                balance_usdc: sql`${walletsTable.balance_usdc} - ${availableBalance}`,
                updated_at: now,
              })
              .where(
                sql`${walletsTable.id} = ${creator.wallet_id}
                  AND ${walletsTable.balance_usdc} - ${walletsTable.minimum_balance_usdc} >= ${availableBalance}`,
              )
              .returning();

            if (updatedRows.length === 0) {
              throw new Error("INSUFFICIENT_BALANCE");
            }

            const newBalance = updatedRows[0].balance_usdc;

            // Create the payout record (pending for admin processing)
            const payoutRecord = await tx
              .insert(payoutsTable)
              .values({
                creator_id: creator.user_id,
                amount_usdc: availableBalance,
                wallet_address: creator.wallet_address,
                status: "pending",
              })
              .returning();

            payoutId = payoutRecord[0].id;

            // Record the wallet transaction
            await tx.insert(walletTransactionsTable).values({
              wallet_id: creator.wallet_id,
              user_id: creator.user_id,
              type: "withdrawal",
              amount_usdc: -availableBalance,
              balance_after: newBalance,
              description: `Auto-payout (${creator.payout_schedule}) to ${creator.wallet_address.slice(0, 4)}...${creator.wallet_address.slice(-4)}`,
              reference_id: `payout:${payoutRecord[0].id}`,
              status: "pending",
            });

            payoutCreated = true;
          });
        } catch (txErr) {
          if (txErr instanceof Error && txErr.message === "INSUFFICIENT_BALANCE") {
            results.skipped_insufficient_balance++;
            results.details.push({
              user_id: creator.user_id,
              amount_usdc: availableBalance,
              status: "skipped",
              reason: "Balance changed during processing (race condition)",
            });
            continue;
          }
          throw txErr;
        }

        if (!payoutCreated) continue;

        // Notify the creator (outside transaction — non-critical)
        const payoutDollars = (availableBalance / 100).toFixed(2);
        await createNotification(
          creator.user_id,
          "payout_completed",
          "Auto-payout queued",
          `A ${creator.payout_schedule} payout of $${payoutDollars} USDC has been queued for processing.`,
          String(payoutId),
        );

        results.payouts_created++;
        results.details.push({
          user_id: creator.user_id,
          amount_usdc: availableBalance,
          status: "created",
        });
      } catch (error) {
        console.error(`Error processing auto-payout for creator ${creator.user_id}:`, error);
        results.errors++;
        results.details.push({
          user_id: creator.user_id,
          amount_usdc: 0,
          status: "error",
          reason: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Cron process-payouts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
