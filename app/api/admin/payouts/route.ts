export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import {
  payoutsTable,
  walletTransactionsTable,
  walletsTable,
  usersTable,
} from "@/utils/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { getAuthenticatedAdmin } from "@/utils/api/auth";
import { sendUsdc } from "@/utils/solana/transfer";
import { createNotification } from "@/utils/notifications";
import { sendPayoutCompletedEmail } from "@/utils/email";

/**
 * GET /api/admin/payouts
 * List all payouts, optionally filtered by status.
 *
 * Query params:
 *   - status: "pending" | "completed" | "failed" (optional filter)
 *   - limit: number (default 50, max 200)
 */
export async function GET(request: NextRequest) {
  try {
    const { error: authError } = await getAuthenticatedAdmin();
    if (authError) return authError;

    const statusFilter = request.nextUrl.searchParams.get("status");
    const limit = Math.min(
      Math.max(
        parseInt(request.nextUrl.searchParams.get("limit") ?? "50", 10),
        1,
      ),
      200,
    );

    const validStatuses = ["pending", "processing", "completed", "failed"] as const;
    type PayoutStatus = (typeof validStatuses)[number];

    let payouts;
    if (
      statusFilter &&
      validStatuses.includes(statusFilter as PayoutStatus)
    ) {
      payouts = await db
        .select({
          id: payoutsTable.id,
          creator_id: payoutsTable.creator_id,
          amount_usdc: payoutsTable.amount_usdc,
          wallet_address: payoutsTable.wallet_address,
          payment_tx: payoutsTable.payment_tx,
          status: payoutsTable.status,
          created_at: payoutsTable.created_at,
          creator_username: usersTable.username,
          creator_display_name: usersTable.display_name,
        })
        .from(payoutsTable)
        .leftJoin(usersTable, eq(payoutsTable.creator_id, usersTable.id))
        .where(eq(payoutsTable.status, statusFilter as PayoutStatus))
        .orderBy(desc(payoutsTable.created_at))
        .limit(limit);
    } else {
      payouts = await db
        .select({
          id: payoutsTable.id,
          creator_id: payoutsTable.creator_id,
          amount_usdc: payoutsTable.amount_usdc,
          wallet_address: payoutsTable.wallet_address,
          payment_tx: payoutsTable.payment_tx,
          status: payoutsTable.status,
          created_at: payoutsTable.created_at,
          creator_username: usersTable.username,
          creator_display_name: usersTable.display_name,
        })
        .from(payoutsTable)
        .leftJoin(usersTable, eq(payoutsTable.creator_id, usersTable.id))
        .orderBy(desc(payoutsTable.created_at))
        .limit(limit);
    }

    return NextResponse.json({ data: { payouts } });
  } catch (error) {
    console.error("GET /api/admin/payouts error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/payouts
 * Process a pending payout: send USDC on-chain and update the record.
 *
 * Body:
 *   - payout_id: number
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

    const { payout_id } = body;

    if (typeof payout_id !== "number" || !Number.isInteger(payout_id)) {
      return NextResponse.json(
        { error: "payout_id must be an integer", code: "INVALID_PAYOUT_ID" },
        { status: 400 },
      );
    }

    // Atomically lock the payout by transitioning from 'pending' to 'processing'.
    // This prevents TOCTOU race conditions where two admin requests could both
    // read 'pending' and both send USDC.
    const lockedPayout = await db
      .update(payoutsTable)
      .set({ status: "processing" })
      .where(and(eq(payoutsTable.id, payout_id), eq(payoutsTable.status, "pending")))
      .returning();

    if (lockedPayout.length === 0) {
      return NextResponse.json(
        { error: "Payout already processed or not found", code: "PAYOUT_NOT_PENDING" },
        { status: 409 },
      );
    }

    const payout = lockedPayout[0];

    // Send USDC on-chain
    let txSignature: string;
    try {
      txSignature = await sendUsdc(payout.wallet_address, payout.amount_usdc);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `Failed to send USDC for payout ${payout_id}:`,
        message,
      );

      // Wrap the entire failure recovery in a transaction for atomicity:
      // mark payout failed, re-credit wallet (atomically), insert refund tx, update original tx
      await db.transaction(async (tx) => {
        await tx
          .update(payoutsTable)
          .set({ status: "failed" })
          .where(eq(payoutsTable.id, payout_id));

        // Re-credit the wallet balance atomically using SQL expression
        const wallets = await tx
          .select({ id: walletsTable.id })
          .from(walletsTable)
          .where(eq(walletsTable.user_id, payout.creator_id))
          .limit(1);

        if (wallets.length > 0) {
          const walletId = wallets[0].id;

          const updatedWallet = await tx
            .update(walletsTable)
            .set({
              balance_usdc: sql`${walletsTable.balance_usdc} + ${payout.amount_usdc}`,
              updated_at: new Date(),
            })
            .where(eq(walletsTable.id, walletId))
            .returning();

          // Record refund transaction
          await tx.insert(walletTransactionsTable).values({
            wallet_id: walletId,
            user_id: payout.creator_id,
            type: "refund",
            amount_usdc: payout.amount_usdc,
            balance_after: updatedWallet[0].balance_usdc,
            description: `Payout #${payout_id} failed: ${message}`,
            reference_id: `payout:${payout_id}:refund`,
            status: "completed",
          });

          // Update the original withdrawal transaction status
          await tx
            .update(walletTransactionsTable)
            .set({ status: "failed" })
            .where(
              and(
                eq(
                  walletTransactionsTable.reference_id,
                  `payout:${payout_id}`,
                ),
                eq(walletTransactionsTable.status, "pending"),
              ),
            );
        }
      });

      return NextResponse.json(
        {
          error: "On-chain transfer failed. Check the payout details and try again.",
          code: "TRANSFER_FAILED",
        },
        { status: 500 },
      );
    }

    // Mark payout as completed with the tx signature
    const updatedPayout = await db
      .update(payoutsTable)
      .set({
        status: "completed",
        payment_tx: txSignature,
      })
      .where(eq(payoutsTable.id, payout_id))
      .returning();

    // Update the wallet transaction status to completed
    await db
      .update(walletTransactionsTable)
      .set({
        status: "completed",
        reference_id: txSignature,
      })
      .where(
        and(
          eq(walletTransactionsTable.reference_id, `payout:${payout_id}`),
          eq(walletTransactionsTable.status, "pending"),
        ),
      );

    // Notify the creator about the completed payout
    const payoutDollars = (payout.amount_usdc / 100).toFixed(2);

    createNotification(
      payout.creator_id,
      "payout_completed",
      "Payout sent!",
      `Your payout of $${payoutDollars} USDC has been sent to your wallet.`,
      String(payout_id),
    );

    // Send email notification (fire-and-forget)
    const creatorInfo = await db
      .select({ email: usersTable.email })
      .from(usersTable)
      .where(eq(usersTable.id, payout.creator_id))
      .limit(1);
    if (creatorInfo[0]?.email) {
      sendPayoutCompletedEmail(creatorInfo[0].email, payoutDollars);
    }

    return NextResponse.json({
      data: {
        payout: updatedPayout[0],
        tx_signature: txSignature,
      },
    });
  } catch (error) {
    console.error("POST /api/admin/payouts error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
