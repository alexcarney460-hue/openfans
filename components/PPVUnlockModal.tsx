"use client";

import { useEffect, useCallback, useState } from "react";
import { useTrack } from "@/hooks/useTrack";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { PublicKey, Transaction } from "@solana/web3.js";
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
  getAccount,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";

const USDC_MINT_ADDRESS =
  process.env.NEXT_PUBLIC_USDC_MINT || "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

const PLATFORM_WALLET_ADDRESS =
  process.env.NEXT_PUBLIC_PLATFORM_WALLET || "4e8YpUSns8RoVrPfVayhX4BWQSqecmjFUh1jxx77niQt";

type TxState =
  | { status: "idle" }
  | { status: "confirming" }
  | { status: "unlocking" }
  | { status: "success" }
  | { status: "error"; message: string };

interface PPVUnlockModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onUnlocked: (unlockedPost: Record<string, unknown>) => void;
  readonly postId: number;
  readonly postTitle: string | null;
  readonly priceUsdc: number; // cents
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function dollarsToUsdcUnits(dollars: number): number {
  return Math.round(dollars * 1_000_000);
}

export function PPVUnlockModal({
  isOpen,
  onClose,
  onUnlocked,
  postId,
  postTitle,
  priceUsdc,
}: PPVUnlockModalProps) {
  const { publicKey, sendTransaction, connected, wallet } = useWallet();
  const { connection } = useConnection();
  const { setVisible: openWalletModal } = useWalletModal();
  const track = useTrack();
  const [txState, setTxState] = useState<TxState>({ status: "idle" });

  const priceDollars = priceUsdc / 100;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
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

  useEffect(() => {
    if (!isOpen) {
      setTxState({ status: "idle" });
    }
  }, [isOpen]);

  const handleConnectWallet = useCallback(() => {
    openWalletModal(true);
  }, [openWalletModal]);

  const handleUnlock = useCallback(async () => {
    if (!publicKey || !sendTransaction) return;

    track("ppv_click", String(postId), { price: priceDollars });

    try {
      setTxState({ status: "confirming" });

      const usdcAmount = dollarsToUsdcUnits(priceDollars);
      const usdcMint = new PublicKey(USDC_MINT_ADDRESS);
      const platformWallet = new PublicKey(PLATFORM_WALLET_ADDRESS);

      const senderAta = await getAssociatedTokenAddress(usdcMint, publicKey);
      const recipientAta = await getAssociatedTokenAddress(usdcMint, platformWallet);

      const transaction = new Transaction();

      // Create recipient ATA if needed
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
        createTransferInstruction(senderAta, recipientAta, publicKey, usdcAmount),
      );

      const signature = await sendTransaction(transaction, connection);

      const latestBlockhash = await connection.getLatestBlockhash();
      await connection.confirmTransaction(
        {
          signature,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        },
        "confirmed",
      );

      // Record the purchase in database
      setTxState({ status: "unlocking" });

      const res = await fetch(`/api/posts/${postId}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_tx: signature }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({ error: "Failed to record purchase" }));
        throw new Error(json.error ?? "Failed to unlock post");
      }

      const json = await res.json();
      setTxState({ status: "success" });
      onUnlocked(json.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Transaction failed";
      setTxState({ status: "error", message: msg });
    }
  }, [publicKey, sendTransaction, connection, priceDollars, postId, onUnlocked]);

  if (!isOpen) return null;

  const walletName = wallet?.adapter?.name ?? "";
  const isProcessing = txState.status === "confirming" || txState.status === "unlocking";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Unlock post for $${priceDollars.toFixed(2)}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
          aria-label="Close modal"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Success State */}
        {txState.status === "success" && (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#00AFF0]/20">
              <svg className="h-8 w-8 text-[#00AFF0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">Post Unlocked!</h3>
            <p className="mt-1 text-sm text-gray-500">
              You now have permanent access to this content.
            </p>
            <button
              onClick={onClose}
              className="mt-5 w-full rounded-lg bg-[#00AFF0] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#009ad6]"
            >
              View Content
            </button>
          </div>
        )}

        {/* Normal / Error / Confirming States */}
        {txState.status !== "success" && (
          <>
            {/* Header */}
            <div className="mb-5 flex flex-col items-center text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#00AFF0] to-[#0088cc]">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Unlock Content</h3>
              {postTitle && (
                <p className="mt-1 max-w-xs truncate text-sm text-gray-500">
                  {postTitle}
                </p>
              )}
            </div>

            {/* Price Display */}
            <div className="mb-5 rounded-lg border border-gray-200 bg-gray-50 px-4 py-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                One-time purchase
              </p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                ${priceDollars.toFixed(2)}
              </p>
              <p className="mt-0.5 text-xs text-gray-400">USDC</p>
            </div>

            {/* Wallet Status & Action */}
            {connected ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-400" />
                    <span className="text-xs text-gray-500">{walletName}</span>
                  </div>
                  <span className="font-mono text-xs text-gray-400">
                    {truncateAddress(publicKey?.toBase58() ?? "")}
                  </span>
                </div>

                {txState.status === "error" && (
                  <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
                    <p className="text-xs font-medium text-red-400">Transaction Failed</p>
                    <p className="mt-0.5 text-xs text-red-400/70">{txState.message}</p>
                  </div>
                )}

                <button
                  onClick={handleUnlock}
                  disabled={isProcessing}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#00AFF0] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#009ad6] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {txState.status === "confirming" ? (
                    <>
                      <Spinner />
                      <span>Confirming Payment...</span>
                    </>
                  ) : txState.status === "unlocking" ? (
                    <>
                      <Spinner />
                      <span>Unlocking Content...</span>
                    </>
                  ) : txState.status === "error" ? (
                    <span>Retry Purchase</span>
                  ) : (
                    <span>Unlock for ${priceDollars.toFixed(2)} USDC</span>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleConnectWallet}
                  className="w-full rounded-lg bg-[#00AFF0] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#009ad6] active:scale-[0.98]"
                >
                  Connect Wallet to Unlock
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

            <p className="mt-3 text-center text-xs text-gray-400">
              One-time payment via USDC on Solana. Permanent access.
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
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
