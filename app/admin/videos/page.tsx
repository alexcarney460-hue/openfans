"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Video,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Play,
  Loader2,
  HardDrive,
  Film,
  AlertTriangle,
  X,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VideoAsset {
  readonly id: number;
  readonly creator_id: string;
  readonly creator_username: string | null;
  readonly status: "uploaded" | "processing" | "ready" | "failed";
  readonly original_filename: string | null;
  readonly file_size_bytes: number | null;
  readonly mime_type: string | null;
  readonly duration_seconds: number | null;
  readonly width: number | null;
  readonly height: number | null;
  readonly thumbnail_url: string | null;
  readonly created_at: string;
  readonly updated_at: string | null;
}

interface Pagination {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly total_pages: number;
}

type StatusFilter = "all" | "uploaded" | "processing" | "ready" | "failed";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
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
  if (days < 30) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Status Badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: VideoAsset["status"] }) {
  const config = {
    uploaded: {
      label: "Uploaded",
      bg: "bg-blue-50",
      text: "text-blue-700",
      dot: "bg-blue-500",
    },
    processing: {
      label: "Processing",
      bg: "bg-amber-50",
      text: "text-amber-700",
      dot: "bg-amber-500",
    },
    ready: {
      label: "Ready",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
    },
    failed: {
      label: "Failed",
      bg: "bg-red-50",
      text: "text-red-700",
      dot: "bg-red-500",
    },
  }[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.bg} ${config.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
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
  value: string | number;
  icon: typeof Video;
  accent?: boolean;
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
      <p className="mt-3 text-xl font-bold text-gray-900 sm:text-2xl">
        {value}
      </p>
      <p className="mt-0.5 text-xs text-gray-500">{label}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delete Confirmation Modal
// ---------------------------------------------------------------------------

function DeleteModal({
  video,
  onClose,
  onConfirm,
  isDeleting,
}: {
  video: VideoAsset;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <h3 className="text-base font-bold text-gray-900">Delete Video</h3>
        </div>
        <p className="mb-1 text-sm text-gray-600">
          Are you sure you want to delete this video?
        </p>
        <p className="mb-6 text-xs text-gray-400">
          {video.original_filename ?? `Video #${video.id}`} &mdash; This action
          cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Video Detail Modal
// ---------------------------------------------------------------------------

function VideoDetailModal({
  video,
  onClose,
}: {
  video: VideoAsset;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h3 className="text-sm font-bold text-gray-900">Video Details</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          {/* Thumbnail */}
          {video.thumbnail_url ? (
            <div className="mb-4 overflow-hidden rounded-lg bg-gray-100">
              <img
                src={video.thumbnail_url}
                alt="Video thumbnail"
                className="aspect-video w-full object-cover"
              />
            </div>
          ) : (
            <div className="mb-4 flex aspect-video items-center justify-center rounded-lg bg-gray-100">
              <Film className="h-10 w-10 text-gray-300" />
            </div>
          )}

          {/* Details grid */}
          <div className="space-y-3">
            <DetailRow label="ID" value={`#${video.id}`} />
            <DetailRow
              label="Filename"
              value={video.original_filename ?? "Unknown"}
            />
            <DetailRow label="Status">
              <StatusBadge status={video.status} />
            </DetailRow>
            <DetailRow
              label="Creator"
              value={
                video.creator_username
                  ? `@${video.creator_username}`
                  : video.creator_id
              }
            />
            <DetailRow
              label="File Size"
              value={
                video.file_size_bytes != null
                  ? formatBytes(video.file_size_bytes)
                  : "Unknown"
              }
            />
            <DetailRow
              label="Duration"
              value={
                video.duration_seconds != null
                  ? formatDuration(video.duration_seconds)
                  : "Unknown"
              }
            />
            <DetailRow
              label="Resolution"
              value={
                video.width != null && video.height != null
                  ? `${video.width}x${video.height}`
                  : "Unknown"
              }
            />
            <DetailRow
              label="MIME Type"
              value={video.mime_type ?? "Unknown"}
            />
            <DetailRow label="Uploaded" value={timeAgo(video.created_at)} />
            {video.updated_at && (
              <DetailRow
                label="Last Updated"
                value={timeAgo(video.updated_at)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      {children ?? (
        <span className="text-sm font-medium text-gray-900">{value}</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<VideoAsset[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 25,
    total: 0,
    total_pages: 0,
  });
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [deleteTarget, setDeleteTarget] = useState<VideoAsset | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [detailTarget, setDetailTarget] = useState<VideoAsset | null>(null);

  // Retry loading state per video id
  const [retryingIds, setRetryingIds] = useState<ReadonlySet<number>>(
    new Set(),
  );

  // Summary stats (derived from a separate "all" fetch or from current data)
  const [summary, setSummary] = useState({
    total: 0,
    processing: 0,
    ready: 0,
    failed: 0,
  });

  // -------------------------------------------------------------------------
  // Fetch videos
  // -------------------------------------------------------------------------

  const fetchVideos = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ page: String(page), limit: "25" });
        if (statusFilter !== "all") {
          params.set("status", statusFilter);
        }

        const res = await fetch(`/api/admin/videos?${params}`);
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          setError(json.error ?? `Error ${res.status}`);
          return;
        }

        const json = await res.json();
        setVideos(json.data ?? []);
        setPagination(
          json.pagination ?? { page: 1, limit: 25, total: 0, total_pages: 0 },
        );
      } catch {
        setError("Failed to load videos");
      } finally {
        setLoading(false);
      }
    },
    [statusFilter],
  );

  // Fetch summary counts (always fetches all statuses)
  const fetchSummary = useCallback(async () => {
    try {
      const fetchCount = async (status?: string) => {
        const params = new URLSearchParams({ limit: "1", page: "1" });
        if (status) params.set("status", status);
        const res = await fetch(`/api/admin/videos?${params}`);
        if (!res.ok) return 0;
        const json = await res.json();
        return json.pagination?.total ?? 0;
      };

      const [total, processing, ready, failed] = await Promise.all([
        fetchCount(),
        fetchCount("processing"),
        fetchCount("ready"),
        fetchCount("failed"),
      ]);

      setSummary({ total, processing, ready, failed });
    } catch {
      // Silently fail — summary is non-critical
    }
  }, []);

  useEffect(() => {
    fetchVideos(1);
  }, [fetchVideos]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // -------------------------------------------------------------------------
  // Retry transcode
  // -------------------------------------------------------------------------

  const handleRetry = useCallback(
    async (video: VideoAsset) => {
      setRetryingIds((prev) => {
        const next = new Set(prev);
        next.add(video.id);
        return next;
      });

      try {
        const res = await fetch(`/api/admin/videos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "retry_transcode",
            video_id: video.id,
          }),
        });

        if (res.ok) {
          // Refresh the list
          await fetchVideos(pagination.page);
          await fetchSummary();
        }
      } catch {
        // Best effort
      } finally {
        setRetryingIds((prev) => {
          const next = new Set(prev);
          next.delete(video.id);
          return next;
        });
      }
    },
    [fetchVideos, fetchSummary, pagination.page],
  );

  // -------------------------------------------------------------------------
  // Delete video
  // -------------------------------------------------------------------------

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin/videos`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_id: deleteTarget.id }),
      });

      if (res.ok) {
        setDeleteTarget(null);
        await fetchVideos(pagination.page);
        await fetchSummary();
      }
    } catch {
      // Best effort
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, fetchVideos, fetchSummary, pagination.page]);

  // -------------------------------------------------------------------------
  // Filter tabs
  // -------------------------------------------------------------------------

  const FILTER_TABS: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "processing", label: "Processing" },
    { key: "ready", label: "Ready" },
    { key: "failed", label: "Failed" },
  ];

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 sm:text-xl">
            Video Management
          </h1>
          <p className="text-xs text-gray-500">
            Monitor and manage video assets across the platform
          </p>
        </div>
        <button
          onClick={() => {
            fetchVideos(pagination.page);
            fetchSummary();
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Videos"
          value={summary.total}
          icon={Video}
          accent
        />
        <StatCard
          label="Processing"
          value={summary.processing}
          icon={Clock}
        />
        <StatCard
          label="Ready"
          value={summary.ready}
          icon={CheckCircle2}
          accent
        />
        <StatCard label="Failed" value={summary.failed} icon={XCircle} />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
              statusFilter === tab.key
                ? "bg-[#00AFF0]/15 text-gray-900"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={() => fetchVideos(1)}
            className="mt-3 text-sm font-medium text-[#00AFF0] hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && !error && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl border border-gray-200 bg-gray-50"
            />
          ))}
        </div>
      )}

      {/* Video Table */}
      {!loading && !error && (
        <>
          {videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Film className="mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">
                No videos found
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {statusFilter !== "all"
                  ? `No videos with status "${statusFilter}"`
                  : "Videos will appear here when creators upload them"}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              {/* Table Header */}
              <div className="hidden border-b border-gray-200 bg-gray-50 px-4 py-3 sm:grid sm:grid-cols-12 sm:gap-4">
                <span className="col-span-1 text-xs font-medium text-gray-500">
                  #
                </span>
                <span className="col-span-3 text-xs font-medium text-gray-500">
                  Video
                </span>
                <span className="col-span-2 text-xs font-medium text-gray-500">
                  Creator
                </span>
                <span className="col-span-1 text-xs font-medium text-gray-500">
                  Status
                </span>
                <span className="col-span-1 text-xs font-medium text-gray-500">
                  Size
                </span>
                <span className="col-span-1 text-xs font-medium text-gray-500">
                  Duration
                </span>
                <span className="col-span-1 text-xs font-medium text-gray-500">
                  Uploaded
                </span>
                <span className="col-span-2 text-xs font-medium text-gray-500">
                  Actions
                </span>
              </div>

              {/* Table Rows */}
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 transition-colors last:border-b-0 hover:bg-gray-50 sm:grid sm:grid-cols-12 sm:items-center sm:gap-4"
                >
                  {/* ID */}
                  <div className="col-span-1 text-xs text-gray-400">
                    {video.id}
                  </div>

                  {/* Thumbnail + Filename */}
                  <div className="col-span-3 flex items-center gap-3">
                    <button
                      onClick={() => setDetailTarget(video)}
                      className="relative h-10 w-16 flex-shrink-0 overflow-hidden rounded-md bg-gray-100 transition-opacity hover:opacity-80"
                    >
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Film className="h-4 w-4 text-gray-300" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity hover:opacity-100">
                        <Play className="h-3 w-3 text-white" fill="white" />
                      </div>
                    </button>
                    <span
                      className="truncate text-sm font-medium text-gray-900 cursor-pointer hover:text-[#00AFF0]"
                      onClick={() => setDetailTarget(video)}
                      title={video.original_filename ?? undefined}
                    >
                      {video.original_filename ?? "Untitled"}
                    </span>
                  </div>

                  {/* Creator */}
                  <div className="col-span-2 text-sm text-gray-600">
                    {video.creator_username ? (
                      <span className="truncate">
                        @{video.creator_username}
                      </span>
                    ) : (
                      <span className="text-gray-400">Unknown</span>
                    )}
                  </div>

                  {/* Status */}
                  <div className="col-span-1">
                    <StatusBadge status={video.status} />
                  </div>

                  {/* File Size */}
                  <div className="col-span-1 flex items-center gap-1 text-xs text-gray-500">
                    <HardDrive className="h-3 w-3 sm:hidden" />
                    {video.file_size_bytes != null
                      ? formatBytes(video.file_size_bytes)
                      : "-"}
                  </div>

                  {/* Duration */}
                  <div className="col-span-1 text-xs text-gray-500">
                    {video.duration_seconds != null
                      ? formatDuration(video.duration_seconds)
                      : "-"}
                  </div>

                  {/* Upload date */}
                  <div className="col-span-1 text-xs text-gray-400">
                    {timeAgo(video.created_at)}
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center gap-2">
                    {video.status === "failed" && (
                      <button
                        onClick={() => handleRetry(video)}
                        disabled={retryingIds.has(video.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-50"
                      >
                        {retryingIds.has(video.id) ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                        Retry
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteTarget(video)}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Showing{" "}
                {(pagination.page - 1) * pagination.limit + 1}-
                {Math.min(
                  pagination.page * pagination.limit,
                  pagination.total,
                )}{" "}
                of {pagination.total}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => fetchVideos(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </button>
                <button
                  onClick={() => fetchVideos(pagination.page + 1)}
                  disabled={pagination.page >= pagination.total_pages}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <DeleteModal
          video={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          isDeleting={isDeleting}
        />
      )}

      {/* Video Detail Modal */}
      {detailTarget && (
        <VideoDetailModal
          video={detailTarget}
          onClose={() => setDetailTarget(null)}
        />
      )}
    </div>
  );
}
