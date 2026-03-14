"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
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
  id: number;
  type: TransactionType;
  amount_usdc: number;
  balance_after: number;
  description: string | null;
  reference_id: string | null;
  status: "pending" | "completed" | "failed";
  created_at: string;
}

interface WalletData {
  wallet: {
    id: number;
    balance_usdc: number;
    minimum_balance_usdc: number;
    available_for_withdrawal: number;
    created_at: string;
  };
  transactions: WalletTransaction[];
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
  failed: <AlertCircle className="h-3.5 w-3.5 text-red-500" />,
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
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("subscriber");

  const fetchWallet = useCallback(() => {
    setLoading(true);
    setError(null);

    // Fetch wallet data and user role in parallel
    Promise.all([
      fetch("/api/wallet").then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      }),
      fetch("/api/me").then((res) => res.ok ? res.json() : null),
    ])
      .then(([walletJson, meJson]) => {
        if (walletJson.data) {
          setWalletData(walletJson.data);
        }
        if (meJson?.data?.role) {
          setUserRole(meJson.data.role);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load wallet data. Please try again.");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

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
  const isCreator = userRole === "creator" || userRole === "admin";

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

        {/* Minimum Required (fans only) / Pending (creators) */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <AlertCircle className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400">
                {isCreator ? "Pending" : "Minimum Hold"}
              </p>
              <p className="text-2xl font-bold text-gray-900">{formatUsdc(minimum)}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            {isCreator
              ? "Processing or pending clearance"
              : "Required for active subscriptions"}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {isCreator ? (
          <button
            onClick={() => setShowWithdrawModal(true)}
            disabled={available <= 0}
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

      {/* Deposit Modal Placeholder */}
      {showDepositModal && (
        <DepositModal onClose={() => setShowDepositModal(false)} onSuccess={fetchWallet} />
      )}

      {/* Withdraw Modal Placeholder */}
      {showWithdrawModal && (
        <WithdrawModal
          available={available}
          onClose={() => setShowWithdrawModal(false)}
          onSuccess={fetchWallet}
        />
      )}
    </div>
  );
}

// ─── Deposit Modal ──────────────────────────────────────────────────────────

function DepositModal({ onClose, onSuccess }: { readonly onClose: () => void; readonly onSuccess: () => void }) {
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

function WithdrawModal({
  available,
  onClose,
  onSuccess,
}: {
  readonly available: number;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleWithdraw = async () => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0 || !walletAddress) return;

    setSubmitting(true);
    try {
      await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "withdraw",
          amount_usdc: Math.round(parsedAmount * 100),
          payment_tx: `withdrawal-${Date.now()}`,
          wallet_address: walletAddress,
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
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
            <ArrowUpRight className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Withdraw USDC</h3>
          <p className="mt-1 text-sm text-gray-500">
            Available: {formatUsdc(Math.max(available, 0))}
          </p>
        </div>

        {/* Wallet Address */}
        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Solana wallet address
          </label>
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="Enter your Solana wallet address"
            className="w-full rounded-lg border border-gray-200 py-2.5 px-3 text-sm text-gray-900 focus:border-[#00AFF0] focus:outline-none focus:ring-1 focus:ring-[#00AFF0]"
          />
        </div>

        {/* Amount */}
        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Amount (USDC)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
            <input
              type="number"
              min="1"
              max={available / 100}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-7 pr-4 text-sm text-gray-900 focus:border-[#00AFF0] focus:outline-none focus:ring-1 focus:ring-[#00AFF0]"
            />
          </div>
          <button
            onClick={() => setAmount((available / 100).toFixed(2))}
            className="mt-1 text-xs font-medium text-[#00AFF0] hover:underline"
          >
            Withdraw max ({formatUsdc(available)})
          </button>
        </div>

        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs text-amber-700">
            Withdrawals are processed within 24 hours. A small network fee applies.
          </p>
        </div>

        <button
          onClick={handleWithdraw}
          disabled={submitting || !walletAddress || !amount || parseFloat(amount) <= 0}
          className="w-full rounded-lg bg-[#00AFF0] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#009ad6] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Processing..." : "Request Withdrawal"}
        </button>
      </div>
    </div>
  );
}
