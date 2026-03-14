import { Connection, PublicKey } from "@solana/web3.js";

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

/**
 * Queries the on-chain USDC balance for a given Solana wallet address.
 * Returns the balance in cents (1 USDC = 100 cents).
 */
export async function getOnChainUsdcBalance(
  walletAddress: string,
): Promise<number> {
  const rpcUrl =
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
    "https://api.mainnet-beta.solana.com";
  const connection = new Connection(rpcUrl, "confirmed");
  const wallet = new PublicKey(walletAddress);
  const mint = new PublicKey(USDC_MINT);

  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet, {
    mint,
  });

  // Use raw integer amounts via BigInt to avoid floating point precision errors.
  // USDC has 6 decimals, so 1 USDC = 1_000_000 raw units.
  // We need cents (1 USDC = 100 cents), so 1 cent = 10_000 raw units.
  let totalRaw = BigInt(0);
  for (const account of tokenAccounts.value) {
    const rawStr: string =
      account.account.data.parsed?.info?.tokenAmount?.amount ?? "0";
    totalRaw += BigInt(rawStr);
  }

  // Convert raw units to cents: raw / 10_000 (integer division, truncates)
  return Number(totalRaw / BigInt(10_000));
}
