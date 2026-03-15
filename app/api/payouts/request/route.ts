export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import {
  walletsTable,
  walletTransactionsTable,
  payoutsTable,
  usersTable,
} from "@/utils/db/schema";
import { eq, sql } from "drizzle-orm";
import { getAuthenticatedUser } from "@/utils/api/auth";
import { isValidAmount, isValidSolanaAddress } from "@/utils/validation";
import { checkRateLimit, getRateLimitKey } from "@/utils/rate-limit";

/** Minimum payout amount in cents. Prevents tiny withdrawals that waste SOL gas fees. */
const MINIMUM_PAYOUT_CENTS = 500; // $5.00

/**
 * POST /api/payouts/request
 * Creator requests a withdrawal / payout from their internal wallet.
 *
 * Body:
 *   - amount_usdc: number (in cents, e.g. 5000 = $50.00)
 *
 * The creator must have a wallet_address set in their user profile. The
 * payout is created with status 'pending' -- an admin must approve and
 * process it via /api/admin/payouts.
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    // Rate limit: 5 payout requests per hour per user
    const rateLimited = await checkRateLimit(
      request,
      getRateLimitKey(request, user.id),
      "payout-request",
      5,
      3_600_000,
    );
    if (rateLimited) return rateLimited;

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body", code: "INVALID_BODY" },
        { status: 400 },
      );
    }

    const { amount_usdc } = body;

    // Validate amount
    if (typeof amount_usdc !== "number" || !isValidAmount(amount_usdc)) {
      return NextResponse.json(
        {
          error:
            "amount_usdc must be a positive integer not exceeding 1000000 (i.e. $10,000)",
          code: "INVALID_AMOUNT",
        },
        { status: 400 },
      );
    }

    // Enforce minimum payout to avoid wasting SOL gas fees on tiny withdrawals
    if (amount_usdc < MINIMUM_PAYOUT_CENTS) {
      return NextResponse.json(
        {
          error: `Minimum payout is $${(MINIMUM_PAYOUT_CENTS / 100).toFixed(2)}`,
          code: "BELOW_MINIMUM",
        },
        { status: 400 },
      );
    }

    // Verify user has a wallet address set
    const dbUser = await db
      .select({ wallet_address: usersTable.wallet_address, role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .limit(1);

    if (dbUser.length === 0) {
      return NextResponse.json(
        { error: "User not found", code: "USER_NOT_FOUND" },
        { status: 404 },
      );
    }

    const walletAddress = dbUser[0].wallet_address;
    if (!walletAddress || !isValidSolanaAddress(walletAddress)) {
      return NextResponse.json(
        {
          error:
            "You must connect a Solana wallet address in your profile settings before requesting a payout.",
          code: "NO_WALLET_ADDRESS",
        },
        { status: 400 },
      );
    }

    // Block platform wallet as payout address
    const platformWallet = process.env.NEXT_PUBLIC_PLATFORM_WALLET || "";
    if (platformWallet && walletAddress === platformWallet) {
      return NextResponse.json(
        { error: "Cannot use the platform wallet as your payout address", code: "INVALID_WALLET" },
        { status: 400 },
      );
    }

    // Must be a creator to request payouts
    if (dbUser[0].role !== "creator" && dbUser[0].role !== "admin") {
      return NextResponse.json(
        { error: "Only creators can request payouts", code: "NOT_CREATOR" },
        { status: 403 },
      );
    }

    // Get wallet
    const wallets = await db
      .select()
      .from(walletsTable)
      .where(eq(walletsTable.user_id, user.id))
      .limit(1);

    if (wallets.length === 0) {
      return NextResponse.json(
        { error: "No wallet found. Please make a deposit first.", code: "NO_WALLET" },
        { status: 400 },
      );
    }

    const wallet = wallets[0];

    // Check available balance (balance - minimum_balance)
    const available = wallet.balance_usdc - wallet.minimum_balance_usdc;
    if (amount_usdc > available) {
      return NextResponse.json(
        {
          error: `Insufficient available balance. You have $${(available / 100).toFixed(2)} available (minimum $${(wallet.minimum_balance_usdc / 100).toFixed(2)} must remain for active subscriptions).`,
          code: "INSUFFICIENT_BALANCE",
        },
        { status: 400 },
      );
    }

    // Wrap wallet debit + payout record + wallet transaction in a single
    // database transaction to prevent partial state on failure.
    let result: { payoutRecord: typeof payoutsTable.$inferSelect; txRecord: typeof walletTransactionsTable.$inferSelect; newBalance: number };
    try {
      result = await db.transaction(async (tx) => {
        // Atomic debit: only succeeds if sufficient funds above minimum
        const updatedRows = await tx
          .update(walletsTable)
          .set({
            balance_usdc: sql`${walletsTable.balance_usdc} - ${amount_usdc}`,
            updated_at: new Date(),
          })
          .where(
            sql`${walletsTable.id} = ${wallet.id} AND ${walletsTable.balance_usdc} - ${walletsTable.minimum_balance_usdc} >= ${amount_usdc}`,
          )
          .returning();

        if (updatedRows.length === 0) {
          throw new Error("INSUFFICIENT_BALANCE");
        }

        const newBalance = updatedRows[0].balance_usdc;

        // Create payout record (pending -- admin will process)
        const [payoutRecord] = await tx
          .insert(payoutsTable)
          .values({
            creator_id: user.id,
            amount_usdc,
            wallet_address: walletAddress,
            status: "pending",
          })
          .returning();

        // Record wallet transaction
        const [txRecord] = await tx
          .insert(walletTransactionsTable)
          .values({
            wallet_id: wallet.id,
            user_id: user.id,
            type: "withdrawal",
            amount_usdc: -amount_usdc,
            balance_after: newBalance,
            description: `Payout request to ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`,
            reference_id: `payout:${payoutRecord.id}`,
            status: "pending",
          })
          .returning();

        return { payoutRecord, txRecord, newBalance };
      });
    } catch (err) {
      if (err instanceof Error && err.message === "INSUFFICIENT_BALANCE") {
        return NextResponse.json(
          {
            error: "Insufficient available balance. Please try again.",
            code: "INSUFFICIENT_BALANCE",
          },
          { status: 400 },
        );
      }
      throw err;
    }

    return NextResponse.json(
      {
        data: {
          payout: result.payoutRecord,
          transaction: result.txRecord,
          new_balance: result.newBalance,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/payouts/request error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
