"use client";

import { useEffect, useState, useCallback } from "react";
import {
  RefreshCw,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Wallet,
  AlertTriangle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Payout {
  id: number;
  creator_id: string;
  amount_usdc: number;
  wallet_address: string;
  payment_tx: string | null;
  status: "pending" | "processing" | "completed" | "failed";
  created_at: string;
  creator_username: string | null;
  creator_display_name: string | null;
}

type StatusFilter = "all" | "pending" | "processing" | "completed" | "failed";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function usdcToDisplay(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
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

function truncateWallet(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

// ---------------------------------------------------------------------------
// Stat Card (matching analytics page pattern)
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  subValue,
  icon: Icon,
  accentColor,
}: {
  label: string;
  value: string;
  subValue?: string;
  icon: typeof Wallet;
  accentColor: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-xl font-bold text-gray-900 sm:text-2xl">{value}</p>
      <p className="mt-0.5 text-xs text-gray-500">{label}</p>
      {subValue && (
        <p className="mt-1 text-xs font-medium" style={{ color: accentColor }}>
          {subValue}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status Badge
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  Payout["status"],
  { label: string; bgClass: string; textClass: string }
> = {
  pending: { label: "Pending", bgClass: "bg-amber-100", textClass: "text-amber-700" },
  processing: { label: "Processing", bgClass: "bg-blue-100", textClass: "text-blue-700" },
  completed: { label: "Completed", bgClass: "bg-emerald-100", textClass: "text-emerald-700" },
  failed: { label: "Failed", bgClass: "bg-red-100", textClass: "text-red-700" },
};

function StatusBadge({ status }: { status: Payout["status"] }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${config.bgClass} ${config.textClass}`}
    >
      {config.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Confirmation Modal
// ---------------------------------------------------------------------------

function ConfirmModal({
  payout,
  onConfirm,
  onCancel,
  processing,
}: {
  payout: Payout;
  onConfirm: () => void;
  onCancel: () => void;
  processing: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <h3 className="text-sm font-bold text-gray-900">Confirm Payout</h3>
        </div>

        <p className="mt-4 text-sm text-gray-600">
          Send{" "}
          <span className="font-semibold text-gray-900">
            {usdcToDisplay(payout.amount_usdc)}
          </span>{" "}
          USDC to{" "}
          <span className="font-semibold text-gray-900">
            @{payout.creator_username ?? "unknown"}
          </span>
          &apos;s wallet?
        </p>
        <p className="mt-1 text-xs text-gray-400 font-mono">
          {payout.wallet_address}
        </p>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            disabled={processing}
            className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={processing}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#00AFF0] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#009AD6] disabled:opacity-50"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send USDC"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [confirmPayout, setConfirmPayout] = useState<Payout | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/payouts?limit=200");
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? `Error ${res.status}`);
        return;
      }
      const json = await res.json();
      setPayouts(json.data.payouts);
    } catch {
      setError("Failed to load payouts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  // Auto-dismiss toast messages
  useEffect(() => {
    if (successMessage) {
      const t = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(t);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const t = setTimeout(() => setErrorMessage(null), 6000);
      return () => clearTimeout(t);
    }
  }, [errorMessage]);

  // ---- Process payout handler ----
  const handleProcessPayout = async (payout: Payout) => {
    setConfirmPayout(null);
    setProcessingId(payout.id);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/admin/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payout_id: payout.id }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMessage(json.error ?? "Failed to process payout");
        return;
      }
      setSuccessMessage(
        `Successfully sent ${usdcToDisplay(payout.amount_usdc)} to @${payout.creator_username ?? "unknown"}`
      );
      await fetchPayouts();
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  // ---- Computed summary stats ----
  const summary = payouts.reduce(
    (acc, p) => {
      acc[p.status].count += 1;
      acc[p.status].total += p.amount_usdc;
      return acc;
    },
    {
      pending: { count: 0, total: 0 },
      processing: { count: 0, total: 0 },
      completed: { count: 0, total: 0 },
      failed: { count: 0, total: 0 },
    } as Record<Payout["status"], { count: number; total: number }>
  );

  // ---- Filtered payouts ----
  const filteredPayouts =
    filter === "all" ? payouts : payouts.filter((p) => p.status === filter);

  // ---- Filter tab config ----
  const FILTER_TABS: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "processing", label: "Processing" },
    { key: "completed", label: "Completed" },
    { key: "failed", label: "Failed" },
  ];

  // ---- Loading state ----
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900 sm:text-xl">
            Payout Management
          </h1>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl border border-gray-200 bg-gray-50"
            />
          ))}
        </div>
        <div className="h-10 w-80 animate-pulse rounded-lg bg-gray-50" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-lg border border-gray-200 bg-gray-50"
            />
          ))}
        </div>
      </div>
    );
  }

  // ---- Error state ----
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-red-400">{error}</p>
        <button
          onClick={fetchPayouts}
          className="mt-3 text-sm font-medium text-[#00AFF0] hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Confirmation modal */}
      {confirmPayout && (
        <ConfirmModal
          payout={confirmPayout}
          onConfirm={() => handleProcessPayout(confirmPayout)}
          onCancel={() => setConfirmPayout(null)}
          processing={false}
        />
      )}

      {/* Toast messages */}
      {successMessage && (
        <div className="fixed right-4 top-20 z-50 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-lg">
          <CheckCircle2 className="h-4 w-4" />
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="fixed right-4 top-20 z-50 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-lg">
          <XCircle className="h-4 w-4" />
          {errorMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 sm:text-xl">
            Payout Management
          </h1>
          <p className="text-xs text-gray-500">
            Review and process creator withdrawal requests
          </p>
        </div>
        <button
          onClick={fetchPayouts}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Pending Payouts"
          value={String(summary.pending.count)}
          subValue={usdcToDisplay(summary.pending.total)}
          icon={Clock}
          accentColor="#d97706"
        />
        <StatCard
          label="Processing"
          value={String(summary.processing.count)}
          icon={Loader2}
          accentColor="#2563eb"
        />
        <StatCard
          label="Completed"
          value={String(summary.completed.count)}
          subValue={usdcToDisplay(summary.completed.total)}
          icon={CheckCircle2}
          accentColor="#059669"
        />
        <StatCard
          label="Failed"
          value={String(summary.failed.count)}
          icon={XCircle}
          accentColor="#dc2626"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              filter === tab.key
                ? "bg-[#00AFF0] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Payouts Table */}
      {filteredPayouts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16">
          <Wallet className="h-8 w-8 text-gray-300" />
          <p className="mt-3 text-sm text-gray-400">
            No {filter === "all" ? "" : filter} payouts found
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-gray-400">
                  Creator
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-gray-400">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-gray-400">
                  Wallet
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-gray-400">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-gray-400">
                  Date
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-gray-400">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredPayouts.map((payout) => (
                <tr
                  key={payout.id}
                  className="transition-colors hover:bg-gray-50/50"
                >
                  {/* Creator */}
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {payout.creator_display_name ?? "Unknown"}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        @{payout.creator_username ?? "unknown"}
                      </p>
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold text-gray-900">
                      {usdcToDisplay(payout.amount_usdc)}
                    </span>
                  </td>

                  {/* Wallet */}
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-gray-500">
                      {truncateWallet(payout.wallet_address)}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <StatusBadge status={payout.status} />
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-500">
                      {timeAgo(payout.created_at)}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3 text-right">
                    {payout.status === "pending" && (
                      <button
                        onClick={() => setConfirmPayout(payout)}
                        disabled={processingId === payout.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#00AFF0] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#009AD6] disabled:opacity-50"
                      >
                        {processingId === payout.id ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          "Process Payout"
                        )}
                      </button>
                    )}
                    {payout.status === "processing" && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-blue-600">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Processing
                      </span>
                    )}
                    {payout.status === "completed" && payout.payment_tx && (
                      <a
                        href={`https://solscan.io/tx/${payout.payment_tx}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#00AFF0] transition-colors hover:underline"
                      >
                        View TX
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {payout.status === "failed" && (
                      <button
                        onClick={() => setConfirmPayout(payout)}
                        disabled={processingId === payout.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                      >
                        {processingId === payout.id ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Retrying...
                          </>
                        ) : (
                          "Retry"
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
