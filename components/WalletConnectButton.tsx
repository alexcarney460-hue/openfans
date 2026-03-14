"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { cn } from "@/lib/utils";

interface WalletConnectButtonProps {
  className?: string;
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
    navigator.userAgent,
  );
}

function openPhantomDeepLink() {
  const currentUrl = window.location.href;
  const encodedUrl = encodeURIComponent(currentUrl);
  window.location.href = `https://phantom.app/ul/browse/${encodedUrl}?ref=${encodedUrl}`;
}

export default function WalletConnectButton({
  className,
  onConnect,
  onDisconnect,
}: WalletConnectButtonProps) {
  const { publicKey, wallet, select, connect, disconnect, connecting, connected, wallets } = useWallet();
  const [showMenu, setShowMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const userClickedConnect = useRef(false);

  const handleConnect = useCallback(async () => {
    setError(null);

    // Mobile without Phantom in-app browser → deep-link to Phantom
    if (isMobile() && !(window as any).phantom?.solana) {
      openPhantomDeepLink();
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
      setError("No wallet found. Install the Phantom browser extension to continue.");
      return;
    }

    try {
      userClickedConnect.current = true;
      select(target.adapter.name);
    } catch (err) {
      userClickedConnect.current = false;
      setError(err instanceof Error ? err.message : "Failed to connect");
    }
  }, [wallets, select]);

  // Only auto-connect after the user explicitly clicked "Connect Wallet"
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
      connect().catch((err) => {
        if (err instanceof Error && !err.message.includes("User rejected")) {
          setError(err.message);
        }
      });
    }
  }, [wallet, connected, connecting, connect]);

  const handleDisconnect = useCallback(async () => {
    await disconnect();
    setShowMenu(false);
    onDisconnect?.();
  }, [disconnect, onDisconnect]);

  // Notify parent when wallet connects
  const address = publicKey?.toBase58() ?? "";
  if (connected && address && onConnect) {
    onConnect(address);
  }

  const walletName = wallet?.adapter?.name ?? "";
  const isPhantom = walletName.toLowerCase().includes("phantom");
  const isSolflare = walletName.toLowerCase().includes("solflare");

  if (connected && publicKey) {
    return (
      <div className={cn("relative", className)}>
        <button
          type="button"
          onClick={() => setShowMenu((prev) => !prev)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#00AFF0]/30 bg-[#00AFF0]/10 px-4 py-2.5 text-sm font-medium text-[#00AFF0] transition-colors hover:bg-[#00AFF0]/20"
        >
          {isPhantom && <PhantomLogo />}
          {isSolflare && <SolflareLogo />}
          {!isPhantom && !isSolflare && <WalletIcon />}
          <span>{truncateAddress(address)}</span>
          <span className="ml-1 rounded bg-[#00AFF0]/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#00AFF0]">
            Connected
          </span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className={cn(
              "ml-1 transition-transform",
              showMenu ? "rotate-180" : "",
            )}
          >
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {showMenu && (
          <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
            <div className="border-b border-gray-100 px-4 py-2.5">
              <p className="text-xs text-gray-400">Connected with {walletName}</p>
              <p className="mt-0.5 font-mono text-xs text-gray-600">{address}</p>
            </div>
            <button
              type="button"
              onClick={handleDisconnect}
              className="w-full px-4 py-2.5 text-left text-sm text-red-400 transition-colors hover:bg-gray-50"
            >
              Disconnect Wallet
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <button
        type="button"
        onClick={handleConnect}
        disabled={connecting}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 transition-all hover:border-[#00AFF0]/40 hover:bg-[#00AFF0]/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <PhantomLogo />
        {connecting ? (
          <>
            <Spinner />
            <span>Connecting...</span>
          </>
        ) : (
          <span>Connect Wallet</span>
        )}
      </button>
      {error && (
        <p className="mt-1.5 text-center text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}

function PhantomLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 128 128" fill="none">
      <circle cx="64" cy="64" r="64" fill="url(#phantom-grad)" />
      <path
        d="M110.584 64.914H99.142C99.142 41.064 79.852 21.774 56.002 21.774C32.623 21.774 13.634 40.343 12.96 63.562C12.275 87.17 33.884 107.774 57.502 107.774H61.002C82.43 107.774 110.584 88.464 110.584 64.914Z"
        fill="url(#phantom-face)"
      />
      <circle cx="44.5" cy="57.5" r="6.5" fill="white" />
      <circle cx="72.5" cy="57.5" r="6.5" fill="white" />
      <defs>
        <linearGradient id="phantom-grad" x1="0" y1="0" x2="128" y2="128">
          <stop stopColor="#534BB1" />
          <stop offset="1" stopColor="#551BF9" />
        </linearGradient>
        <linearGradient id="phantom-face" x1="12" y1="22" x2="111" y2="108">
          <stop stopColor="#534BB1" />
          <stop offset="1" stopColor="#551BF9" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function SolflareLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 128 128" fill="none">
      <circle cx="64" cy="64" r="64" fill="#FC6B32" />
      <path
        d="M64 28L84 64L64 100L44 64L64 28Z"
        fill="white"
        fillOpacity="0.9"
      />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 110-6h.008a2.244 2.244 0 011.547.645l.746.746M21 12a2.25 2.25 0 01-2.25 2.25H15a3 3 0 100 6h.008c.58 0 1.135-.224 1.547-.645l.746-.746M21 12H3m18 0a2.25 2.25 0 00-2.25-2.25H15"
      />
    </svg>
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
