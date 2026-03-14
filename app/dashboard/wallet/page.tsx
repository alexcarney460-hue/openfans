"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Settings,
  Loader2,
  XCircle,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

type TransactionType =
  | "deposit"
  | "withdrawal"
  | "subscription_charge"
  | "subscription_received"
  | "tip_sent"
  | "tip_received"
  | "refund"
  | "platform_fee";

interface WalletTransaction {
  readonly id: number;
  readonly type: TransactionType;
  readonly amount_usdc: number;
  readonly balance_after: number;
  readonly description: string | null;
  readonly reference_id: string | null;
  readonly status: "pending" | "completed" | "failed";
  readonly created_at: string;
}

interface WalletData {
  readonly wallet: {
    readonly id: number;
    readonly balance_usdc: number;
    readonly minimum_balance_usdc: number;
    readonly available_for_withdrawal: number;
    readonly created_at: string;
  };
  readonly transactions: readonly WalletTransaction[];
}

interface UserProfile {
  readonly id: string;
  readonly role: string;
  readonly wallet_address: string | null;
}

interface PayoutRecord {
  readonly id: number;
  readonly amount_usdc: number;
  readonly wallet_address: string;
  readonly payment_tx: string | null;
  readonly status: "pending" | "processing" | "completed" | "failed";
  readonly created_at: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatUsdc(cents: number): string {
  return `$${(Math.abs(cents) / 100).toFixed(2)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function truncateAddress(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

const TX_TYPE_CONFIG: Record<
  TransactionType,
  { label: string; colorClass: string; icon: typeof ArrowDownLeft }
> = {
  deposit: { label: "Deposit", colorClass: "text-green-600", icon: ArrowDownLeft },
  withdrawal: { label: "Withdrawal", colorClass: "text-red-500", icon: ArrowUpRight },
  subscription_charge: { label: "Subscription", colorClass: "text-red-500", icon: ArrowUpRight },
  subscription_received: { label: "Sub Received", colorClass: "text-green-600", icon: ArrowDownLeft },
  tip_sent: { label: "Tip Sent", colorClass: "text-red-500", icon: ArrowUpRight },
  tip_received: { label: "Tip Received", colorClass: "text-green-600", icon: ArrowDownLeft },
  refund: { label: "Refund", colorClass: "text-green-600", icon: RefreshCw },
  platform_fee: { label: "Platform Fee", colorClass: "text-gray-500", icon: ArrowUpRight },
};

const STATUS_ICON = {
  completed: <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />,
  pending: <Clock className="h-3.5 w-3.5 text-amber-500" />,
  processing: <Loader2 className="h-3.5 w-3.5 animate-spin text-[#00AFF0]" />,
  failed: <XCircle className="h-3.5 w-3.5 text-red-500" />,
};

const STATUS_BADGE_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  processing: "bg-blue-50 text-[#00AFF0] border-blue-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  failed: "bg-red-50 text-red-700 border-red-200",
};

// ─── Loading Spinner ────────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#00AFF0]" />
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState<"all" | "deposits" | "charges">("all");
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [payouts, setPayouts] = useState<readonly PayoutRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isCreator = userProfile?.role === "creator" || userProfile?.role === "admin";

  const fetchAll = useCallback(() => {
    setLoading(true);
    setError(null);

    Promise.all([
      fetch("/api/wallet").then((res) => {
        if (!res.ok) throw new Error("Failed to load wallet");
        return res.json();
      }),
      fetch("/api/me").then((res) => (res.ok ? res.json() : null)),
      fetch("/api/payouts/mine").then((res) => (res.ok ? res.json() : null)),
    ])
      .then(([walletJson, meJson, payoutsJson]) => {
        if (walletJson.data) {
          setWalletData(walletJson.data);
        }
        if (meJson?.data) {
          setUserProfile(meJson.data);
        }
        if (payoutsJson?.data) {
          setPayouts(payoutsJson.data);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load wallet data. Please try again.");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
          <p className="mt-1 text-sm text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  const balance = walletData?.wallet.balance_usdc ?? 0;
  const minimum = walletData?.wallet.minimum_balance_usdc ?? 0;
  const available = walletData?.wallet.available_for_withdrawal ?? 0;
  const transactions = walletData?.transactions ?? [];
  const walletAddress = userProfile?.wallet_address ?? null;

  const filteredTxns = transactions.filter((tx) => {
    if (activeTab === "all") return true;
    if (activeTab === "deposits")
      return ["deposit", "subscription_received", "tip_received", "refund"].includes(tx.type);
    return ["withdrawal", "subscription_charge", "tip_sent", "platform_fee"].includes(tx.type);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
        <p className="mt-1 text-sm text-gray-500">
          {isCreator
            ? "Track your earnings and withdraw funds"
            : "Manage your USDC balance for subscriptions and tips"}
        </p>
      </div>

      {/* Balance Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Total Balance */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00AFF0]/10">
              <Wallet className="h-5 w-5 text-[#00AFF0]" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400">Total Balance</p>
              <p className="text-2xl font-bold text-gray-900">{formatUsdc(balance)}</p>
            </div>
          </div>
        </div>

        {/* Available for Withdrawal */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <ArrowUpRight className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400">
                {isCreator ? "Available to Withdraw" : "Available"}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatUsdc(Math.max(available, 0))}
              </p>
            </div>
          </div>
        </div>

        {/* Minimum Required / Pending */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <AlertCircle className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400">
                {isCreator ? "Minimum Hold" : "Minimum Hold"}
              </p>
              <p className="text-2xl font-bold text-gray-900">{formatUsdc(minimum)}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            Required for active subscriptions
          </p>
        </div>
      </div>

      {/* Connected Wallet */}
      {isCreator && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <Wallet className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400">
                  Payout Wallet
                </p>
                {walletAddress ? (
                  <p className="text-sm font-semibold text-gray-900 font-mono">
                    {truncateAddress(walletAddress)}
                  </p>
                ) : (
                  <p className="text-sm text-amber-600 font-medium">
                    No wallet connected
                  </p>
                )}
              </div>
            </div>
            {walletAddress ? (
              <CopyButton text={walletAddress} />
            ) : (
              <Link
                href="/dashboard/settings"
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
              >
                <Settings className="h-3.5 w-3.5" />
                Connect in Settings
              </Link>
            )}
          </div>
          {!walletAddress && (
            <div className="mt-3">
              <p className="text-xs text-gray-400">
                You must connect a Solana wallet address in your profile settings before requesting a withdrawal.
              </p>
              <Link
                href="/help/wallet-setup"
                className="mt-1 inline-flex items-center gap-1 text-xs text-[#00AFF0] transition-colors hover:text-[#009dd8]"
              >
                Need help setting up a wallet?
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {isCreator ? (
          <button
            onClick={() => setShowWithdrawModal(true)}
            disabled={available <= 0 || !walletAddress}
            className="flex items-center gap-2 rounded-lg bg-[#00AFF0] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#009ad6] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowUpRight className="h-4 w-4" />
            Withdraw Earnings
          </button>
        ) : (
          <>
            <button
              onClick={() => setShowDepositModal(true)}
              className="flex items-center gap-2 rounded-lg bg-[#00AFF0] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#009ad6]"
            >
              <ArrowDownLeft className="h-4 w-4" />
              Deposit USDC
            </button>
            <button
              onClick={() => setShowWithdrawModal(true)}
              disabled={available <= 0}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowUpRight className="h-4 w-4" />
              Withdraw
            </button>
          </>
        )}
      </div>

      {/* Payout History (creators only) */}
      {isCreator && payouts.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-sm font-bold text-gray-900">Payout History</h2>
            <p className="mt-0.5 text-xs text-gray-400">
              Track the status of your withdrawal requests
            </p>
          </div>
          <div className="divide-y divide-gray-100">
            {payouts.map((payout) => (
              <div
                key={payout.id}
                className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-gray-50"
              >
                {/* Status icon */}
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gray-50">
                  {STATUS_ICON[payout.status]}
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">
                      Withdrawal to {truncateAddress(payout.wallet_address)}
                    </p>
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${
                        STATUS_BADGE_STYLES[payout.status] ?? STATUS_BADGE_STYLES.pending
                      }`}
                    >
                      {payout.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {formatDate(payout.created_at)}
                  </p>
                </div>

                {/* Amount + tx link */}
                <div className="flex-shrink-0 text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    -{formatUsdc(payout.amount_usdc)}
                  </p>
                  {payout.payment_tx ? (
                    <a
                      href={`https://explorer.solana.com/tx/${payout.payment_tx}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[#00AFF0] hover:underline"
                    >
                      View tx
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400">--</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* How It Works */}
      <div className="rounded-xl border border-[#00AFF0]/20 bg-[#00AFF0]/5 p-5">
        <h3 className="text-sm font-bold text-gray-900">
          {isCreator ? "How creator earnings work" : "How your wallet works"}
        </h3>
        <ul className="mt-2 space-y-1.5 text-xs text-gray-600">
          {isCreator ? (
            <>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#00AFF0]" />
                When fans subscribe or tip you, the earnings appear in your balance
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#00AFF0]" />
                You keep up to 95% of all earnings (5% platform fee)
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#00AFF0]" />
                Withdraw your available balance anytime to your Solana wallet
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#00AFF0]" />
                Connect your Phantom or Solflare wallet in Settings to receive payouts
              </li>
            </>
          ) : (
            <>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#00AFF0]" />
                Deposit USDC from your Phantom or Solflare wallet into your OpenFans balance
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#00AFF0]" />
                Subscriptions are automatically charged from your balance each month
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#00AFF0]" />
                A minimum balance is required to cover your active subscriptions
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#00AFF0]" />
                Withdraw your available balance anytime to your Solana wallet
              </li>
            </>
          )}
        </ul>
      </div>

      {/* Transaction History */}
      <div className="rounded-xl border border-gray-200 bg-white">
        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-gray-200 px-4 pt-4">
          {(["all", "deposits", "charges"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === tab
                  ? "bg-[#00AFF0]/10 text-[#00AFF0]"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab === "all" ? "All" : tab === "deposits" ? "Credits" : "Debits"}
            </button>
          ))}
        </div>

        {/* Transaction List */}
        <div className="divide-y divide-gray-100">
          {filteredTxns.length === 0 ? (
            <div className="py-12 text-center">
              <Wallet className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm text-gray-400">No transactions yet</p>
            </div>
          ) : (
            filteredTxns.map((tx) => {
              const config = TX_TYPE_CONFIG[tx.type];
              const Icon = config.icon;
              const isCredit = tx.amount_usdc > 0;

              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-gray-50"
                >
                  {/* Icon */}
                  <div
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
                      isCredit ? "bg-green-500/10" : "bg-red-500/10"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${isCredit ? "text-green-600" : "text-red-500"}`}
                    />
                  </div>

                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">
                        {config.label}
                      </p>
                      {STATUS_ICON[tx.status]}
                    </div>
                    <p className="truncate text-xs text-gray-400">
                      {tx.description}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="flex-shrink-0 text-right">
                    <p
                      className={`text-sm font-semibold ${
                        isCredit ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {isCredit ? "+" : "-"}
                      {formatUsdc(tx.amount_usdc)}
                    </p>
                    <p className="text-xs text-gray-400">{formatDate(tx.created_at)}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <DepositModal onClose={() => setShowDepositModal(false)} onSuccess={fetchAll} />
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <WithdrawModal
          available={available}
          walletAddress={walletAddress}
          isCreator={isCreator}
          onClose={() => setShowWithdrawModal(false)}
          onSuccess={fetchAll}
        />
      )}
    </div>
  );
}

// ─── Copy Button ─────────────────────────────────────────────────────────────

function CopyButton({ text }: { readonly text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
    >
      {copied ? (
        <>
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          Copy
        </>
      )}
    </button>
  );
}

// ─── Deposit Modal ──────────────────────────────────────────────────────────

function DepositModal({
  onClose,
  onSuccess,
}: {
  readonly onClose: () => void;
  readonly onSuccess: () => void;
}) {
  const [amount, setAmount] = useState("");
  const PLATFORM_WALLET = "4e8YpUSns8RoVrPfVayhX4BWQSqecmjFUh1jxx77niQt";
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const presets = [10, 25, 50, 100];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(PLATFORM_WALLET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeposit = async () => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) return;

    setSubmitting(true);
    try {
      await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deposit",
          amount_usdc: Math.round(parsedAmount * 100),
          payment_tx: `manual-deposit-${Date.now()}`,
        }),
      });
      onSuccess();
      onClose();
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-900"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#00AFF0]/10">
            <ArrowDownLeft className="h-6 w-6 text-[#00AFF0]" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Deposit USDC</h3>
          <p className="mt-1 text-sm text-gray-500">
            Send USDC to your OpenFans wallet
          </p>
        </div>

        {/* Amount Presets */}
        <div className="mb-4 grid grid-cols-4 gap-2">
          {presets.map((preset) => (
            <button
              key={preset}
              onClick={() => setAmount(preset.toString())}
              className={`rounded-lg border py-2 text-sm font-medium transition-colors ${
                amount === preset.toString()
                  ? "border-[#00AFF0] bg-[#00AFF0]/10 text-[#00AFF0]"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              ${preset}
            </button>
          ))}
        </div>

        {/* Custom Amount */}
        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Custom amount (USDC)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
            <input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-7 pr-4 text-sm text-gray-900 focus:border-[#00AFF0] focus:outline-none focus:ring-1 focus:ring-[#00AFF0]"
            />
          </div>
        </div>

        {/* Platform Wallet Address */}
        <div className="mb-5 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="mb-1 text-xs font-medium text-gray-500">
            Send USDC (Solana) to this address:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate text-xs text-gray-700">
              {PLATFORM_WALLET}
            </code>
            <button
              onClick={handleCopy}
              className="flex-shrink-0 rounded-md bg-gray-200 p-1.5 text-gray-500 transition-colors hover:bg-gray-300"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
          {copied && (
            <p className="mt-1 text-xs text-green-600">Copied to clipboard!</p>
          )}
        </div>

        <p className="mb-4 text-center text-xs text-gray-400">
          After sending, your balance will update automatically.
        </p>

        <button
          onClick={handleDeposit}
          disabled={submitting || !amount || parseFloat(amount) <= 0}
          className="w-full rounded-lg bg-[#00AFF0] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#009ad6] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Processing..." : "Confirm Deposit"}
        </button>
      </div>
    </div>
  );
}

// ─── Withdraw Modal ─────────────────────────────────────────────────────────

type WithdrawStep = "form" | "confirm";

function WithdrawModal({
  available,
  walletAddress,
  isCreator,
  onClose,
  onSuccess,
}: {
  readonly available: number;
  readonly walletAddress: string | null;
  readonly isCreator: boolean;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
}) {
  const [step, setStep] = useState<WithdrawStep>("form");
  const [amount, setAmount] = useState("");
  const [manualWalletAddress, setManualWalletAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // For creators, the wallet address comes from their profile.
  // For fans, they enter it manually (using the old flow via /api/wallet).
  const effectiveWalletAddress = isCreator ? walletAddress : manualWalletAddress;

  const MINIMUM_PAYOUT_CENTS = 500; // $5.00
  const parsedAmount = parseFloat(amount);
  const amountCents = parsedAmount > 0 ? Math.round(parsedAmount * 100) : 0;
  const isBelowMinimum = amountCents > 0 && amountCents < MINIMUM_PAYOUT_CENTS;
  const isValidAmount = parsedAmount > 0 && amountCents >= MINIMUM_PAYOUT_CENTS && amountCents <= available;
  const canSubmit = isValidAmount && !!effectiveWalletAddress;

  const handleFillMax = () => {
    setAmount((Math.max(available, 0) / 100).toFixed(2));
  };

  const handleConfirm = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    setApiError(null);

    try {
      if (isCreator) {
        // Use the payout request endpoint for creators
        const res = await fetch("/api/payouts/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount_usdc: amountCents }),
        });

        const json = await res.json();

        if (!res.ok) {
          setApiError(json.error ?? "Failed to request withdrawal. Please try again.");
          setSubmitting(false);
          setStep("form");
          return;
        }
      } else {
        // Fan withdrawal (old path, though API currently rejects it)
        const res = await fetch("/api/wallet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "withdraw",
            amount_usdc: amountCents,
            wallet_address: manualWalletAddress,
          }),
        });

        const json = await res.json();

        if (!res.ok) {
          setApiError(json.error ?? "Failed to request withdrawal. Please try again.");
          setSubmitting(false);
          setStep("form");
          return;
        }
      }

      setSuccess(true);
      setSubmitting(false);

      // Auto-close after showing success
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch {
      setApiError("Network error. Please check your connection and try again.");
      setSubmitting(false);
      setStep("form");
    }
  };

  // Success state
  if (success) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
        <div className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-2xl">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle2 className="h-7 w-7 text-green-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Withdrawal Requested</h3>
            <p className="mt-2 text-sm text-gray-500">
              Your withdrawal of {formatUsdc(amountCents)} has been submitted and is
              pending admin review.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-900"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {step === "form" ? (
          <>
            <div className="mb-5 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                <ArrowUpRight className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Withdraw USDC</h3>
              <p className="mt-1 text-sm text-gray-500">
                Available: {formatUsdc(Math.max(available, 0))}
              </p>
            </div>

            {/* Error display */}
            {apiError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-xs text-red-700">{apiError}</p>
              </div>
            )}

            {/* Wallet Address (for non-creators only) */}
            {!isCreator && (
              <div className="mb-4">
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Solana wallet address
                </label>
                <input
                  type="text"
                  value={manualWalletAddress}
                  onChange={(e) => setManualWalletAddress(e.target.value)}
                  placeholder="Enter your Solana wallet address"
                  className="w-full rounded-lg border border-gray-200 py-2.5 px-3 text-sm text-gray-900 focus:border-[#00AFF0] focus:outline-none focus:ring-1 focus:ring-[#00AFF0]"
                />
              </div>
            )}

            {/* Creator payout wallet display */}
            {isCreator && walletAddress && (
              <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="mb-1 text-xs font-medium text-gray-500">
                  Withdrawal will be sent to:
                </p>
                <p className="text-sm font-mono text-gray-900">
                  {truncateAddress(walletAddress)}
                </p>
              </div>
            )}

            {/* Amount */}
            <div className="mb-4">
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Amount (USDC)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  min="0.01"
                  max={available / 100}
                  step="0.01"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setApiError(null);
                  }}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-gray-200 py-2.5 pl-7 pr-4 text-sm text-gray-900 focus:border-[#00AFF0] focus:outline-none focus:ring-1 focus:ring-[#00AFF0]"
                />
              </div>
              <div className="mt-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleFillMax}
                    className="text-xs font-medium text-[#00AFF0] hover:underline"
                  >
                    Max ({formatUsdc(Math.max(available, 0))})
                  </button>
                  <span className="text-xs text-gray-400">
                    Min: $5.00
                  </span>
                </div>
                <div>
                  {isBelowMinimum && (
                    <p className="text-xs text-red-500">Minimum withdrawal is $5.00</p>
                  )}
                  {parsedAmount > 0 && amountCents > available && (
                    <p className="text-xs text-red-500">Exceeds available balance</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs text-amber-700">
                Withdrawals are reviewed by an admin and typically processed within 24 hours.
              </p>
            </div>

            <button
              onClick={() => setStep("confirm")}
              disabled={!canSubmit}
              className="w-full rounded-lg bg-[#00AFF0] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#009ad6] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Request Withdrawal
            </button>
          </>
        ) : (
          /* Confirmation step */
          <>
            <div className="mb-5 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
                <AlertCircle className="h-6 w-6 text-amber-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Confirm Withdrawal</h3>
              <p className="mt-1 text-sm text-gray-500">
                Please review the details below
              </p>
            </div>

            <div className="mb-5 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex justify-between">
                <span className="text-xs font-medium text-gray-500">Amount</span>
                <span className="text-sm font-bold text-gray-900">
                  {formatUsdc(amountCents)} USDC
                </span>
              </div>
              <div className="border-t border-gray-200" />
              <div className="flex justify-between">
                <span className="text-xs font-medium text-gray-500">Destination</span>
                <span className="text-sm font-mono text-gray-900">
                  {effectiveWalletAddress ? truncateAddress(effectiveWalletAddress) : "--"}
                </span>
              </div>
              <div className="border-t border-gray-200" />
              <div className="flex justify-between">
                <span className="text-xs font-medium text-gray-500">Remaining balance</span>
                <span className="text-sm text-gray-900">
                  {formatUsdc(Math.max(available - amountCents, 0))}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("form")}
                disabled={submitting}
                className="flex-1 rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#00AFF0] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#009ad6] disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Confirm Withdrawal"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
