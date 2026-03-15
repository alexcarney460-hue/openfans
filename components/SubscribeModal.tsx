"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { useTrack } from "@/hooks/useTrack";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import {
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
  getAccount,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";

// Mainnet USDC mint
const USDC_MINT_ADDRESS =
  process.env.NEXT_PUBLIC_USDC_MINT || "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

// Platform vault
const PLATFORM_WALLET_ADDRESS =
  process.env.NEXT_PUBLIC_PLATFORM_WALLET || "4e8YpUSns8RoVrPfVayhX4BWQSqecmjFUh1jxx77niQt";

type TxState =
  | { status: "idle" }
  | { status: "connecting" }
  | { status: "confirming" }
  | { status: "success"; signature: string }
  | { status: "error"; message: string };

type SubscriptionTier = "basic" | "premium" | "vip";

interface TierOption {
  readonly tier: SubscriptionTier;
  readonly label: string;
  readonly price: number;
  readonly description: string;
}

interface SubscribeModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly creatorName: string;
  readonly creatorUsername: string;
  readonly creatorId?: string;
  readonly price: number;
  readonly premiumPrice?: number | null;
  readonly vipPrice?: number | null;
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function truncateSignature(sig: string): string {
  return `${sig.slice(0, 8)}...${sig.slice(-8)}`;
}

/**
 * Convert a dollar amount to USDC smallest units (6 decimals).
 * e.g. $9.99 -> 9_990_000
 */
function dollarsToUsdcUnits(dollars: number): number {
  return Math.round(dollars * 1_000_000);
}

export function SubscribeModal({
  isOpen,
  onClose,
  creatorName,
  creatorUsername,
  creatorId,
  price,
  premiumPrice,
  vipPrice,
}: SubscribeModalProps) {
  const { publicKey, sendTransaction, connected, connecting, wallet, wallets, select, connect } = useWallet();
  const { connection } = useConnection();
  const track = useTrack();
  const [txState, setTxState] = useState<TxState>({ status: "idle" });
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>("basic");
  const userClickedConnect = useRef(false);

  // Promo code state
  const [promoExpanded, setPromoExpanded] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoValidating, setPromoValidating] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<{
    id: number;
    code: string;
    type: "discount" | "free_trial";
    discount_percent: number | null;
    trial_days: number | null;
  } | null>(null);

  // Build available tiers based on what the creator offers
  const availableTiers: TierOption[] = [
    { tier: "basic", label: "Basic", price, description: "Access to basic content" },
  ];
  if (premiumPrice != null && premiumPrice > 0) {
    availableTiers.push({ tier: "premium", label: "Premium", price: premiumPrice, description: "Access to basic + premium content" });
  }
  if (vipPrice != null && vipPrice > 0) {
    availableTiers.push({ tier: "vip", label: "VIP", price: vipPrice, description: "Access to all content" });
  }

  const hasMultipleTiers = availableTiers.length > 1;
  const currentTier = availableTiers.find((t) => t.tier === selectedTier) ?? availableTiers[0];
  const currentPrice = currentTier.price;

  // Compute effective price after promo discount
  const isFreeTrial = appliedPromo?.type === "free_trial";
  const effectivePrice = appliedPromo?.type === "discount" && appliedPromo.discount_percent
    ? Math.round((currentPrice * (100 - appliedPromo.discount_percent)) * 100) / 100
    : isFreeTrial
    ? 0
    : currentPrice;

  const handleClose = useCallback(() => {
    if (txState.status === "confirming") return; // Don't close during transaction
    onClose();
  }, [txState.status, onClose]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    },
    [handleClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  // Reset transaction state, tier selection, and promo when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setTxState({ status: "idle" });
      setSelectedTier("basic");
      setPromoExpanded(false);
      setPromoCode("");
      setPromoError(null);
      setAppliedPromo(null);
      setPromoValidating(false);
    }
  }, [isOpen]);

  const handleApplyPromo = useCallback(async () => {
    if (!promoCode.trim() || !creatorId) return;

    setPromoValidating(true);
    setPromoError(null);

    try {
      const res = await fetch("/api/promotions/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode.trim(), creator_id: creatorId }),
      });

      const json = await res.json();

      if (!res.ok) {
        setPromoError(json.error ?? "Invalid promo code");
        setAppliedPromo(null);
      } else {
        setAppliedPromo(json.data);
        setPromoError(null);
      }
    } catch {
      setPromoError("Failed to validate promo code");
      setAppliedPromo(null);
    } finally {
      setPromoValidating(false);
    }
  }, [promoCode, creatorId]);

  const handleRemovePromo = useCallback(() => {
    setAppliedPromo(null);
    setPromoCode("");
    setPromoError(null);
  }, []);

  // Only connect after user explicitly clicked "Connect Wallet"
  useEffect(() => {
    if (
      userClickedConnect.current &&
      wallet &&
      !connected &&
      !connecting &&
      (wallet.readyState === WalletReadyState.Installed ||
        wallet.readyState === WalletReadyState.Loadable)
    ) {
      userClickedConnect.current = false;
      connect().catch(() => {});
    }
  }, [wallet, connected, connecting, connect]);

  const handleConnectWallet = useCallback(async () => {
    // Mobile without Phantom in-app browser → deep-link to Phantom
    if (
      typeof window !== "undefined" &&
      /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent) &&
      !(window as any).phantom?.solana
    ) {
      const currentUrl = window.location.href;
      const encodedUrl = encodeURIComponent(currentUrl);
      window.location.href = `https://phantom.app/ul/browse/${encodedUrl}?ref=${encodedUrl}`;
      return;
    }

    // Find an installed wallet (Phantom preferred)
    const installed = wallets.filter(
      (w) =>
        w.readyState === WalletReadyState.Installed ||
        w.readyState === WalletReadyState.Loadable,
    );
    const phantom = installed.find((w) =>
      w.adapter.name.toLowerCase().includes("phantom"),
    );
    const target = phantom ?? installed[0];

    if (!target) {
      setTxState({ status: "error", message: "No wallet found. Install the Phantom browser extension to continue." });
      return;
    }

    try {
      userClickedConnect.current = true;
      select(target.adapter.name);
    } catch {
      userClickedConnect.current = false;
      setTxState({ status: "error", message: "Failed to connect wallet" });
    }
  }, [wallets, select]);

  const handleSubscribe = useCallback(async () => {
    // Free trials skip on-chain payment but still need wallet connected for identity
    if (!publicKey || !sendTransaction) {
      setTxState({ status: "error", message: "Wallet not connected" });
      return;
    }

    track("subscribe_click", creatorUsername, {
      price: effectivePrice,
      tier: selectedTier,
      promo: appliedPromo?.code ?? null,
    });

    try {
      setTxState({ status: "confirming" });

      let signature: string;

      if (isFreeTrial) {
        // Free trial: no on-chain payment, generate a placeholder tx ID
        signature = `free_trial_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      } else {
        const usdcAmount = dollarsToUsdcUnits(effectivePrice);

        const usdcMint = new PublicKey(USDC_MINT_ADDRESS);
        const platformWallet = new PublicKey(PLATFORM_WALLET_ADDRESS);

        const senderAta = await getAssociatedTokenAddress(usdcMint, publicKey);
        const recipientAta = await getAssociatedTokenAddress(
          usdcMint,
          platformWallet,
        );

        const transaction = new Transaction();

        try {
          await getAccount(connection, recipientAta);
        } catch {
          transaction.add(
            createAssociatedTokenAccountInstruction(
              publicKey,
              recipientAta,
              platformWallet,
              usdcMint,
            ),
          );
        }

        transaction.add(
          createTransferInstruction(
            senderAta,
            recipientAta,
            publicKey,
            usdcAmount,
          ),
        );

        signature = await sendTransaction(transaction, connection);

        const latestBlockhash = await connection.getLatestBlockhash();
        await connection.confirmTransaction(
          {
            signature,
            blockhash: latestBlockhash.blockhash,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
          },
          "confirmed",
        );
      }

      // Record subscription in database (with optional promo code)
      if (creatorId) {
        try {
          const subscriptionPayload: Record<string, unknown> = {
            creator_id: creatorId,
            tier: selectedTier,
            payment_tx: signature,
          };
          if (appliedPromo) {
            subscriptionPayload.promo_code = appliedPromo.code;
          }

          const res = await fetch("/api/subscriptions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(subscriptionPayload),
          });

          if (!res.ok) {
            throw new Error(`API responded with ${res.status}`);
          }
        } catch (err) {
          console.error("Failed to record subscription:", err);
          setTxState({
            status: "error",
            message: "Payment was sent but we couldn't activate your subscription. Please contact support with your transaction ID: " + signature,
          });
          return;
        }
      }

      setTxState({ status: "success", signature });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Transaction failed";
      setTxState({ status: "error", message });
    }
  }, [publicKey, sendTransaction, connection, effectivePrice, isFreeTrial, selectedTier, creatorId, creatorUsername, track, appliedPromo]);

  if (!isOpen) return null;

  const walletName = wallet?.adapter?.name ?? "";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Subscribe to ${creatorName}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
          aria-label="Close modal"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Success State */}
        {txState.status === "success" && (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
              <svg
                className="h-8 w-8 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              Subscription Active!
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              You are now subscribed to @{creatorUsername}
            </p>
            {txState.signature && !txState.signature.startsWith("free_trial_") && (
              <div className="mt-4 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-xs text-gray-400">Transaction</p>
                <a
                  href={`https://explorer.solana.com/tx/${txState.signature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 inline-block font-mono text-xs text-[#00AFF0] hover:underline"
                >
                  {truncateSignature(txState.signature)}
                </a>
              </div>
            )}
            <button
              onClick={onClose}
              className="mt-5 w-full rounded-lg bg-[#00AFF0] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#009ad6]"
            >
              Done
            </button>
          </div>
        )}

        {/* Normal / Error / Confirming States */}
        {txState.status !== "success" && (
          <>
            {/* Creator Info */}
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#00AFF0] to-[#0077B6]">
                <span className="text-2xl font-bold text-white">
                  {creatorName.charAt(0)}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">{creatorName}</h3>
              <p className="text-sm text-gray-400">@{creatorUsername}</p>
            </div>

            {/* Tier Selection */}
            {hasMultipleTiers ? (
              <div className="mb-5 space-y-2">
                <p className="text-xs font-medium text-gray-500 mb-2">Choose your tier</p>
                {availableTiers.map((tierOpt) => {
                  const isSelected = selectedTier === tierOpt.tier;
                  const tierColors: Record<SubscriptionTier, { border: string; bg: string; badge: string }> = {
                    basic: { border: "border-[#00AFF0]/40", bg: "bg-[#00AFF0]/5", badge: "bg-[#00AFF0]/10 text-[#00AFF0]" },
                    premium: { border: "border-purple-400/40", bg: "bg-purple-50", badge: "bg-purple-100 text-purple-600" },
                    vip: { border: "border-amber-400/40", bg: "bg-amber-50", badge: "bg-amber-100 text-amber-600" },
                  };
                  const colors = tierColors[tierOpt.tier];
                  return (
                    <button
                      key={tierOpt.tier}
                      type="button"
                      onClick={() => setSelectedTier(tierOpt.tier)}
                      className={`w-full rounded-lg border px-4 py-3 text-left transition-all ${
                        isSelected
                          ? `${colors.border} ${colors.bg} ring-1 ring-current/10`
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? colors.border.replace("/40", "") : "border-gray-300"
                          }`}>
                            {isSelected && (
                              <div className={`h-2 w-2 rounded-full ${
                                tierOpt.tier === "basic" ? "bg-[#00AFF0]" :
                                tierOpt.tier === "premium" ? "bg-purple-500" : "bg-amber-500"
                              }`} />
                            )}
                          </div>
                          <div>
                            <span className={`text-sm font-semibold ${isSelected ? "text-gray-900" : "text-gray-700"}`}>
                              {tierOpt.label}
                            </span>
                            <p className="text-xs text-gray-400">{tierOpt.description}</p>
                          </div>
                        </div>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          isSelected ? colors.badge : "bg-gray-100 text-gray-500"
                        }`}>
                          ${tierOpt.price.toFixed(2)}/mo
                        </span>
                      </div>
                    </button>
                  );
                })}
                <p className="text-center text-xs text-gray-400 mt-1">Paid in USDC on Solana</p>
              </div>
            ) : (
              <div className="mb-5 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-center">
                <p className="text-sm text-gray-500">Monthly subscription</p>
                <p className="mt-0.5 text-xl font-bold text-gray-900">
                  ${currentPrice.toFixed(2)}
                  <span className="text-sm font-normal text-gray-400">/mo</span>
                </p>
                <p className="mt-0.5 text-xs text-gray-400">Paid in USDC on Solana</p>
              </div>
            )}

            {/* Payment Options */}
            <div className="mb-5 space-y-3">
              {/* Pay with Wallet */}
              <label className="flex cursor-pointer items-center gap-4 rounded-lg border border-[#00AFF0]/30 bg-[#00AFF0]/5 p-4 transition-colors hover:bg-[#00AFF0]/10">
                <input
                  type="radio"
                  name="payment-method"
                  defaultChecked
                  className="sr-only"
                />
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#00AFF0]/20">
                  <svg
                    className="h-5 w-5 text-[#00AFF0]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 110-6h.008a2.244 2.244 0 011.547.645l.746.746M21 12a2.25 2.25 0 01-2.25 2.25H15a3 3 0 100 6h.008c.58 0 1.135-.224 1.547-.645l.746-.746M21 12H3m18 0a2.25 2.25 0 00-2.25-2.25H15"
                    />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    Pay with Wallet
                  </p>
                  <p className="text-xs text-gray-400">
                    {connected
                      ? `${walletName} - ${truncateAddress(publicKey?.toBase58() ?? "")}`
                      : "Connect wallet to pay with USDC"}
                  </p>
                </div>
                <div className="ml-auto h-4 w-4 flex-shrink-0 rounded-full border-2 border-[#00AFF0] bg-[#00AFF0]/30" />
              </label>

              {/* Pay with Card (Coming Soon) */}
              <div className="flex cursor-not-allowed items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 opacity-50">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                    />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-500">
                    Pay with Card
                  </p>
                  <p className="text-xs text-gray-400">Coming soon</p>
                </div>
                <div className="ml-auto h-4 w-4 flex-shrink-0 rounded-full border-2 border-gray-300" />
              </div>
            </div>

            {/* Promo Code */}
            <div className="mb-5">
              {!appliedPromo ? (
                <>
                  <button
                    onClick={() => setPromoExpanded(!promoExpanded)}
                    className="text-xs font-medium text-[#00AFF0] transition-colors hover:text-[#009ad6]"
                  >
                    {promoExpanded ? "Hide promo code" : "Have a promo code?"}
                  </button>
                  {promoExpanded && (
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => {
                          setPromoCode(e.target.value.toUpperCase());
                          setPromoError(null);
                        }}
                        placeholder="Enter code"
                        maxLength={20}
                        className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-sm text-gray-900 focus:border-[#00AFF0] focus:outline-none focus:ring-1 focus:ring-[#00AFF0]"
                      />
                      <button
                        onClick={handleApplyPromo}
                        disabled={promoValidating || !promoCode.trim()}
                        className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {promoValidating ? "..." : "Apply"}
                      </button>
                    </div>
                  )}
                  {promoError && (
                    <p className="mt-1.5 text-xs text-red-500">{promoError}</p>
                  )}
                </>
              ) : (
                <div className="rounded-lg border border-green-500/30 bg-green-500/5 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-green-600">
                        {appliedPromo.type === "discount"
                          ? `${appliedPromo.discount_percent}% off applied`
                          : `${appliedPromo.trial_days} day free trial applied`}
                      </p>
                      <p className="text-xs text-green-600/70">
                        Code: {appliedPromo.code}
                      </p>
                    </div>
                    <button
                      onClick={handleRemovePromo}
                      className="text-xs font-medium text-gray-400 transition-colors hover:text-gray-600"
                    >
                      Remove
                    </button>
                  </div>
                  {appliedPromo.type === "discount" && (
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      <span className="text-gray-400 line-through">
                        ${currentPrice.toFixed(2)}
                      </span>
                      <span className="font-bold text-green-600">
                        ${effectivePrice.toFixed(2)}/mo
                      </span>
                    </div>
                  )}
                  {appliedPromo.type === "free_trial" && (
                    <p className="mt-1 text-xs text-green-600/70">
                      {appliedPromo.trial_days} days free, then ${currentPrice.toFixed(2)}/mo
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Wallet Status & Action */}
            {connected ? (
              <div className="space-y-3">
                {/* Connected wallet info */}
                <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-400" />
                    <span className="text-xs text-gray-500">
                      {walletName}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-gray-400">
                    {truncateAddress(publicKey?.toBase58() ?? "")}
                  </span>
                </div>

                {/* Error message */}
                {txState.status === "error" && (
                  <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
                    <p className="text-xs font-medium text-red-400">
                      Transaction Failed
                    </p>
                    <p className="mt-0.5 text-xs text-red-400/70">
                      {txState.message}
                    </p>
                  </div>
                )}

                {/* Subscribe button */}
                <button
                  onClick={handleSubscribe}
                  disabled={txState.status === "confirming"}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#00AFF0] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#009ad6] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {txState.status === "confirming" ? (
                    <>
                      <Spinner />
                      <span>Confirming Transaction...</span>
                    </>
                  ) : txState.status === "error" ? (
                    <span>Retry Payment</span>
                  ) : (
                    <span>
                      {isFreeTrial
                        ? `Start Free Trial${hasMultipleTiers ? ` (${currentTier.label})` : ""}`
                        : `Subscribe for $${effectivePrice.toFixed(2)} USDC${hasMultipleTiers ? ` (${currentTier.label})` : ""}`}
                    </span>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Phantom not installed hint */}
                <button
                  onClick={handleConnectWallet}
                  className="w-full rounded-lg bg-[#00AFF0] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#009ad6] active:scale-[0.98]"
                >
                  Connect Wallet
                </button>
                <p className="text-center text-xs text-gray-400">
                  Don&apos;t have a wallet?{" "}
                  <a
                    href="https://phantom.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#00AFF0] hover:underline"
                  >
                    Get Phantom
                  </a>
                </p>
              </div>
            )}

            {/* Disclaimer */}
            <p className="mt-3 text-center text-xs text-gray-400">
              Cancel anytime. You&apos;ll be charged monthly.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
