"use client";

import { useEffect, useCallback } from "react";

interface SubscribeModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly creatorName: string;
  readonly creatorUsername: string;
  readonly price: number;
}

export function SubscribeModal({
  isOpen,
  onClose,
  creatorName,
  creatorUsername,
  price,
}: SubscribeModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Subscribe to ${creatorName}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md rounded-xl border border-white/[0.06] bg-[#111] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white"
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

        {/* Creator Info */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#00AFF0] to-[#0077B6]">
            <span className="text-2xl font-bold text-white">
              {creatorName.charAt(0)}
            </span>
          </div>
          <h3 className="text-lg font-bold text-white">{creatorName}</h3>
          <p className="text-sm text-white/40">@{creatorUsername}</p>
        </div>

        {/* Subscription Tier */}
        <div className="mb-5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-center">
          <p className="text-sm text-white/60">Monthly subscription</p>
          <p className="mt-0.5 text-xl font-bold text-white">
            ${price.toFixed(2)}
            <span className="text-sm font-normal text-white/40">/mo</span>
          </p>
        </div>

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
              <p className="text-sm font-semibold text-white">
                Pay with Wallet
              </p>
              <p className="text-xs text-white/40">
                Connect wallet to pay with USDC
              </p>
            </div>
            <div className="ml-auto h-4 w-4 flex-shrink-0 rounded-full border-2 border-[#00AFF0] bg-[#00AFF0]/30" />
          </label>

          {/* Pay with Card (Coming Soon) */}
          <div className="flex cursor-not-allowed items-center gap-4 rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 opacity-50">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/5">
              <svg
                className="h-5 w-5 text-white/30"
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
              <p className="text-sm font-semibold text-white/50">
                Pay with Card
              </p>
              <p className="text-xs text-white/30">Coming soon</p>
            </div>
            <div className="ml-auto h-4 w-4 flex-shrink-0 rounded-full border-2 border-white/10" />
          </div>
        </div>

        {/* Subscribe Button */}
        <button
          onClick={onClose}
          className="w-full rounded-lg bg-[#00AFF0] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#009ad6] active:scale-[0.98]"
        >
          Subscribe
        </button>

        {/* Disclaimer */}
        <p className="mt-3 text-center text-xs text-white/30">
          Cancel anytime. You&apos;ll be charged monthly.
        </p>
      </div>
    </div>
  );
}
