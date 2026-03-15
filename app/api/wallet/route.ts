export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import {
  walletsTable,
  walletTransactionsTable,
} from "@/utils/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getAuthenticatedUser } from "@/utils/api/auth";
import { verifyTransaction } from "@/utils/solana/verify";
import { isValidAmount } from "@/utils/validation";
import { checkRateLimit, getRateLimitKey } from "@/utils/rate-limit";

/**
 * GET /api/wallet
 * Returns the authenticated user's wallet balance and recent transactions.
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    // Get or create wallet
    let wallet = await db
      .select()
      .from(walletsTable)
      .where(eq(walletsTable.user_id, user.id))
      .limit(1);

    if (wallet.length === 0) {
      wallet = await db
        .insert(walletsTable)
        .values({ user_id: user.id })
        .returning();
    }

    const currentWallet = wallet[0];

    // Get recent transactions
    const limit = Math.min(
      Math.max(parseInt(request.nextUrl.searchParams.get("limit") ?? "20", 10), 1),
      100,
    );

    const transactions = await db
      .select()
      .from(walletTransactionsTable)
      .where(eq(walletTransactionsTable.user_id, user.id))
      .orderBy(desc(walletTransactionsTable.created_at))
      .limit(limit);

    return NextResponse.json({
      data: {
        wallet: {
          id: currentWallet.id,
          balance_usdc: currentWallet.balance_usdc,
          minimum_balance_usdc: currentWallet.minimum_balance_usdc,
          available_for_withdrawal:
            currentWallet.balance_usdc - currentWallet.minimum_balance_usdc,
          created_at: currentWallet.created_at,
        },
        transactions,
      },
    });
  } catch (error) {
    console.error("GET /api/wallet error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/wallet
 * Record a deposit after on-chain USDC transfer is verified.
 *
 * Body:
 *   - action: "deposit" | "withdraw"
 *   - amount_usdc: number (in cents, e.g. 999 = $9.99)
 *   - payment_tx: string (Solana transaction signature — required for deposits only)
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    // Rate limit: 10 requests per minute per user (financial endpoint)
    const rateLimited = await checkRateLimit(request, getRateLimitKey(request, user.id), "wallet", 10, 60_000);
    if (rateLimited) return rateLimited;

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body", code: "INVALID_BODY" },
        { status: 400 },
      );
    }

    const { action, amount_usdc, payment_tx } = body;

    // Validate action
    if (!action || !["deposit", "withdraw"].includes(action)) {
      return NextResponse.json(
        { error: "action must be 'deposit' or 'withdraw'", code: "INVALID_ACTION" },
        { status: 400 },
      );
    }

    // Validate amount
    if (typeof amount_usdc !== "number" || !isValidAmount(amount_usdc)) {
      return NextResponse.json(
        { error: "amount_usdc must be a positive integer not exceeding 1000000 (i.e. $10,000)", code: "INVALID_AMOUNT" },
        { status: 400 },
      );
    }

    // Validate payment_tx (required for deposits only)
    if (action === "deposit") {
      if (!payment_tx || typeof payment_tx !== "string" || payment_tx.trim().length === 0) {
        return NextResponse.json(
          { error: "payment_tx is required for deposits", code: "MISSING_PAYMENT_TX" },
          { status: 400 },
        );
      }
    }

    // Get or create wallet
    let wallet = await db
      .select()
      .from(walletsTable)
      .where(eq(walletsTable.user_id, user.id))
      .limit(1);

    if (wallet.length === 0) {
      wallet = await db
        .insert(walletsTable)
        .values({ user_id: user.id })
        .returning();
    }

    const currentWallet = wallet[0];

    if (action === "deposit") {
      // Verify the on-chain transaction: amount and destination (platform wallet)
      const platformWallet = process.env.NEXT_PUBLIC_PLATFORM_WALLET || "";
      const verification = await verifyTransaction(
        payment_tx.trim(),
        amount_usdc,
        platformWallet,
      );

      if (!verification.verified) {
        return NextResponse.json(
          { error: verification.error ?? "Transaction verification failed", code: "INVALID_TX" },
          { status: 400 },
        );
      }

      // Wrap duplicate check + balance credit + transaction insert in a single
      // database transaction to prevent double-spend race conditions.
      let txRecord;
      let newBalance: number;
      try {
        const result = await db.transaction(async (tx) => {
          // Check global transaction uniqueness (cross-table replay prevention)
          const txUsed = await tx.execute(sql`
            SELECT payment_tx FROM used_payment_transactions WHERE payment_tx = ${payment_tx.trim()}
          `);
          if ((txUsed as unknown as Array<unknown>).length > 0) {
            throw new Error("DUPLICATE_TX");
          }
          await tx.execute(sql`
            INSERT INTO used_payment_transactions (payment_tx, type, user_id) VALUES (${payment_tx.trim()}, 'deposit', ${user.id})
          `);

          // 1. Check for duplicate within transaction (serialised)
          const existingTx = await tx
            .select({ id: walletTransactionsTable.id })
            .from(walletTransactionsTable)
            .where(eq(walletTransactionsTable.reference_id, payment_tx.trim()))
            .limit(1);

          if (existingTx.length > 0) {
            throw new Error("DUPLICATE_TX");
          }

          // 2. Atomic balance update
          const updatedRows = await tx
            .update(walletsTable)
            .set({
              balance_usdc: sql`${walletsTable.balance_usdc} + ${amount_usdc}`,
              updated_at: new Date(),
            })
            .where(eq(walletsTable.id, currentWallet.id))
            .returning();

          const balance = updatedRows[0].balance_usdc;

          // 3. Insert transaction record
          const record = await tx
            .insert(walletTransactionsTable)
            .values({
              wallet_id: currentWallet.id,
              user_id: user.id,
              type: "deposit",
              amount_usdc,
              balance_after: balance,
              description: "USDC deposit from wallet",
              reference_id: payment_tx.trim(),
              status: "completed",
            })
            .returning();

          return { txRecord: record[0], newBalance: balance };
        });

        txRecord = result.txRecord;
        newBalance = result.newBalance;
      } catch (err) {
        if (err instanceof Error && err.message === "DUPLICATE_TX") {
          return NextResponse.json(
            { error: "This transaction has already been used", code: "DUPLICATE_TX" },
            { status: 409 },
          );
        }
        throw err;
      }

      return NextResponse.json(
        {
          data: {
            transaction: txRecord,
            new_balance: newBalance,
          },
        },
        { status: 201 },
      );
    }

    if (action === "withdraw") {
      // Withdrawals are handled exclusively by POST /api/payouts/request
      // which has proper creator role checks and validation.
      return NextResponse.json(
        { error: "Use POST /api/payouts/request for withdrawals", code: "USE_PAYOUT_ENDPOINT" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Invalid action", code: "INVALID_ACTION" },
      { status: 400 },
    );
  } catch (error) {
    console.error("POST /api/wallet error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
