"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users,
  DollarSign,
  TrendingUp,
  FileText,
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  BadgeCheck,
  UserPlus,
  Activity,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AnalyticsData {
  overview: {
    total_users: number;
    total_creators: number;
    total_subscribers: number;
    users_this_month: number;
    users_last_month: number;
    users_last_7d: number;
    active_subscriptions: number;
    total_posts: number;
    posts_this_month: number;
  };
  revenue: {
    all_time_usdc: number;
    this_month_usdc: number;
    last_month_usdc: number;
    subscription_revenue_usdc: number;
    tip_revenue_usdc: number;
    ppv_revenue_usdc: number;
    platform_fee_all_time_usdc: number;
    platform_fee_this_month_usdc: number;
    total_payouts_usdc: number;
    pending_payouts_usdc: number;
    platform_wallet_balance_usdc: number;
    daily_platform_fees_usdc: number;
    daily_creator_earnings_usdc: number;
    hot_wallet_balance_usdc: number;
    hot_wallet_configured: boolean;
  };
  charts: {
    user_growth: Array<{ date: string; count: number }>;
    revenue_by_day: Array<{ date: string; revenue: number }>;
  };
  top_creators: Array<{
    user_id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    is_verified: boolean;
    total_subscribers: number;
    total_earnings_usdc: number;
    categories: string[];
  }>;
  category_breakdown: Array<{ category: string; count: number }>;
  subscription_status: Array<{ status: string; count: number }>;
  engagement: {
    events_today: number;
    events_this_week: number;
    events_by_type: Array<{ event_type: string; count: number }>;
  };
  recent_transactions: Array<{
    id: number;
    type: string;
    amount_usdc: number;
    description: string | null;
    status: string;
    created_at: string;
    username: string;
  }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function usdcToDisplay(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function pctChange(current: number, previous: number): { value: string; positive: boolean } {
  if (previous === 0) return { value: current > 0 ? "+100%" : "0%", positive: current > 0 };
  const pct = ((current - previous) / previous) * 100;
  return { value: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`, positive: pct >= 0 };
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

const TX_LABELS: Record<string, string> = {
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  subscription_charge: "Sub Charge",
  subscription_received: "Sub Received",
  tip_sent: "Tip Sent",
  tip_received: "Tip Received",
  refund: "Refund",
  platform_fee: "Platform Fee",
  ppv_charge: "PPV Charge",
  ppv_received: "PPV Received",
};

// ---------------------------------------------------------------------------
// Mini bar chart (pure CSS — no chart library)
// ---------------------------------------------------------------------------

function MiniBarChart({
  data,
  label,
  valueKey,
  color = "#00AFF0",
}: {
  data: Array<Record<string, unknown>>;
  label: string;
  valueKey: string;
  color?: string;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-400">
        No data yet
      </div>
    );
  }
  const values = data.map((d) => Number(d[valueKey]) || 0);
  const max = Math.max(...values, 1);
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-gray-500">{label}</p>
      <div className="flex h-28 items-end gap-[2px] sm:gap-1">
        {values.map((v, i) => (
          <div
            key={i}
            className="flex-1 rounded-t transition-all hover:opacity-80"
            style={{
              height: `${Math.max((v / max) * 100, 4)}%`,
              backgroundColor: color,
              minWidth: 2,
            }}
            title={`${data[i]?.date ?? i}: ${v}`}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  change,
  icon: Icon,
  accent = false,
  valueClassName,
}: {
  label: string;
  value: string;
  change?: { value: string; positive: boolean } | null;
  icon: typeof Users;
  accent?: boolean;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
            accent ? "bg-[#00AFF0]/10 text-[#00AFF0]" : "bg-gray-100 text-gray-500"
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
        {change && (
          <span
            className={`flex items-center gap-0.5 text-xs font-medium ${
              change.positive ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {change.positive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {change.value}
          </span>
        )}
      </div>
      <p className={`mt-3 text-xl font-bold sm:text-2xl ${valueClassName ?? "text-gray-900"}`}>{value}</p>
      <p className="mt-0.5 text-xs text-gray-500">{label}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function AdminDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/analytics");
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.debug ?? json.error ?? `Error ${res.status}`);
        return;
      }
      const json = await res.json();
      setData(json.data);

      // Fetch wallet balance separately (slower RPC call)
      fetch("/api/admin/wallet-balance")
        .then((r) => r.json())
        .then((wj) => {
          if (wj.data) {
            setData((prev) =>
              prev
                ? {
                    ...prev,
                    revenue: {
                      ...prev.revenue,
                      hot_wallet_balance_usdc: wj.data.balance_usdc,
                      hot_wallet_configured: wj.data.configured,
                    },
                  }
                : prev,
            );
          }
        })
        .catch(() => {});

      // Fetch chart data separately (heavier queries)
      fetch("/api/admin/charts")
        .then((r) => r.json())
        .then((cj) => {
          if (cj.data) {
            setData((prev) =>
              prev
                ? {
                    ...prev,
                    charts:
                      cj.data.user_growth && cj.data.revenue_by_day
                        ? {
                            user_growth: cj.data.user_growth,
                            revenue_by_day: cj.data.revenue_by_day,
                          }
                        : prev.charts,
                    category_breakdown:
                      cj.data.category_breakdown || prev.category_breakdown,
                    subscription_status:
                      cj.data.subscription_status || prev.subscription_status,
                  }
                : prev,
            );
          }
        })
        .catch(() => {});
    } catch {
      setError("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Analytics</h1>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-gray-200 bg-gray-50" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
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

  const userGrowthChange = pctChange(data.overview.users_this_month, data.overview.users_last_month);
  const revenueChange = pctChange(data.revenue.this_month_usdc, data.revenue.last_month_usdc);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Platform Analytics</h1>
          <p className="text-xs text-gray-500">Real-time overview of OpenFans</p>
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* ===================== KPI CARDS ===================== */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Users"
          value={formatNum(data.overview.total_users)}
          change={userGrowthChange}
          icon={Users}
          accent
        />
        <StatCard
          label="Creators"
          value={formatNum(data.overview.total_creators)}
          icon={UserPlus}
        />
        <StatCard
          label="Active Subscriptions"
          value={formatNum(data.overview.active_subscriptions)}
          icon={Activity}
          accent
        />
        <StatCard
          label="New Users (7d)"
          value={formatNum(data.overview.users_last_7d)}
          icon={TrendingUp}
        />
        <StatCard
          label="Total Revenue"
          value={usdcToDisplay(data.revenue.all_time_usdc)}
          icon={DollarSign}
          accent
        />
        <StatCard
          label="This Month"
          value={usdcToDisplay(data.revenue.this_month_usdc)}
          change={revenueChange}
          icon={CreditCard}
        />
        <StatCard
          label="Platform Fees (All Time)"
          value={usdcToDisplay(data.revenue.platform_fee_all_time_usdc)}
          icon={Wallet}
          accent
        />
        <StatCard
          label="Total Posts"
          value={formatNum(data.overview.total_posts)}
          icon={FileText}
        />
        <StatCard
          label="Today's Platform Revenue"
          value={usdcToDisplay(data.revenue.daily_platform_fees_usdc)}
          icon={DollarSign}
          accent
        />
        <StatCard
          label="Today's Creator Earnings"
          value={usdcToDisplay(data.revenue.daily_creator_earnings_usdc)}
          icon={TrendingUp}
        />
        <StatCard
          label="Hot Wallet (On-Chain)"
          value={
            data.revenue.hot_wallet_configured
              ? usdcToDisplay(data.revenue.hot_wallet_balance_usdc)
              : "Not Configured"
          }
          icon={Wallet}
          accent={data.revenue.hot_wallet_configured}
          valueClassName={data.revenue.hot_wallet_configured ? "text-gray-900" : "text-red-500"}
        />
      </div>

      {/* ===================== CHARTS ===================== */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
          <MiniBarChart
            data={data.charts.user_growth as Array<Record<string, unknown>>}
            label="User Growth (30d)"
            valueKey="count"
            color="#00AFF0"
          />
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
          <MiniBarChart
            data={data.charts.revenue_by_day as Array<Record<string, unknown>>}
            label="Revenue (30d)"
            valueKey="revenue"
            color="#10b981"
          />
        </div>
      </div>

      {/* ===================== REVENUE BREAKDOWN ===================== */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
          <p className="text-xs font-medium text-gray-500">Subscriptions</p>
          <p className="mt-1 text-lg font-bold text-gray-900">
            {usdcToDisplay(data.revenue.subscription_revenue_usdc)}
          </p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-[#00AFF0]"
              style={{
                width: `${data.revenue.all_time_usdc > 0
                  ? (data.revenue.subscription_revenue_usdc / data.revenue.all_time_usdc) * 100
                  : 0}%`,
              }}
            />
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
          <p className="text-xs font-medium text-gray-500">Tips</p>
          <p className="mt-1 text-lg font-bold text-gray-900">
            {usdcToDisplay(data.revenue.tip_revenue_usdc)}
          </p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-amber-400"
              style={{
                width: `${data.revenue.all_time_usdc > 0
                  ? (data.revenue.tip_revenue_usdc / data.revenue.all_time_usdc) * 100
                  : 0}%`,
              }}
            />
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
          <p className="text-xs font-medium text-gray-500">PPV Purchases</p>
          <p className="mt-1 text-lg font-bold text-gray-900">
            {usdcToDisplay(data.revenue.ppv_revenue_usdc)}
          </p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-violet-500"
              style={{
                width: `${data.revenue.all_time_usdc > 0
                  ? (data.revenue.ppv_revenue_usdc / data.revenue.all_time_usdc) * 100
                  : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* ===================== PAYOUTS ===================== */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
          <p className="text-xs font-medium text-gray-500">Total Payouts</p>
          <p className="mt-1 text-lg font-bold text-gray-900">
            {usdcToDisplay(data.revenue.total_payouts_usdc)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
          <p className="text-xs font-medium text-gray-500">Pending Payouts</p>
          <p className="mt-1 text-lg font-bold text-amber-600">
            {usdcToDisplay(data.revenue.pending_payouts_usdc)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
          <p className="text-xs font-medium text-gray-500">Platform Wallet Balance</p>
          <p className="mt-1 text-lg font-bold text-gray-900">
            {usdcToDisplay(data.revenue.platform_wallet_balance_usdc)}
          </p>
        </div>
      </div>

      {/* ===================== BOTTOM PANELS ===================== */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Creators */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
          <h2 className="mb-3 text-sm font-bold text-gray-900">Top Creators</h2>
          {data.top_creators.length === 0 ? (
            <p className="py-6 text-center text-xs text-gray-400">No creators yet</p>
          ) : (
            <div className="space-y-2.5">
              {data.top_creators.map((c, i) => (
                <div key={c.user_id} className="flex items-center gap-3">
                  <span className="w-5 text-center text-xs font-medium text-gray-400">
                    {i + 1}
                  </span>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-xs font-bold text-gray-900">
                    {c.avatar_url ? (
                      <img
                        src={c.avatar_url}
                        alt={c.display_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      c.display_name.charAt(0)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="truncate text-sm font-medium text-gray-900">
                        {c.display_name}
                      </span>
                      {c.is_verified && (
                        <BadgeCheck className="h-3.5 w-3.5 shrink-0 fill-[#00AFF0] text-white" />
                      )}
                    </div>
                    <span className="text-[11px] text-gray-400">
                      @{c.username} · {formatNum(c.total_subscribers)} subs
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {usdcToDisplay(c.total_earnings_usdc)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
          <h2 className="mb-3 text-sm font-bold text-gray-900">Recent Transactions</h2>
          {data.recent_transactions.length === 0 ? (
            <p className="py-6 text-center text-xs text-gray-400">No transactions yet</p>
          ) : (
            <div className="space-y-2">
              {data.recent_transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs hover:bg-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-gray-700">
                      {TX_LABELS[tx.type] ?? tx.type}
                    </span>
                    <span className="ml-1.5 text-gray-400">@{tx.username}</span>
                    {tx.description && (
                      <p className="mt-0.5 truncate text-[11px] text-gray-400">
                        {tx.description}
                      </p>
                    )}
                  </div>
                  <div className="ml-3 text-right">
                    <span
                      className={`font-semibold ${
                        tx.amount_usdc >= 0 ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {tx.amount_usdc >= 0 ? "+" : ""}
                      {usdcToDisplay(Math.abs(tx.amount_usdc))}
                    </span>
                    <p className="text-[10px] text-gray-400">{timeAgo(tx.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===================== ENGAGEMENT ===================== */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Events Today"
          value={formatNum(data.engagement.events_today)}
          icon={Activity}
          accent
        />
        <StatCard
          label="Events This Week"
          value={formatNum(data.engagement.events_this_week)}
          icon={TrendingUp}
        />
      </div>

      {/* Event Type Breakdown */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
        <h2 className="mb-3 text-sm font-bold text-gray-900">Event Types (Today)</h2>
        {data.engagement.events_by_type.length === 0 ? (
          <p className="py-6 text-center text-xs text-gray-400">No events today</p>
        ) : (
          <div className="space-y-2">
            {data.engagement.events_by_type.map((evt) => {
              const total = data.engagement.events_by_type.reduce((s, e) => s + e.count, 0);
              const pct = total > 0 ? (evt.count / total) * 100 : 0;
              return (
                <div key={evt.event_type} className="flex items-center gap-3">
                  <span className="w-36 truncate text-xs text-gray-600">
                    {evt.event_type.replace(/_/g, " ")}
                  </span>
                  <div className="flex-1">
                    <div className="h-2 w-full rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-[#00AFF0]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-8 text-right text-xs font-medium text-gray-500">
                    {evt.count}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===================== CATEGORIES & SUBSCRIPTION STATUS ===================== */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Category Breakdown */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
          <h2 className="mb-3 text-sm font-bold text-gray-900">Creator Categories</h2>
          {data.category_breakdown.length === 0 ? (
            <p className="py-6 text-center text-xs text-gray-400">No data</p>
          ) : (
            <div className="space-y-2">
              {data.category_breakdown.map((cat) => {
                const total = data.category_breakdown.reduce((s, c) => s + Number(c.count), 0);
                const pct = total > 0 ? (Number(cat.count) / total) * 100 : 0;
                return (
                  <div key={cat.category} className="flex items-center gap-3">
                    <span className="w-24 truncate text-xs text-gray-600">{cat.category}</span>
                    <div className="flex-1">
                      <div className="h-2 w-full rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-[#00AFF0]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-8 text-right text-xs font-medium text-gray-500">
                      {Number(cat.count)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Subscription Status */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
          <h2 className="mb-3 text-sm font-bold text-gray-900">Subscription Status</h2>
          {data.subscription_status.length === 0 ? (
            <p className="py-6 text-center text-xs text-gray-400">No data</p>
          ) : (
            <div className="space-y-3">
              {data.subscription_status.map((s) => {
                const colorMap: Record<string, string> = {
                  active: "bg-emerald-500",
                  expired: "bg-gray-400",
                  cancelled: "bg-red-400",
                };
                return (
                  <div key={s.status} className="flex items-center gap-3">
                    <div className={`h-2.5 w-2.5 rounded-full ${colorMap[s.status] ?? "bg-gray-300"}`} />
                    <span className="w-20 text-xs font-medium capitalize text-gray-700">{s.status}</span>
                    <span className="text-sm font-bold text-gray-900">{formatNum(Number(s.count))}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
