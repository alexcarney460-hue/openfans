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
 *   - payment_tx: string (Solana transaction signature)
 *   - wallet_address?: string (for withdrawals — destination wallet)
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    // Rate limit: 10 requests per minute per user (financial endpoint)
    const rateLimited = checkRateLimit(request, getRateLimitKey(request, user.id), "wallet", 10, 60_000);
    if (rateLimited) return rateLimited;

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body", code: "INVALID_BODY" },
        { status: 400 },
      );
    }

    const { action, amount_usdc, payment_tx, wallet_address } = body;

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

    // Validate payment_tx
    if (!payment_tx || typeof payment_tx !== "string" || payment_tx.trim().length === 0) {
      return NextResponse.json(
        { error: "payment_tx is required", code: "MISSING_PAYMENT_TX" },
        { status: 400 },
      );
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
      // Check for duplicate transaction (replay protection)
      const existingTx = await db
        .select({ id: walletTransactionsTable.id })
        .from(walletTransactionsTable)
        .where(eq(walletTransactionsTable.reference_id, payment_tx.trim()))
        .limit(1);

      if (existingTx.length > 0) {
        return NextResponse.json(
          { error: "This transaction has already been used", code: "DUPLICATE_TX" },
          { status: 409 },
        );
      }

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

      // Atomic balance update -- prevents race conditions from concurrent deposits
      const updatedRows = await db
        .update(walletsTable)
        .set({
          balance_usdc: sql`${walletsTable.balance_usdc} + ${amount_usdc}`,
          updated_at: new Date(),
        })
        .where(eq(walletsTable.id, currentWallet.id))
        .returning();

      const newBalance = updatedRows[0].balance_usdc;

      const txRecord = await db
        .insert(walletTransactionsTable)
        .values({
          wallet_id: currentWallet.id,
          user_id: user.id,
          type: "deposit",
          amount_usdc,
          balance_after: newBalance,
          description: "USDC deposit from wallet",
          reference_id: payment_tx.trim(),
          status: "completed",
        })
        .returning();

      return NextResponse.json(
        {
          data: {
            transaction: txRecord[0],
            new_balance: newBalance,
          },
        },
        { status: 201 },
      );
    }

    if (action === "withdraw") {
      if (!wallet_address || typeof wallet_address !== "string") {
        return NextResponse.json(
          { error: "wallet_address is required for withdrawals", code: "MISSING_WALLET" },
          { status: 400 },
        );
      }

      // Atomic withdrawal: debit balance only if sufficient funds remain above minimum_balance_usdc.
      // The WHERE clause guarantees no double-spend and no negative available balance.
      const updatedRows = await db
        .update(walletsTable)
        .set({
          balance_usdc: sql`${walletsTable.balance_usdc} - ${amount_usdc}`,
          updated_at: new Date(),
        })
        .where(
          sql`${walletsTable.id} = ${currentWallet.id} AND ${walletsTable.balance_usdc} - ${walletsTable.minimum_balance_usdc} >= ${amount_usdc}`,
        )
        .returning();

      if (updatedRows.length === 0) {
        // Re-read wallet to provide an accurate error message
        const freshWallet = await db
          .select()
          .from(walletsTable)
          .where(eq(walletsTable.id, currentWallet.id))
          .limit(1);
        const available = freshWallet.length > 0
          ? freshWallet[0].balance_usdc - freshWallet[0].minimum_balance_usdc
          : 0;
        const minBal = freshWallet.length > 0
          ? freshWallet[0].minimum_balance_usdc
          : 0;

        return NextResponse.json(
          {
            error: `Insufficient available balance. You have $${(available / 100).toFixed(2)} available (minimum $${(minBal / 100).toFixed(2)} must remain for active subscriptions).`,
            code: "INSUFFICIENT_BALANCE",
          },
          { status: 400 },
        );
      }

      const newBalance = updatedRows[0].balance_usdc;

      const txRecord = await db
        .insert(walletTransactionsTable)
        .values({
          wallet_id: currentWallet.id,
          user_id: user.id,
          type: "withdrawal",
          amount_usdc: -amount_usdc,
          balance_after: newBalance,
          description: `Withdrawal to ${wallet_address.slice(0, 4)}...${wallet_address.slice(-4)}`,
          reference_id: payment_tx.trim(),
          status: "pending",
        })
        .returning();

      return NextResponse.json(
        {
          data: {
            transaction: txRecord[0],
            new_balance: newBalance,
          },
        },
        { status: 201 },
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
