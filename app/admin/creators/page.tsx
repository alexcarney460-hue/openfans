"use client";

import { useEffect, useState, useCallback } from "react";
import {
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Users,
  DollarSign,
  BadgeCheck,
  AlertTriangle,
  Search,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Creator {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  is_verified: boolean;
  created_at: string;
  total_subscribers: number;
  total_earnings_usdc: number;
  categories: string[];
  subscription_price_usdc: number;
  is_featured: boolean;
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

// ---------------------------------------------------------------------------
// Stat Card (matches payouts page pattern)
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
  icon: typeof Users;
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
// Confirmation Modal
// ---------------------------------------------------------------------------

function ConfirmModal({
  creator,
  targetVerified,
  onConfirm,
  onCancel,
  processing,
}: {
  creator: Creator;
  targetVerified: boolean;
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
          <h3 className="text-sm font-bold text-gray-900">
            {targetVerified ? "Verify Creator" : "Remove Verification"}
          </h3>
        </div>

        <p className="mt-4 text-sm text-gray-600">
          {targetVerified ? (
            <>
              Grant the verified badge to{" "}
              <span className="font-semibold text-gray-900">
                @{creator.username}
              </span>
              ? This will display a blue checkmark on their profile.
            </>
          ) : (
            <>
              Remove the verified badge from{" "}
              <span className="font-semibold text-gray-900">
                @{creator.username}
              </span>
              ? Their profile will no longer show the verification checkmark.
            </>
          )}
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
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50 ${
              targetVerified
                ? "bg-[#00AFF0] hover:bg-[#009AD6]"
                : "bg-red-500 hover:bg-red-600"
            }`}
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : targetVerified ? (
              "Verify"
            ) : (
              "Remove Verification"
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

export default function AdminCreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmAction, setConfirmAction] = useState<{
    creator: Creator;
    targetVerified: boolean;
  } | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchCreators = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/creators");
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? `Error ${res.status}`);
        return;
      }
      const json = await res.json();
      setCreators(json.data.creators);
    } catch {
      setError("Failed to load creators");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCreators();
  }, [fetchCreators]);

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

  // ---- Toggle verification handler ----
  const handleToggleVerify = async (creator: Creator, verified: boolean) => {
    setConfirmAction(null);
    setProcessingId(creator.id);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/admin/creators/${creator.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMessage(json.error ?? "Failed to update verification");
        return;
      }
      setSuccessMessage(
        verified
          ? `@${creator.username} has been verified`
          : `Verification removed from @${creator.username}`,
      );
      // Update local state immutably
      setCreators((prev) =>
        prev.map((c) => (c.id === creator.id ? { ...c, is_verified: verified } : c)),
      );
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  // ---- Computed summary stats ----
  const totalCreators = creators.length;
  const verifiedCount = creators.filter((c) => c.is_verified).length;
  const totalEarnings = creators.reduce((sum, c) => sum + c.total_earnings_usdc, 0);
  const totalSubscribers = creators.reduce((sum, c) => sum + c.total_subscribers, 0);

  // ---- Filtered creators ----
  const filteredCreators = searchQuery
    ? creators.filter(
        (c) =>
          c.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.display_name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : creators;

  // ---- Loading state ----
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900 sm:text-xl">
            Creator Management
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
          onClick={fetchCreators}
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
      {confirmAction && (
        <ConfirmModal
          creator={confirmAction.creator}
          targetVerified={confirmAction.targetVerified}
          onConfirm={() =>
            handleToggleVerify(confirmAction.creator, confirmAction.targetVerified)
          }
          onCancel={() => setConfirmAction(null)}
          processing={processingId === confirmAction.creator.id}
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
            Creator Management
          </h1>
          <p className="text-xs text-gray-500">
            View all creators and manage verification badges
          </p>
        </div>
        <button
          onClick={fetchCreators}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Creators"
          value={String(totalCreators)}
          icon={Users}
          accentColor="#2563eb"
        />
        <StatCard
          label="Verified Creators"
          value={String(verifiedCount)}
          subValue={
            totalCreators > 0
              ? `${Math.round((verifiedCount / totalCreators) * 100)}% of creators`
              : undefined
          }
          icon={BadgeCheck}
          accentColor="#059669"
        />
        <StatCard
          label="Total Subscribers"
          value={totalSubscribers.toLocaleString()}
          icon={Users}
          accentColor="#7c3aed"
        />
        <StatCard
          label="Total Creator Earnings"
          value={usdcToDisplay(totalEarnings)}
          icon={DollarSign}
          accentColor="#d97706"
        />
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by username or display name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#00AFF0] focus:outline-none focus:ring-1 focus:ring-[#00AFF0]"
        />
      </div>

      {/* Creators Table */}
      {filteredCreators.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16">
          <Users className="h-8 w-8 text-gray-300" />
          <p className="mt-3 text-sm text-gray-400">
            {searchQuery ? "No creators match your search" : "No creators found"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-gray-400">
                  Creator
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-gray-400">
                  Categories
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-gray-400">
                  Subscribers
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-gray-400">
                  Earnings
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-gray-400">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-gray-400">
                  Joined
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-gray-400">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredCreators.map((creator) => (
                <tr
                  key={creator.id}
                  className="transition-colors hover:bg-gray-50/50"
                >
                  {/* Creator */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {creator.avatar_url ? (
                        <img
                          src={creator.avatar_url}
                          alt={creator.display_name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-500">
                          {creator.display_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-gray-900">
                            {creator.display_name}
                          </p>
                          {creator.is_verified && (
                            <BadgeCheck className="h-3.5 w-3.5 text-[#00AFF0]" />
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400">
                          @{creator.username}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Categories */}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {creator.categories.length > 0 ? (
                        creator.categories.slice(0, 3).map((cat) => (
                          <span
                            key={cat}
                            className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600"
                          >
                            {cat}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-gray-300">--</span>
                      )}
                      {creator.categories.length > 3 && (
                        <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-400">
                          +{creator.categories.length - 3}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Subscribers */}
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-gray-900">
                      {creator.total_subscribers.toLocaleString()}
                    </span>
                  </td>

                  {/* Earnings */}
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold text-gray-900">
                      {usdcToDisplay(creator.total_earnings_usdc)}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    {creator.is_verified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                        <BadgeCheck className="h-3 w-3" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-500">
                        Unverified
                      </span>
                    )}
                  </td>

                  {/* Joined */}
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-500">
                      {timeAgo(creator.created_at)}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3 text-right">
                    {creator.is_verified ? (
                      <button
                        onClick={() =>
                          setConfirmAction({
                            creator,
                            targetVerified: false,
                          })
                        }
                        disabled={processingId === creator.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                      >
                        {processingId === creator.id ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          "Unverify"
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          setConfirmAction({
                            creator,
                            targetVerified: true,
                          })
                        }
                        disabled={processingId === creator.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#00AFF0] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#009AD6] disabled:opacity-50"
                      >
                        {processingId === creator.id ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          "Verify"
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
