"use client"

import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"

interface WalletConnectButtonProps {
  className?: string
  onConnect?: (address: string) => void
  onDisconnect?: () => void
}

const MOCK_ADDRESS = "7xKXp2R9mNkE4vFw8qJdH6bYtL3mFp"

function truncateAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

export default function WalletConnectButton({
  className,
  onConnect,
  onDisconnect,
}: WalletConnectButtonProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const handleConnect = useCallback(async () => {
    setIsConnecting(true)
    // Simulate wallet connection delay
    await new Promise((resolve) => setTimeout(resolve, 1200))
    setAddress(MOCK_ADDRESS)
    setIsConnected(true)
    setIsConnecting(false)
    onConnect?.(MOCK_ADDRESS)
  }, [onConnect])

  const handleDisconnect = useCallback(() => {
    setAddress("")
    setIsConnected(false)
    setShowMenu(false)
    onDisconnect?.()
  }, [onDisconnect])

  if (isConnected) {
    return (
      <div className={cn("relative", className)}>
        <button
          type="button"
          onClick={() => setShowMenu((prev) => !prev)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#ab9ff2]/30 bg-[#ab9ff2]/10 px-4 py-2.5 text-sm font-medium text-[#ab9ff2] transition-colors hover:bg-[#ab9ff2]/20"
        >
          <PhantomLogo />
          <span>{truncateAddress(address)}</span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className={cn(
              "transition-transform",
              showMenu ? "rotate-180" : ""
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
          <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-lg border border-white/10 bg-[#141414] shadow-xl">
            <button
              type="button"
              onClick={handleDisconnect}
              className="w-full px-4 py-2.5 text-left text-sm text-red-400 transition-colors hover:bg-white/5"
            >
              Disconnect Wallet
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={handleConnect}
      disabled={isConnecting}
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#141414] px-4 py-2.5 text-sm font-medium text-white transition-all hover:border-[#ab9ff2]/40 hover:bg-[#ab9ff2]/10 disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
    >
      <PhantomLogo />
      {isConnecting ? (
        <>
          <Spinner />
          <span>Connecting...</span>
        </>
      ) : (
        <span>Connect Wallet</span>
      )}
    </button>
  )
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
  )
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
    >
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
  )
}
