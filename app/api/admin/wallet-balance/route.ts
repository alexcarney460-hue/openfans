export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/utils/api/auth";
import { getOnChainUsdcBalance } from "@/utils/solana/balance";

/**
 * GET /api/admin/wallet-balance
 * Returns the on-chain USDC balance of the platform hot wallet.
 * Separated from main analytics to avoid timeout on serverless.
 */
export async function GET() {
  try {
    const { error: authError } = await getAuthenticatedAdmin();
    if (authError) return authError;

    const walletAddress = process.env.NEXT_PUBLIC_PLATFORM_WALLET;
    if (!walletAddress) {
      return NextResponse.json({
        data: { balance_usdc: 0, configured: false },
      });
    }

    const balanceUsdc = await getOnChainUsdcBalance(walletAddress);

    return NextResponse.json({
      data: { balance_usdc: balanceUsdc, configured: true },
    });
  } catch {
    return NextResponse.json({
      data: { balance_usdc: 0, configured: true, error: true },
    });
  }
}
