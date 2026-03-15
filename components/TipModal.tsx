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

const TIP_PRESETS = [1, 5, 10, 25, 50, 100] as const;

type TxState =
  | { status: "idle" }
  | { status: "confirming" }
  | { status: "success"; signature: string }
  | { status: "error"; message: string };

interface TipModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly creatorName: string;
  readonly creatorUsername: string;
  readonly creatorId: string;
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function truncateSignature(sig: string): string {
  return `${sig.slice(0, 8)}...${sig.slice(-8)}`;
}

function dollarsToUsdcUnits(dollars: number): number {
  return Math.round(dollars * 1_000_000);
}

export function TipModal({
  isOpen,
  onClose,
  creatorName,
  creatorUsername,
  creatorId,
}: TipModalProps) {
  const { publicKey, sendTransaction, connected, wallet } = useWallet();
  const { connection } = useConnection();
  const { setVisible: openWalletModal } = useWalletModal();
  const track = useTrack();
  const [txState, setTxState] = useState<TxState>({ status: "idle" });
  const [amount, setAmount] = useState<string>("5");
  const [message, setMessage] = useState<string>("");

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
      setAmount("5");
      setMessage("");
    }
  }, [isOpen]);

  const handleConnectWallet = useCallback(() => {
    openWalletModal(true);
  }, [openWalletModal]);

  const parsedAmount = parseFloat(amount);
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0;

  const handleSendTip = useCallback(async () => {
    if (!publicKey || !sendTransaction || !isValidAmount) return;

    track("tip_click", creatorUsername, { amount: parsedAmount });

    try {
      setTxState({ status: "confirming" });

      const usdcAmount = dollarsToUsdcUnits(parsedAmount);
      const usdcMint = new PublicKey(USDC_MINT_ADDRESS);
      const platformWallet = new PublicKey(PLATFORM_WALLET_ADDRESS);

      const senderAta = await getAssociatedTokenAddress(usdcMint, publicKey);
      const recipientAta = await getAssociatedTokenAddress(usdcMint, platformWallet);

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

      // Record tip in database
      try {
        await fetch("/api/tips", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creator_id: creatorId,
            amount_usdc: Math.round(parsedAmount * 100), // cents
            payment_tx: signature,
            message: message.trim() || undefined,
          }),
        });
      } catch {
        console.error("Failed to record tip in database");
      }

      setTxState({ status: "success", signature });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Transaction failed";
      setTxState({ status: "error", message: msg });
    }
  }, [publicKey, sendTransaction, connection, parsedAmount, isValidAmount, creatorId, message, creatorUsername, track]);

  if (!isOpen) return null;

  const walletName = wallet?.adapter?.name ?? "";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Send tip to ${creatorName}`}
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
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
          aria-label="Close modal"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Success State */}
        {txState.status === "success" && (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
              <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">Tip Sent!</h3>
            <p className="mt-1 text-sm text-gray-500">
              You tipped @{creatorUsername} ${parsedAmount.toFixed(2)} USDC
            </p>
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
            <div className="mb-5 flex flex-col items-center text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#10b981] to-[#059669]">
                <span className="text-2xl font-bold text-white">
                  {creatorName.charAt(0)}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Send a Tip</h3>
              <p className="text-sm text-gray-400">to @{creatorUsername}</p>
            </div>

            {/* Amount Presets */}
            <div className="mb-4 grid grid-cols-3 gap-2">
              {TIP_PRESETS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(String(preset))}
                  className={`rounded-lg border py-2 text-sm font-medium transition-colors ${
                    amount === String(preset)
                      ? "border-[#10b981] bg-[#10b981]/10 text-[#10b981]"
                      : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  ${preset}
                </button>
              ))}
            </div>

            {/* Custom Amount */}
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-gray-500">
                Custom amount (USDC)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  $
                </span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-7 pr-4 text-sm text-gray-900 outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981]"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Optional Message */}
            <div className="mb-5">
              <label className="mb-1.5 block text-xs font-medium text-gray-500">
                Message (optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={500}
                rows={2}
                className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981]"
                placeholder="Say something nice..."
              />
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
                  onClick={handleSendTip}
                  disabled={txState.status === "confirming" || !isValidAmount}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#10b981] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#059669] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {txState.status === "confirming" ? (
                    <>
                      <Spinner />
                      <span>Confirming Transaction...</span>
                    </>
                  ) : txState.status === "error" ? (
                    <span>Retry Tip</span>
                  ) : (
                    <span>
                      Send ${isValidAmount ? parsedAmount.toFixed(2) : "0.00"} USDC Tip
                    </span>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleConnectWallet}
                  className="w-full rounded-lg bg-[#10b981] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#059669] active:scale-[0.98]"
                >
                  Connect Wallet
                </button>
                <p className="text-center text-xs text-gray-400">
                  Don&apos;t have a wallet?{" "}
                  <a
                    href="https://phantom.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#10b981] hover:underline"
                  >
                    Get Phantom
                  </a>
                </p>
              </div>
            )}

            <p className="mt-3 text-center text-xs text-gray-400">
              Tips are sent via USDC on Solana
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
