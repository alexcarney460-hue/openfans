/**
 * Devnet integration test for the OpenFans hot wallet system.
 * Tests: keypair loading, SOL airdrop, SPL token creation, transfer, balance query.
 */
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transfer,
  getAccount,
} from "@solana/spl-token";
import bs58 from "bs58";

const DEVNET_RPC = "https://api.devnet.solana.com";
const SECRET_KEY = "3cmSiLVk8Fr7M7qrcM4DbTEM4tJxRsF3zw6U9o6dXxur5Qgm7Trhdx3fx5QUFzqY2USinDgGS5gr9HJqJ2FnQNjv";
const EXPECTED_PUBKEY = "4e8YpUSns8RoVrPfVayhX4BWQSqecmjFUh1jxx77niQt";

const CENTS_TO_RAW = 10_000; // 1 cent = 10,000 raw units (6 decimals)

let passed = 0;
let failed = 0;

function ok(label) { passed++; console.log(`  ✅ ${label}`); }
function fail(label, err) { failed++; console.log(`  ❌ ${label}: ${err}`); }

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const connection = new Connection(DEVNET_RPC, "confirmed");

  // ── Test 1: Keypair loads and matches ──
  console.log("\n🔑 Test 1: Keypair validation");
  let platformKeypair;
  try {
    platformKeypair = Keypair.fromSecretKey(bs58.decode(SECRET_KEY));
    if (platformKeypair.publicKey.toBase58() === EXPECTED_PUBKEY) {
      ok(`Keypair matches: ${EXPECTED_PUBKEY}`);
    } else {
      fail("Keypair mismatch", `got ${platformKeypair.publicKey.toBase58()}`);
      return;
    }
  } catch (e) {
    fail("Keypair load", e.message);
    return;
  }

  // ── Test 2: Airdrop devnet SOL ──
  console.log("\n💰 Test 2: Airdrop devnet SOL");
  try {
    const balance = await connection.getBalance(platformKeypair.publicKey);
    if (balance < 0.5 * LAMPORTS_PER_SOL) {
      console.log("  Requesting airdrop...");
      const sig = await connection.requestAirdrop(platformKeypair.publicKey, 2 * LAMPORTS_PER_SOL);
      await connection.confirmTransaction(sig, "confirmed");
      await sleep(2000);
    }
    const newBalance = await connection.getBalance(platformKeypair.publicKey);
    ok(`SOL balance: ${(newBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
  } catch (e) {
    fail("Airdrop", e.message);
    console.log("  ⚠️  Devnet airdrop may be rate-limited. Continuing...");
  }

  // ── Test 3: Create test SPL token (simulating USDC with 6 decimals) ──
  console.log("\n🪙 Test 3: Create test USDC token (6 decimals)");
  let testMint;
  try {
    testMint = await createMint(
      connection,
      platformKeypair,       // payer
      platformKeypair.publicKey, // mint authority
      null,                  // freeze authority
      6,                     // decimals (same as real USDC)
    );
    ok(`Test USDC mint: ${testMint.toBase58()}`);
  } catch (e) {
    fail("Create mint", e.message);
    return;
  }

  // ── Test 4: Create ATA and mint test tokens ──
  console.log("\n🏦 Test 4: Mint test USDC to platform wallet");
  let platformAta;
  try {
    platformAta = await getOrCreateAssociatedTokenAccount(
      connection,
      platformKeypair,
      testMint,
      platformKeypair.publicKey,
    );
    ok(`Platform ATA: ${platformAta.address.toBase58()}`);

    // Mint $100 worth (10000 cents = 100,000,000 raw units)
    const mintAmount = BigInt(10000) * BigInt(CENTS_TO_RAW); // $100
    await mintTo(
      connection,
      platformKeypair,
      testMint,
      platformAta.address,
      platformKeypair,
      mintAmount,
    );

    const acct = await getAccount(connection, platformAta.address);
    ok(`Minted: ${Number(acct.amount) / 1_000_000} test USDC`);
  } catch (e) {
    fail("Mint tokens", e.message);
    return;
  }

  // ── Test 5: Transfer (simulating creator payout) ──
  console.log("\n📤 Test 5: Transfer test USDC (simulating creator payout)");
  const creatorKeypair = Keypair.generate(); // random "creator" wallet
  try {
    // Airdrop SOL to creator for ATA rent
    const airdropSig = await connection.requestAirdrop(creatorKeypair.publicKey, 0.5 * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(airdropSig, "confirmed");
    await sleep(2000);

    // Create creator's ATA
    const creatorAta = await getOrCreateAssociatedTokenAccount(
      connection,
      creatorKeypair,
      testMint,
      creatorKeypair.publicKey,
    );

    // Transfer $9.50 (950 cents = 5% fee on $10 sub, creator gets 95%)
    const transferAmount = BigInt(950) * BigInt(CENTS_TO_RAW); // 9,500,000 raw
    const txSig = await transfer(
      connection,
      platformKeypair,
      platformAta.address,
      creatorAta.address,
      platformKeypair,
      transferAmount,
    );
    ok(`Transfer tx: ${txSig}`);

    // Verify creator received correct amount
    const creatorAcct = await getAccount(connection, creatorAta.address);
    const receivedCents = Number(creatorAcct.amount / BigInt(CENTS_TO_RAW));
    if (receivedCents === 950) {
      ok(`Creator received: $${(receivedCents / 100).toFixed(2)} (950 cents) ✓`);
    } else {
      fail("Amount mismatch", `expected 950 cents, got ${receivedCents}`);
    }

    // Verify platform balance decreased correctly
    const platformAcct = await getAccount(connection, platformAta.address);
    const remainingCents = Number(platformAcct.amount / BigInt(CENTS_TO_RAW));
    const expectedRemaining = 10000 - 950; // $100 - $9.50
    if (remainingCents === expectedRemaining) {
      ok(`Platform remaining: $${(remainingCents / 100).toFixed(2)} (${remainingCents} cents) ✓`);
    } else {
      fail("Platform balance", `expected ${expectedRemaining} cents, got ${remainingCents}`);
    }
  } catch (e) {
    fail("Transfer", e.message);
  }

  // ── Test 6: Balance query (matching our balance.ts utility logic) ──
  console.log("\n📊 Test 6: Balance query (BigInt conversion)");
  try {
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      platformKeypair.publicKey,
      { mint: testMint },
    );

    let totalRaw = BigInt(0);
    for (const account of tokenAccounts.value) {
      const rawStr = account.account.data.parsed?.info?.tokenAmount?.amount ?? "0";
      totalRaw += BigInt(rawStr);
    }
    const balanceCents = Number(totalRaw / BigInt(CENTS_TO_RAW));
    ok(`On-chain balance via BigInt: ${balanceCents} cents ($${(balanceCents / 100).toFixed(2)})`);

    // Compare with uiAmount (floating point) to prove BigInt is safer
    const uiAmount = tokenAccounts.value[0]?.account.data.parsed?.info?.tokenAmount?.uiAmount ?? 0;
    const floatCents = Math.floor(uiAmount * 100);
    if (floatCents === balanceCents) {
      ok(`Float method agrees: ${floatCents} cents (lucky — no rounding error this time)`);
    } else {
      console.log(`  ⚠️  Float method got ${floatCents} cents vs BigInt ${balanceCents} — BigInt is correct`);
    }
  } catch (e) {
    fail("Balance query", e.message);
  }

  // ── Summary ──
  console.log(`\n${"═".repeat(50)}`);
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  if (failed === 0) {
    console.log("  🎉 ALL TESTS PASSED — Hot wallet system verified on devnet");
  } else {
    console.log("  ⚠️  Some tests failed — review above");
  }
  console.log(`${"═".repeat(50)}\n`);
}

main().catch(e => { console.error("Fatal:", e); process.exit(1); });
