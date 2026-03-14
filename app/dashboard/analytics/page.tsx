"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DollarSign,
  TrendingUp,
  Users,
  FileText,
  Wallet,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Clock,
  Share2,
  Check,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EarningsData {
  total_earnings_usdc: number;
  this_month_earnings_usdc: number;
  pending_payout_usdc: number;
  total_paid_out_usdc: number;
}

interface WalletData {
  balance_usdc: number;
  minimum_balance_usdc: number;
  available_for_withdrawal: number;
}

interface Transaction {
  id: string;
  type: "subscription" | "tip" | "payout";
  from_user_id: string | null;
  from_username: string | null;
  amount_usdc: number;
  tier: string | null;
  payment_tx: string | null;
  created_at: string;
}

interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  role: string;
}

interface CreatorStats {
  total_subscribers: number;
  total_posts: number;
}

interface AnalyticsState {
  earnings: EarningsData | null;
  wallet: WalletData | null;
  transactions: Transaction[];
  profile: UserProfile | null;
  creatorStats: CreatorStats | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function usdcToDisplay(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function timeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const mins = Math.floor((now - then) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const TX_TYPE_LABELS: Record<string, string> = {
  subscription: "Subscription",
  tip: "Tip Received",
  payout: "Payout",
};

const TX_TYPE_COLORS: Record<string, string> = {
  subscription: "bg-[#00AFF0]/10 text-[#00AFF0]",
  tip: "bg-amber-50 text-amber-600",
  payout: "bg-violet-50 text-violet-600",
};

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  icon: Icon,
  accent = false,
  valueClassName,
}: {
  label: string;
  value: string;
  icon: typeof Users;
  accent?: boolean;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
            accent
              ? "bg-[#00AFF0]/10 text-[#00AFF0]"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p
        className={`mt-3 text-xl font-bold sm:text-2xl ${valueClassName ?? "text-gray-900"}`}
      >
        {value}
      </p>
      <p className="mt-0.5 text-xs text-gray-500">{label}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Revenue Breakdown Card
// ---------------------------------------------------------------------------

function RevenueBreakdownCard({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-gray-900">
        {usdcToDisplay(value)}
      </p>
      <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.max(pct, pct > 0 ? 2 : 0)}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <p className="mt-1 text-[11px] text-gray-400">
        {pct.toFixed(1)}% of total
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />
          <div className="mt-1 h-4 w-56 animate-pulse rounded bg-gray-100" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-xl border border-gray-200 bg-gray-50"
          />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border border-gray-200 bg-gray-50"
          />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-xl border border-gray-200 bg-gray-50"
          />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl border border-gray-200 bg-gray-50" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function CreatorAnalyticsPage() {
  const [state, setState] = useState<AnalyticsState>({
    earnings: null,
    wallet: null,
    transactions: [],
    profile: null,
    creatorStats: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleCopyProfileLink = async () => {
    const username = state.profile?.username;
    if (!username) return;
    const profileUrl = `${window.location.origin}/${username}`;
    try {
      await navigator.clipboard.writeText(profileUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = profileUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [earningsRes, walletRes, profileRes] = await Promise.all([
        fetch("/api/earnings"),
        fetch("/api/wallet"),
        fetch("/api/me"),
      ]);

      if (!earningsRes.ok) {
        const errJson = await earningsRes.json().catch(() => ({}));
        setError(errJson.error ?? `Failed to load earnings (${earningsRes.status})`);
        return;
      }

      if (!walletRes.ok) {
        const errJson = await walletRes.json().catch(() => ({}));
        setError(errJson.error ?? `Failed to load wallet (${walletRes.status})`);
        return;
      }

      if (!profileRes.ok) {
        const errJson = await profileRes.json().catch(() => ({}));
        setError(errJson.error ?? `Failed to load profile (${profileRes.status})`);
        return;
      }

      const [earningsJson, walletJson, profileJson] = await Promise.all([
        earningsRes.json(),
        walletRes.json(),
        profileRes.json(),
      ]);

      // Fetch creator stats (subscriber count, post count) separately
      // These come from a different endpoint pattern
      let creatorStats: CreatorStats = { total_subscribers: 0, total_posts: 0 };
      try {
        const username = profileJson.data?.username;
        if (username) {
          const creatorRes = await fetch(`/api/creators/${username}`);
          if (creatorRes.ok) {
            const creatorJson = await creatorRes.json();
            creatorStats = {
              total_subscribers: creatorJson.data?.total_subscribers ?? 0,
              total_posts: creatorJson.data?.total_posts ?? creatorJson.data?.posts?.length ?? 0,
            };
          }
        }
      } catch {
        // Non-critical — default to 0
      }

      setState({
        earnings: earningsJson.data,
        wallet: walletJson.data?.wallet ?? null,
        transactions: (earningsJson.transactions ?? []) as Transaction[],
        profile: profileJson.data,
        creatorStats,
      });
    } catch {
      setError("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Loading state
  if (loading) {
    return <LoadingSkeleton />;
  }

  // Error state
  if (error || !state.earnings) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-red-400">{error ?? "Something went wrong"}</p>
        <button
          onClick={fetchData}
          className="mt-3 text-sm font-medium text-[#00AFF0] hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  const { earnings, wallet, transactions, creatorStats } = state;

  // Calculate revenue breakdown from transactions
  const subscriptionRevenue = transactions
    .filter((tx) => tx.type === "subscription")
    .reduce((sum, tx) => sum + tx.amount_usdc, 0);

  const tipRevenue = transactions
    .filter((tx) => tx.type === "tip")
    .reduce((sum, tx) => sum + tx.amount_usdc, 0);

  // PPV is not in current transaction types but we can derive it
  const ppvRevenue = Math.max(
    0,
    earnings.total_earnings_usdc - subscriptionRevenue - tipRevenue,
  );

  const totalRevenueForBreakdown =
    subscriptionRevenue + tipRevenue + ppvRevenue || 1;

  const availableBalance = wallet?.available_for_withdrawal ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 sm:text-xl">
            Your Analytics
          </h1>
          <p className="text-xs text-gray-500">
            Track your earnings, subscribers, and content performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          {state.profile?.username && (
            <button
              onClick={handleCopyProfileLink}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              {linkCopied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5" />
                  Copy Profile Link
                </>
              )}
            </button>
          )}
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* ===================== SUMMARY CARDS ===================== */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Earnings"
          value={usdcToDisplay(earnings.total_earnings_usdc)}
          icon={DollarSign}
          accent
        />
        <StatCard
          label="This Month"
          value={usdcToDisplay(earnings.this_month_earnings_usdc)}
          icon={TrendingUp}
        />
        <StatCard
          label="Total Subscribers"
          value={formatNum(creatorStats?.total_subscribers ?? 0)}
          icon={Users}
          accent
        />
        <StatCard
          label="Total Posts"
          value={formatNum(creatorStats?.total_posts ?? 0)}
          icon={FileText}
        />
      </div>

      {/* ===================== EARNINGS BREAKDOWN ===================== */}
      <div>
        <h2 className="mb-3 text-sm font-bold text-gray-900">
          Earnings Breakdown
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <RevenueBreakdownCard
            label="Subscriptions"
            value={subscriptionRevenue}
            total={totalRevenueForBreakdown}
            color="#00AFF0"
          />
          <RevenueBreakdownCard
            label="Tips"
            value={tipRevenue}
            total={totalRevenueForBreakdown}
            color="#f59e0b"
          />
          <RevenueBreakdownCard
            label="PPV Purchases"
            value={ppvRevenue}
            total={totalRevenueForBreakdown}
            color="#8b5cf6"
          />
        </div>
      </div>

      {/* ===================== PAYOUT SUMMARY ===================== */}
      <div>
        <h2 className="mb-3 text-sm font-bold text-gray-900">
          Payout Summary
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <CreditCard className="h-4 w-4" />
              </div>
              <p className="text-xs font-medium text-gray-500">
                Total Paid Out
              </p>
            </div>
            <p className="mt-2 text-lg font-bold text-gray-900">
              {usdcToDisplay(earnings.total_paid_out_usdc)}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Clock className="h-4 w-4" />
              </div>
              <p className="text-xs font-medium text-gray-500">
                Pending Payout
              </p>
            </div>
            <p className="mt-2 text-lg font-bold text-amber-600">
              {usdcToDisplay(earnings.pending_payout_usdc)}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00AFF0]/10 text-[#00AFF0]">
                <Wallet className="h-4 w-4" />
              </div>
              <p className="text-xs font-medium text-gray-500">
                Available Balance
              </p>
            </div>
            <p className="mt-2 text-lg font-bold text-gray-900">
              {usdcToDisplay(availableBalance)}
            </p>
          </div>
        </div>
      </div>

      {/* ===================== RECENT TRANSACTIONS ===================== */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
        <h2 className="mb-3 text-sm font-bold text-gray-900">
          Recent Transactions
        </h2>
        {transactions.length === 0 ? (
          <p className="py-10 text-center text-xs text-gray-400">
            No transactions yet. Your earnings will appear here.
          </p>
        ) : (
          <div className="space-y-1.5">
            {transactions.map((tx) => (
              <div
                key={`${tx.type}-${tx.id}`}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${
                      TX_TYPE_COLORS[tx.type] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {TX_TYPE_LABELS[tx.type] ?? tx.type}
                  </span>
                  <div className="min-w-0 flex-1">
                    {tx.from_username ? (
                      <span className="text-sm text-gray-700">
                        @{tx.from_username}
                        {tx.tier && (
                          <span className="ml-1.5 text-gray-400">
                            ({tx.tier})
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">
                        {tx.type === "payout"
                          ? "Withdrawal to wallet"
                          : "System"}
                      </span>
                    )}
                  </div>
                </div>
                <div className="ml-3 text-right shrink-0">
                  <span
                    className={`text-sm font-semibold ${
                      tx.amount_usdc >= 0 ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {tx.amount_usdc >= 0 ? "+" : ""}
                    {usdcToDisplay(Math.abs(tx.amount_usdc))}
                  </span>
                  <p className="text-[10px] text-gray-400">
                    {formatDate(tx.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
