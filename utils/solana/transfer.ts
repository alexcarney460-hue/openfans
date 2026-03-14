import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  getAccount,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import bs58 from "bs58";

const USDC_MINT = new PublicKey(
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
);

/**
 * USDC has 6 decimal places. Internal amounts are in cents (1 cent = 0.01 USDC).
 * 1 cent = 10,000 raw USDC units (10^4).
 */
const CENTS_TO_RAW = 10_000;

/**
 * Load the platform keypair from the PLATFORM_WALLET_SECRET_KEY env var.
 * The key must be a base58-encoded Solana secret key (64 bytes).
 * Throws if not configured.
 */
export function getPlatformKeypair(): Keypair {
  const secret = process.env.PLATFORM_WALLET_SECRET_KEY;
  if (!secret || secret.trim().length === 0) {
    throw new Error(
      "PLATFORM_WALLET_SECRET_KEY is not configured. Cannot sign outbound transactions.",
    );
  }
  return Keypair.fromSecretKey(bs58.decode(secret.trim()));
}

/**
 * Get a Solana Connection instance using the configured RPC URL.
 */
function getConnection(): Connection {
  const rpcUrl =
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
    "https://api.mainnet-beta.solana.com";
  return new Connection(rpcUrl, "confirmed");
}

/**
 * Send USDC from the platform hot wallet to a destination Solana wallet.
 *
 * Creates the destination's Associated Token Account (ATA) if it does not
 * already exist on-chain. Returns the confirmed transaction signature.
 *
 * @param destinationWallet - Base58-encoded Solana public key of the recipient
 * @param amountCents - Amount to send in cents (e.g. 500 = $5.00)
 * @returns Transaction signature (base58 string)
 */
export async function sendUsdc(
  destinationWallet: string,
  amountCents: number,
): Promise<string> {
  if (amountCents <= 0) {
    throw new Error("Amount must be positive");
  }

  const connection = getConnection();
  const platformKeypair = getPlatformKeypair();
  const destinationPubkey = new PublicKey(destinationWallet);

  // Derive Associated Token Accounts for source and destination
  const sourceAta = await getAssociatedTokenAddress(
    USDC_MINT,
    platformKeypair.publicKey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  const destinationAta = await getAssociatedTokenAddress(
    USDC_MINT,
    destinationPubkey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  const rawAmount = BigInt(amountCents) * BigInt(CENTS_TO_RAW);
  const transaction = new Transaction();

  // Check if the destination ATA exists; create it if not
  try {
    await getAccount(connection, destinationAta, "confirmed", TOKEN_PROGRAM_ID);
  } catch {
    // Account does not exist -- add create-ATA instruction
    transaction.add(
      createAssociatedTokenAccountInstruction(
        platformKeypair.publicKey, // payer
        destinationAta, // ATA address
        destinationPubkey, // owner
        USDC_MINT, // mint
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      ),
    );
  }

  // Add SPL token transfer instruction
  transaction.add(
    createTransferInstruction(
      sourceAta, // source ATA
      destinationAta, // destination ATA
      platformKeypair.publicKey, // owner / authority
      rawAmount,
      [], // no multi-sig signers
      TOKEN_PROGRAM_ID,
    ),
  );

  // Sign and send
  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [platformKeypair],
    { commitment: "confirmed" },
  );

  return signature;
}
