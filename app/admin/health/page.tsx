"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Activity,
  Database,
  Globe,
  Users,
  UserPlus,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Wallet,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ServiceCheck {
  status: "healthy" | "degraded" | "down";
  latency_ms: number;
  error?: string;
}

interface HealthData {
  timestamp: string;
  services: {
    database: ServiceCheck;
    solana_rpc: ServiceCheck;
  };
  metrics: {
    pending_payouts: number;
    unverified_creators: number;
    recent_signups: number;
    total_users: number;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function statusColor(status: ServiceCheck["status"]): {
  bg: string;
  text: string;
  dot: string;
  border: string;
} {
  switch (status) {
    case "healthy":
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        dot: "bg-emerald-500",
        border: "border-emerald-200",
      };
    case "degraded":
      return {
        bg: "bg-amber-50",
        text: "text-amber-700",
        dot: "bg-amber-500",
        border: "border-amber-200",
      };
    case "down":
      return {
        bg: "bg-red-50",
        text: "text-red-700",
        dot: "bg-red-500",
        border: "border-red-200",
      };
  }
}

function StatusIcon({ status }: { status: ServiceCheck["status"] }) {
  switch (status) {
    case "healthy":
      return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    case "degraded":
      return <AlertCircle className="h-5 w-5 text-amber-500" />;
    case "down":
      return <XCircle className="h-5 w-5 text-red-500" />;
  }
}

// ---------------------------------------------------------------------------
// Service Status Card
// ---------------------------------------------------------------------------

function ServiceCard({
  name,
  icon: Icon,
  check,
}: {
  name: string;
  icon: typeof Database;
  check: ServiceCheck;
}) {
  const colors = statusColor(check.status);

  return (
    <div className={`rounded-xl border ${colors.border} ${colors.bg} p-4 sm:p-5`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/80">
            <Icon className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{name}</p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <div className={`h-2 w-2 rounded-full ${colors.dot} animate-pulse`} />
              <span className={`text-xs font-medium capitalize ${colors.text}`}>
                {check.status}
              </span>
            </div>
          </div>
        </div>
        <StatusIcon status={check.status} />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-gray-400" />
          <span className="text-xs text-gray-500">Response time</span>
        </div>
        <span className="text-sm font-semibold text-gray-900">{check.latency_ms}ms</span>
      </div>

      {check.error && (
        <div className="mt-2 rounded-lg bg-white/60 px-3 py-2">
          <p className="text-xs text-red-600">{check.error}</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Metric Card (matches existing StatCard style)
// ---------------------------------------------------------------------------

function MetricCard({
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
            accent ? "bg-[#00AFF0]/10 text-[#00AFF0]" : "bg-gray-100 text-gray-500"
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className={`mt-3 text-xl font-bold sm:text-2xl ${valueClassName ?? "text-gray-900"}`}>
        {value}
      </p>
      <p className="mt-0.5 text-xs text-gray-500">{label}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function AdminHealthPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(30);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/health");
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? `Error ${res.status}`);
        return;
      }
      const json = await res.json();
      setData(json.data);
      setLastRefreshed(new Date());
      setCountdown(30);
    } catch {
      setError("Failed to fetch health data");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and 30s auto-refresh
  useEffect(() => {
    fetchHealth();

    intervalRef.current = setInterval(() => {
      fetchHealth();
    }, 30_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchHealth]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 30 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Loading skeleton
  if (loading && !data) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Platform Health</h1>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl border border-gray-200 bg-gray-50" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-gray-200 bg-gray-50" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-red-400">{error}</p>
        <button
          onClick={fetchHealth}
          className="mt-3 text-sm font-medium text-[#00AFF0] hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const overallHealthy =
    data.services.database.status === "healthy" &&
    data.services.solana_rpc.status === "healthy";

  const overallDegraded =
    !overallHealthy &&
    data.services.database.status !== "down" &&
    data.services.solana_rpc.status !== "down";

  const overallStatus = overallHealthy
    ? "All Systems Operational"
    : overallDegraded
      ? "Some Services Degraded"
      : "System Issues Detected";

  const overallColors = overallHealthy
    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
    : overallDegraded
      ? "bg-amber-50 border-amber-200 text-amber-700"
      : "bg-red-50 border-red-200 text-red-700";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Platform Health</h1>
          <p className="text-xs text-gray-500">
            Service status and key metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-gray-400">
            Refreshing in {countdown}s
            {lastRefreshed && (
              <>
                {" "}
                &middot; Last:{" "}
                {lastRefreshed.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </>
            )}
          </span>
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Overall Status Banner */}
      <div className={`rounded-xl border px-4 py-3 ${overallColors}`}>
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          <span className="text-sm font-semibold">{overallStatus}</span>
        </div>
      </div>

      {/* Service Status Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <ServiceCard name="Database" icon={Database} check={data.services.database} />
        <ServiceCard name="Solana RPC" icon={Globe} check={data.services.solana_rpc} />
      </div>

      {/* Key Metrics */}
      <div>
        <h2 className="mb-3 text-sm font-bold text-gray-900">Key Metrics</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <MetricCard
            label="Pending Payouts"
            value={formatNum(data.metrics.pending_payouts)}
            icon={Wallet}
            accent
            valueClassName={
              data.metrics.pending_payouts > 0 ? "text-amber-600" : "text-gray-900"
            }
          />
          <MetricCard
            label="Unverified Creators"
            value={formatNum(data.metrics.unverified_creators)}
            icon={AlertCircle}
            valueClassName={
              data.metrics.unverified_creators > 0 ? "text-amber-600" : "text-gray-900"
            }
          />
          <MetricCard
            label="Signups (24h)"
            value={formatNum(data.metrics.recent_signups)}
            icon={UserPlus}
            accent
          />
          <MetricCard
            label="Total Users"
            value={formatNum(data.metrics.total_users)}
            icon={Users}
          />
        </div>
      </div>
    </div>
  );
}
