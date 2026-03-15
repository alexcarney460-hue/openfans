import { Connection, PublicKey, ParsedTransactionWithMeta } from "@solana/web3.js";

/**
 * USDC has 6 decimal places on Solana.
 * Our internal amounts are stored in cents (1 cent = 0.01 USDC = 10_000 raw units).
 * So to convert cents -> raw USDC units: cents * 10_000.
 */
const USDC_DECIMALS = 6;
const CENTS_TO_RAW_USDC = 10 ** (USDC_DECIMALS - 2); // 10_000

/**
 * Maximum age for a transaction to be considered valid (10 minutes).
 */
const MAX_TX_AGE_SECONDS = 10 * 60;

/**
 * Known USDC mint address on Solana mainnet-beta.
 * Can be overridden via NEXT_PUBLIC_USDC_MINT env var.
 */
const USDC_MINT_MAINNET = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

export interface VerificationResult {
  verified: boolean;
  error?: string;
}

/**
 * Get a Solana Connection instance using the configured RPC URL.
 */
function getConnection(): Connection {
  const rpcUrl =
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
    "https://api.mainnet-beta.solana.com";
  return new Connection(rpcUrl, "finalized");
}

/**
 * Get the expected USDC mint public key.
 */
function getUsdcMint(): PublicKey {
  const mint = process.env.NEXT_PUBLIC_USDC_MINT || USDC_MINT_MAINNET;
  return new PublicKey(mint);
}

/**
 * Verify a Solana USDC SPL-token transfer transaction on-chain.
 *
 * Checks:
 * 1. Transaction exists and is finalized/confirmed
 * 2. Transaction succeeded (no error)
 * 3. Transaction is recent (within MAX_TX_AGE_SECONDS)
 * 4. Contains a USDC SPL token transfer to the expected recipient
 * 5. Transfer amount matches the expected amount
 * 6. The token mint is the correct USDC mint
 *
 * @param txSignature - The Solana transaction signature (base58)
 * @param expectedAmountCents - Expected amount in cents (e.g., 999 = $9.99)
 * @param expectedRecipient - The expected recipient wallet address (base58)
 * @returns VerificationResult with verified boolean and optional error message
 */
export async function verifyTransaction(
  txSignature: string,
  expectedAmountCents: number,
  expectedRecipient: string,
): Promise<VerificationResult> {
  // --- Input validation ---
  if (!txSignature || txSignature.trim().length === 0) {
    return { verified: false, error: "Transaction signature is empty" };
  }

  if (!expectedRecipient || expectedRecipient.trim().length === 0) {
    return { verified: false, error: "Expected recipient wallet is not configured" };
  }

  if (typeof expectedAmountCents !== "number" || expectedAmountCents <= 0) {
    return { verified: false, error: "Expected amount must be a positive number" };
  }

  // Validate the signature format (base58, typically 87-88 chars)
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{64,128}$/;
  if (!base58Regex.test(txSignature.trim())) {
    return { verified: false, error: "Invalid transaction signature format" };
  }

  // Validate recipient is a valid public key
  let recipientPubkey: PublicKey;
  try {
    recipientPubkey = new PublicKey(expectedRecipient);
  } catch {
    return { verified: false, error: "Invalid recipient wallet address" };
  }

  const connection = getConnection();
  const usdcMint = getUsdcMint();
  const expectedRawAmount = BigInt(expectedAmountCents) * BigInt(CENTS_TO_RAW_USDC);

  // --- Fetch the transaction ---
  let parsedTx: ParsedTransactionWithMeta | null;
  try {
    parsedTx = await connection.getParsedTransaction(txSignature.trim(), {
      maxSupportedTransactionVersion: 0,
      commitment: "finalized",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { verified: false, error: `Failed to fetch transaction: ${message}` };
  }

  if (!parsedTx) {
    return { verified: false, error: "Transaction not found on-chain" };
  }

  // --- Check transaction status ---
  if (parsedTx.meta?.err) {
    return { verified: false, error: "Transaction failed on-chain" };
  }

  // --- Check transaction age ---
  const blockTime = parsedTx.blockTime;
  if (!blockTime) {
    return { verified: false, error: "Transaction has no block time" };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const ageSeconds = nowSeconds - blockTime;

  if (ageSeconds > MAX_TX_AGE_SECONDS) {
    return {
      verified: false,
      error: `Transaction is too old (${Math.floor(ageSeconds / 60)} minutes). Must be within ${MAX_TX_AGE_SECONDS / 60} minutes.`,
    };
  }

  if (ageSeconds < -60) {
    // Allow 60s of clock skew; anything more is suspicious
    return { verified: false, error: "Transaction timestamp is in the future" };
  }

  // --- Find matching USDC transfer instruction ---
  const allInstructions = [
    ...parsedTx.transaction.message.instructions,
    ...(parsedTx.meta?.innerInstructions?.flatMap((ix) => ix.instructions) ?? []),
  ];

  let foundMatchingTransfer = false;

  for (const ix of allInstructions) {
    // We need parsed instructions from the SPL Token program
    if (!("parsed" in ix)) continue;

    const parsed = ix.parsed;
    if (!parsed || typeof parsed !== "object") continue;

    // Match both 'transfer' and 'transferChecked' instruction types
    const instructionType: string = parsed.type;
    if (instructionType !== "transfer" && instructionType !== "transferChecked") {
      continue;
    }

    const info = parsed.info;
    if (!info) continue;

    // --- Verify the token mint for transferChecked ---
    if (instructionType === "transferChecked") {
      const mint: string | undefined = info.mint;
      if (!mint || mint !== usdcMint.toBase58()) {
        continue; // Not USDC, skip
      }
    }

    // --- Verify the transfer amount ---
    // For 'transfer', amount is in info.amount (string of raw units)
    // For 'transferChecked', tokenAmount.amount is the raw string
    let rawAmountStr: string | undefined;
    if (instructionType === "transferChecked" && info.tokenAmount) {
      rawAmountStr = info.tokenAmount.amount;
    } else {
      rawAmountStr = info.amount;
    }

    if (!rawAmountStr) continue;

    const transferAmount = BigInt(rawAmountStr);
    if (transferAmount !== expectedRawAmount) {
      continue; // Amount doesn't match
    }

    // --- Verify the destination token account resolves to the expected owner ---
    const destination: string | undefined = info.destination;
    if (!destination) continue;

    // The destination is a token account (ATA), not the wallet address directly.
    // We need to check if this token account is owned by the expected recipient.
    const destinationMatchesRecipient = await verifyTokenAccountOwner(
      connection,
      destination,
      recipientPubkey,
      usdcMint,
    );

    if (!destinationMatchesRecipient) {
      continue; // Destination doesn't belong to expected recipient
    }

    // --- For 'transfer' type, verify the mint by checking the token account ---
    if (instructionType === "transfer") {
      const mintMatchesUsdc = await verifyTokenAccountMint(
        connection,
        destination,
        usdcMint,
      );
      if (!mintMatchesUsdc) {
        continue; // Not a USDC token account
      }
    }

    foundMatchingTransfer = true;
    break;
  }

  if (!foundMatchingTransfer) {
    return {
      verified: false,
      error: "No matching USDC transfer found in transaction",
    };
  }

  return { verified: true };
}

/**
 * Verify that a token account is owned by the expected wallet and holds the expected mint.
 */
async function verifyTokenAccountOwner(
  connection: Connection,
  tokenAccountAddress: string,
  expectedOwner: PublicKey,
  expectedMint: PublicKey,
): Promise<boolean> {
  try {
    const tokenAccountPubkey = new PublicKey(tokenAccountAddress);
    const accountInfo = await connection.getParsedAccountInfo(tokenAccountPubkey);

    if (!accountInfo.value) return false;

    const data = accountInfo.value.data;
    if (!("parsed" in data)) return false;

    const parsed = data.parsed;
    if (!parsed || parsed.type !== "account") return false;

    const info = parsed.info;
    if (!info) return false;

    const owner: string = info.owner;
    const mint: string = info.mint;

    return owner === expectedOwner.toBase58() && mint === expectedMint.toBase58();
  } catch {
    return false;
  }
}

/**
 * Verify that a token account holds the expected mint (for plain 'transfer' instructions
 * where the mint is not included in the instruction itself).
 */
async function verifyTokenAccountMint(
  connection: Connection,
  tokenAccountAddress: string,
  expectedMint: PublicKey,
): Promise<boolean> {
  try {
    const tokenAccountPubkey = new PublicKey(tokenAccountAddress);
    const accountInfo = await connection.getParsedAccountInfo(tokenAccountPubkey);

    if (!accountInfo.value) return false;

    const data = accountInfo.value.data;
    if (!("parsed" in data)) return false;

    const parsed = data.parsed;
    if (!parsed || parsed.type !== "account") return false;

    const mint: string = parsed.info?.mint;
    return mint === expectedMint.toBase58();
  } catch {
    return false;
  }
}
