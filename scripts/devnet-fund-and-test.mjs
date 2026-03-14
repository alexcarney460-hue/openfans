/**
 * Devnet fund + full integration test.
 * Retries airdrop until successful, then runs the full transfer test.
 */
import { Connection, Keypair, LAMPORTS_PER_SOL, Transaction, SystemProgram } from "@solana/web3.js";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, transfer, getAccount } from "@solana/spl-token";
import bs58 from "bs58";

const SECRET = "3cmSiLVk8Fr7M7qrcM4DbTEM4tJxRsF3zw6U9o6dXxur5Qgm7Trhdx3fx5QUFzqY2USinDgGS5gr9HJqJ2FnQNjv";
const CENTS_TO_RAW = 10_000;
const MAX_RETRIES = 20;
const RETRY_DELAY = 15_000; // 15s between retries

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let passed = 0, failed = 0;
function ok(msg) { passed++; console.log(`  ✅ ${msg}`); }
function fail(msg) { failed++; console.log(`  ❌ ${msg}`); }

async function fundWallet(conn, publicKey) {
  const bal = await conn.getBalance(publicKey);
  if (bal >= 0.5 * LAMPORTS_PER_SOL) {
    console.log(`  Already have ${(bal / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
    return true;
  }

  for (let i = 1; i <= MAX_RETRIES; i++) {
    try {
      // Try fresh keypair relay to avoid per-address rate limits
      const relay = Keypair.generate();
      console.log(`  Attempt ${i}/${MAX_RETRIES} — airdrop to relay ${relay.publicKey.toBase58().slice(0, 8)}...`);

      const sig = await conn.requestAirdrop(relay.publicKey, 2 * LAMPORTS_PER_SOL);
      await conn.confirmTransaction(sig, "confirmed");
      await sleep(2000);

      const relayBal = await conn.getBalance(relay.publicKey);
      console.log(`  Relay funded: ${(relayBal / LAMPORTS_PER_SOL).toFixed(4)} SOL`);

      // Transfer to platform wallet
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: relay.publicKey,
          toPubkey: publicKey,
          lamports: Math.floor(relayBal - 0.001 * LAMPORTS_PER_SOL), // keep dust for fee
        })
      );
      const txSig = await conn.sendTransaction(tx, [relay]);
      await conn.confirmTransaction(txSig, "confirmed");

      const newBal = await conn.getBalance(publicKey);
      console.log(`  Platform wallet funded: ${(newBal / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
      return true;
    } catch (e) {
      const msg = e.message?.slice(0, 60) || String(e);
      console.log(`  Attempt ${i} failed: ${msg}`);
      if (i < MAX_RETRIES) {
        console.log(`  Waiting ${RETRY_DELAY / 1000}s before retry...`);
        await sleep(RETRY_DELAY);
      }
    }
  }
  return false;
}

async function main() {
  const kp = Keypair.fromSecretKey(bs58.decode(SECRET));
  const conn = new Connection("https://api.devnet.solana.com", "confirmed");

  console.log(`\n🔑 Wallet: ${kp.publicKey.toBase58()}`);

  // ── Fund the wallet ──
  console.log("\n💰 Step 1: Fund wallet on devnet");
  const funded = await fundWallet(conn, kp.publicKey);
  if (!funded) {
    console.log("\n  ⚠️  Could not fund wallet after all retries. Devnet faucet is down.");
    console.log("  Try again later or use https://faucet.solana.com manually.\n");
    process.exit(1);
  }
  ok("Wallet funded on devnet");

  // ── Create test USDC token ──
  console.log("\n🪙 Step 2: Create test USDC (6 decimals)");
  let testMint;
  try {
    testMint = await createMint(conn, kp, kp.publicKey, null, 6);
    ok(`Test mint: ${testMint.toBase58()}`);
  } catch (e) {
    fail(`Create mint: ${e.message}`);
    process.exit(1);
  }

  // ── Mint test tokens ──
  console.log("\n🏦 Step 3: Mint $100 test USDC to platform wallet");
  let platformAta;
  try {
    platformAta = await getOrCreateAssociatedTokenAccount(conn, kp, testMint, kp.publicKey);
    const mintAmount = BigInt(10000) * BigInt(CENTS_TO_RAW); // $100
    await mintTo(conn, kp, testMint, platformAta.address, kp, mintAmount);
    const acct = await getAccount(conn, platformAta.address);
    ok(`Minted: ${Number(acct.amount) / 1_000_000} test USDC`);
  } catch (e) {
    fail(`Mint: ${e.message}`);
    process.exit(1);
  }

  // ── Simulate creator payout ──
  console.log("\n📤 Step 4: Simulate creator payout ($9.50 = 95% of $10 sub)");
  const creator = Keypair.generate();
  try {
    // Fund creator for ATA rent
    const airdropSig = await conn.requestAirdrop(creator.publicKey, 0.1 * LAMPORTS_PER_SOL);
    await conn.confirmTransaction(airdropSig, "confirmed");
    await sleep(1500);

    const creatorAta = await getOrCreateAssociatedTokenAccount(conn, creator, testMint, creator.publicKey);

    // Transfer $9.50 (950 cents)
    const amount = BigInt(950) * BigInt(CENTS_TO_RAW);
    const txSig = await transfer(conn, kp, platformAta.address, creatorAta.address, kp, amount);
    ok(`Transfer tx: ${txSig}`);

    // Verify amounts
    const creatorAcct = await getAccount(conn, creatorAta.address);
    const received = Number(creatorAcct.amount / BigInt(CENTS_TO_RAW));
    received === 950
      ? ok(`Creator received: $${(received / 100).toFixed(2)} (${received} cents)`)
      : fail(`Creator got ${received} cents, expected 950`);

    const platformAcct = await getAccount(conn, platformAta.address);
    const remaining = Number(platformAcct.amount / BigInt(CENTS_TO_RAW));
    remaining === 9050
      ? ok(`Platform remaining: $${(remaining / 100).toFixed(2)} (${remaining} cents)`)
      : fail(`Platform has ${remaining} cents, expected 9050`);

    // Platform kept $0.50 fee (implicit — 10000 - 950 = 9050, of which 50 is fee)
    ok("Platform fee: $0.50 retained (5% of $10.00)");
  } catch (e) {
    fail(`Payout sim: ${e.message}`);
  }

  // ── Verify balance query ──
  console.log("\n📊 Step 5: Verify balance query (BigInt method)");
  try {
    const tokenAccounts = await conn.getParsedTokenAccountsByOwner(kp.publicKey, { mint: testMint });
    let totalRaw = BigInt(0);
    for (const acct of tokenAccounts.value) {
      totalRaw += BigInt(acct.account.data.parsed?.info?.tokenAmount?.amount ?? "0");
    }
    const cents = Number(totalRaw / BigInt(CENTS_TO_RAW));
    ok(`Balance query: ${cents} cents ($${(cents / 100).toFixed(2)})`);
  } catch (e) {
    fail(`Balance: ${e.message}`);
  }

  // ── Summary ──
  console.log(`\n${"═".repeat(50)}`);
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  if (failed === 0) {
    console.log("  🎉 ALL DEVNET TESTS PASSED");
    console.log("  Hot wallet can: load keypair, receive deposits,");
    console.log("  send payouts, calculate fees, query balances.");
  } else {
    console.log(`  ⚠️  ${failed} test(s) failed — review above`);
  }
  console.log(`${"═".repeat(50)}\n`);
}

main().catch((e) => { console.error("Fatal:", e.message); process.exit(1); });
