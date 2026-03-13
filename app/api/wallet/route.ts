import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import {
  walletsTable,
  walletTransactionsTable,
} from "@/utils/db/schema";
import { eq, desc } from "drizzle-orm";
import { getAuthenticatedUser } from "@/utils/api/auth";

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
    if (!amount_usdc || typeof amount_usdc !== "number" || amount_usdc <= 0) {
      return NextResponse.json(
        { error: "amount_usdc must be a positive number", code: "INVALID_AMOUNT" },
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
      // TODO: Verify the on-chain transaction matches amount and destination
      // For now we record the deposit optimistically after client confirmation

      const newBalance = currentWallet.balance_usdc + amount_usdc;

      await db
        .update(walletsTable)
        .set({ balance_usdc: newBalance, updated_at: new Date() })
        .where(eq(walletsTable.id, currentWallet.id));

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

      const availableBalance =
        currentWallet.balance_usdc - currentWallet.minimum_balance_usdc;

      if (amount_usdc > availableBalance) {
        return NextResponse.json(
          {
            error: `Insufficient available balance. You have $${(availableBalance / 100).toFixed(2)} available (minimum $${(currentWallet.minimum_balance_usdc / 100).toFixed(2)} must remain for active subscriptions).`,
            code: "INSUFFICIENT_BALANCE",
          },
          { status: 400 },
        );
      }

      const newBalance = currentWallet.balance_usdc - amount_usdc;

      await db
        .update(walletsTable)
        .set({ balance_usdc: newBalance, updated_at: new Date() })
        .where(eq(walletsTable.id, currentWallet.id));

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
