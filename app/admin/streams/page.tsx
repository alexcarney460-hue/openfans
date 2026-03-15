"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Radio,
  Calendar,
  Activity,
  Eye,
  RefreshCw,
  StopCircle,
  Users,
  Clock,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StreamCreator {
  username: string;
  display_name: string;
  avatar_url: string | null;
}

interface StreamRecord {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  status: "live" | "scheduled" | "ended" | "cancelled";
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  viewer_count: number;
  peak_viewers: number;
  is_subscriber_only: boolean;
  chat_enabled: boolean;
  created_at: string;
  updated_at: string;
  creator: StreamCreator;
}

interface StreamSummary {
  currently_live: number;
  scheduled: number;
  total_today: number;
  peak_concurrent_viewers: number;
}

interface StreamsResponse {
  data: StreamRecord[];
  summary: StreamSummary;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
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

function timeAgo(dateString: string | null): string {
  if (!dateString) return "-";
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

function formatDuration(startedAt: string | null, endedAt: string | null): string {
  if (!startedAt) return "-";
  const start = new Date(startedAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  const totalMins = Math.floor((end - start) / 60_000);
  if (totalMins < 1) return "<1m";
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hrs === 0) return `${mins}m`;
  return `${hrs}h ${mins}m`;
}

function formatScheduledDate(dateString: string | null): string {
  if (!dateString) return "-";
  const d = new Date(dateString);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Status Badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: StreamRecord["status"] }) {
  const styles: Record<string, string> = {
    live: "bg-red-100 text-red-700",
    scheduled: "bg-blue-100 text-blue-700",
    ended: "bg-gray-100 text-gray-600",
    cancelled: "bg-amber-100 text-amber-700",
  };

  const labels: Record<string, string> = {
    live: "Live",
    scheduled: "Scheduled",
    ended: "Ended",
    cancelled: "Cancelled",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        styles[status] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {status === "live" && (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
      )}
      {labels[status] ?? status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string;
  icon: typeof Radio;
  accent?: boolean;
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
      <p className="mt-3 text-xl font-bold text-gray-900 sm:text-2xl">{value}</p>
      <p className="mt-0.5 text-xs text-gray-500">{label}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter Tabs
// ---------------------------------------------------------------------------

type FilterTab = "all" | "live" | "scheduled" | "ended";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "live", label: "Live" },
  { key: "scheduled", label: "Scheduled" },
  { key: "ended", label: "Ended" },
];

// ---------------------------------------------------------------------------
// End Stream Modal
// ---------------------------------------------------------------------------

function EndStreamModal({
  stream,
  onClose,
  onConfirm,
  loading,
}: {
  stream: StreamRecord;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
        <h3 className="text-base font-bold text-gray-900">
          {stream.status === "live" ? "End Stream" : "Delete Stream"}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {stream.status === "live"
            ? `Force-end "${stream.title}" by @${stream.creator.username}?`
            : `Delete scheduled stream "${stream.title}" by @${stream.creator.username}?`}
        </p>

        <div className="mt-4">
          <label className="block text-xs font-medium text-gray-700">
            Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Provide a reason for this action..."
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#00AFF0] focus:outline-none focus:ring-1 focus:ring-[#00AFF0]"
            rows={3}
            maxLength={500}
          />
          <p className="mt-1 text-right text-[11px] text-gray-400">
            {reason.length}/500
          </p>
        </div>

        <div className="mt-4 flex gap-2 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading || reason.trim().length === 0}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Processing..." : stream.status === "live" ? "End Stream" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function AdminStreamsPage() {
  const [data, setData] = useState<StreamsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [page, setPage] = useState(1);

  // End stream modal state
  const [endingStream, setEndingStream] = useState<StreamRecord | null>(null);
  const [endingLoading, setEndingLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (activeTab !== "all") {
        params.set("status", activeTab);
      }
      params.set("page", String(page));
      params.set("limit", "20");

      const res = await fetch(`/api/admin/streams?${params.toString()}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? `Error ${res.status}`);
        return;
      }

      const json: StreamsResponse = await res.json();
      setData(json);
    } catch {
      setError("Failed to load streams");
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleEndStream = async (reason: string) => {
    if (!endingStream) return;

    setEndingLoading(true);
    try {
      const res = await fetch("/api/admin/streams", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stream_id: endingStream.id,
          reason,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        alert(json.error ?? "Failed to end stream");
        return;
      }

      setEndingStream(null);
      fetchData();
    } catch {
      alert("Failed to end stream");
    } finally {
      setEndingLoading(false);
    }
  };

  // Loading skeleton
  if (loading && !data) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Streams</h1>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl border border-gray-200 bg-gray-50"
            />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl border border-gray-200 bg-gray-50" />
      </div>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-red-400">{error}</p>
        <button
          onClick={fetchData}
          className="mt-3 text-sm font-medium text-[#00AFF0] hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  const summary = data?.summary ?? {
    currently_live: 0,
    scheduled: 0,
    total_today: 0,
    peak_concurrent_viewers: 0,
  };

  const streams = data?.data ?? [];
  const pagination = data?.pagination ?? { page: 1, limit: 20, total: 0, total_pages: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Streams</h1>
          <p className="text-xs text-gray-500">Manage live streams across the platform</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Currently Live"
          value={formatNum(summary.currently_live)}
          icon={Radio}
          accent
        />
        <StatCard
          label="Scheduled"
          value={formatNum(summary.scheduled)}
          icon={Calendar}
        />
        <StatCard
          label="Total Streams Today"
          value={formatNum(summary.total_today)}
          icon={Activity}
          accent
        />
        <StatCard
          label="Peak Concurrent Viewers"
          value={formatNum(summary.peak_concurrent_viewers)}
          icon={Eye}
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Streams Table */}
      <div className="rounded-xl border border-gray-200 bg-white">
        {streams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Radio className="h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm text-gray-400">No streams found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-3 text-xs font-medium text-gray-500">Creator</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500">Title</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Viewers
                    </div>
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Duration
                    </div>
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500">Started</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {streams.map((stream) => (
                  <tr
                    key={stream.id}
                    className="border-b border-gray-50 transition-colors hover:bg-gray-50/50"
                  >
                    {/* Creator */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-xs font-bold text-gray-900">
                          {stream.creator.avatar_url ? (
                            <img
                              src={stream.creator.avatar_url}
                              alt={stream.creator.display_name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            stream.creator.display_name.charAt(0)
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {stream.creator.display_name}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            @{stream.creator.username}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Title */}
                    <td className="max-w-[200px] px-4 py-3">
                      <p className="truncate text-sm text-gray-900">{stream.title}</p>
                      {stream.is_subscriber_only && (
                        <span className="text-[10px] text-amber-600">Subscribers only</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={stream.status} />
                    </td>

                    {/* Viewers */}
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-900">
                        {stream.status === "live"
                          ? formatNum(stream.viewer_count)
                          : formatNum(stream.peak_viewers)}
                      </span>
                      {stream.status === "live" && stream.peak_viewers > 0 && (
                        <p className="text-[10px] text-gray-400">
                          peak: {formatNum(stream.peak_viewers)}
                        </p>
                      )}
                    </td>

                    {/* Duration */}
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {stream.status === "scheduled"
                        ? formatScheduledDate(stream.scheduled_at)
                        : formatDuration(stream.started_at, stream.ended_at)}
                    </td>

                    {/* Started At */}
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {stream.started_at
                        ? timeAgo(stream.started_at)
                        : stream.scheduled_at
                          ? `In ${timeAgo(stream.scheduled_at)}`
                          : "-"}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      {(stream.status === "live" || stream.status === "scheduled") && (
                        <button
                          onClick={() => setEndingStream(stream)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                        >
                          <StopCircle className="h-3 w-3" />
                          {stream.status === "live" ? "End" : "Delete"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <p className="text-xs text-gray-500">
              Page {pagination.page} of {pagination.total_pages} ({pagination.total} streams)
            </p>
            <div className="flex gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-md border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
                disabled={page >= pagination.total_pages}
                className="rounded-md border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* End Stream Modal */}
      {endingStream && (
        <EndStreamModal
          stream={endingStream}
          onClose={() => setEndingStream(null)}
          onConfirm={handleEndStream}
          loading={endingLoading}
        />
      )}
    </div>
  );
}
