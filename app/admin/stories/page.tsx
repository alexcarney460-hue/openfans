"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Film,
  Eye,
  Flag,
  RefreshCw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  X,
  Clock,
  Search,
  Image as ImageIcon,
  Video,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Story {
  readonly id: string;
  readonly creator_id: string;
  readonly media_url: string;
  readonly media_type: "image" | "video";
  readonly caption: string | null;
  readonly expires_at: string;
  readonly views_count: number;
  readonly created_at: string;
  readonly creator_username: string | null;
  readonly creator_display_name: string | null;
  readonly creator_avatar_url: string | null;
  readonly report_count: number;
}

interface Pagination {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly total_pages: number;
}

interface Summary {
  readonly active_stories: number;
  readonly views_today: number;
  readonly reported_stories: number;
}

type StatusFilter = "active" | "expired" | "all";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function timeRemaining(expiresAt: string): string {
  const now = Date.now();
  const expires = new Date(expiresAt).getTime();
  const diffMs = expires - now;

  if (diffMs <= 0) return "Expired";

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${mins}m left`;
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
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
  icon: typeof Film;
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
// Remove Story Modal
// ---------------------------------------------------------------------------

function RemoveModal({
  story,
  onClose,
  onConfirm,
  isRemoving,
}: {
  story: Story;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isRemoving: boolean;
}) {
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <h3 className="text-base font-bold text-gray-900">Remove Story</h3>
        </div>
        <p className="mb-1 text-sm text-gray-600">
          Remove this story by @{story.creator_username ?? "unknown"}?
        </p>
        <p className="mb-4 text-xs text-gray-400">
          {story.caption
            ? `"${story.caption.slice(0, 80)}${story.caption.length > 80 ? "..." : ""}"`
            : "No caption"}
          {" -- "}This action cannot be undone.
        </p>

        <label className="mb-1 block text-xs font-medium text-gray-600">
          Reason for removal *
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Enter the reason for removing this story..."
          className="mb-4 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#00AFF0] focus:outline-none focus:ring-1 focus:ring-[#00AFF0]"
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isRemoving}
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={isRemoving || reason.trim().length === 0}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {isRemoving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Removing...
              </>
            ) : (
              "Remove"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Story Preview Modal
// ---------------------------------------------------------------------------

function StoryPreviewModal({
  story,
  onClose,
}: {
  story: Story;
  onClose: () => void;
}) {
  const isExpired = new Date(story.expires_at) <= new Date();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h3 className="text-sm font-bold text-gray-900">Story Preview</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          {/* Media preview */}
          <div className="mb-4 overflow-hidden rounded-lg bg-gray-100">
            {story.media_type === "video" ? (
              <video
                src={story.media_url}
                className="aspect-[9/16] max-h-80 w-full object-contain bg-black"
                controls
                muted
              />
            ) : (
              <img
                src={story.media_url}
                alt="Story content"
                className="aspect-[9/16] max-h-80 w-full object-contain"
              />
            )}
          </div>

          {/* Details */}
          <div className="space-y-3">
            <DetailRow label="ID" value={story.id.slice(0, 8) + "..."} />
            <DetailRow
              label="Creator"
              value={
                story.creator_username
                  ? `@${story.creator_username}`
                  : story.creator_id
              }
            />
            <DetailRow label="Caption" value={story.caption ?? "None"} />
            <DetailRow label="Media Type">
              <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-900">
                {story.media_type === "video" ? (
                  <Video className="h-3.5 w-3.5" />
                ) : (
                  <ImageIcon className="h-3.5 w-3.5" />
                )}
                {story.media_type}
              </span>
            </DetailRow>
            <DetailRow label="Views" value={formatNum(story.views_count)} />
            <DetailRow label="Reports" value={String(story.report_count)} />
            <DetailRow label="Status">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                  isExpired
                    ? "bg-gray-100 text-gray-600"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isExpired ? "bg-gray-400" : "bg-emerald-500"
                  }`}
                />
                {isExpired ? "Expired" : "Active"}
              </span>
            </DetailRow>
            <DetailRow label="Time Remaining" value={timeRemaining(story.expires_at)} />
            <DetailRow label="Created" value={timeAgo(story.created_at)} />
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
        <span className="max-w-[60%] truncate text-sm font-medium text-gray-900">
          {value}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function AdminStoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 25,
    total: 0,
    total_pages: 0,
  });
  const [summary, setSummary] = useState<Summary>({
    active_stories: 0,
    views_today: 0,
    reported_stories: 0,
  });
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [creatorSearch, setCreatorSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [removeTarget, setRemoveTarget] = useState<Story | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [previewTarget, setPreviewTarget] = useState<Story | null>(null);

  // -------------------------------------------------------------------------
  // Fetch stories
  // -------------------------------------------------------------------------

  const fetchStories = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: "25",
          status: statusFilter,
        });

        if (creatorSearch.trim()) {
          params.set("creator", creatorSearch.trim());
        }

        const res = await fetch(`/api/admin/stories?${params}`);
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          setError(json.error ?? `Error ${res.status}`);
          return;
        }

        const json = await res.json();
        setStories(json.data ?? []);
        setPagination(
          json.pagination ?? { page: 1, limit: 25, total: 0, total_pages: 0 },
        );
        if (json.summary) {
          setSummary(json.summary);
        }
      } catch {
        setError("Failed to load stories");
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, creatorSearch],
  );

  useEffect(() => {
    fetchStories(1);
  }, [fetchStories]);

  // -------------------------------------------------------------------------
  // Remove story
  // -------------------------------------------------------------------------

  const handleRemove = useCallback(
    async (reason: string) => {
      if (!removeTarget) return;
      setIsRemoving(true);

      try {
        const res = await fetch("/api/admin/stories", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            story_id: removeTarget.id,
            reason,
          }),
        });

        if (res.ok) {
          setRemoveTarget(null);
          await fetchStories(pagination.page);
        } else {
          const json = await res.json().catch(() => ({}));
          setError(json.error ?? "Failed to remove story");
        }
      } catch {
        setError("Failed to remove story");
      } finally {
        setIsRemoving(false);
      }
    },
    [removeTarget, fetchStories, pagination.page],
  );

  // -------------------------------------------------------------------------
  // Filter tabs
  // -------------------------------------------------------------------------

  const FILTER_TABS: { key: StatusFilter; label: string }[] = [
    { key: "active", label: "Active" },
    { key: "expired", label: "Expired" },
    { key: "all", label: "All" },
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
            Story Management
          </h1>
          <p className="text-xs text-gray-500">
            Monitor and manage creator stories across the platform
          </p>
        </div>
        <button
          onClick={() => fetchStories(pagination.page)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <StatCard
          label="Active Stories"
          value={formatNum(summary.active_stories)}
          icon={Film}
          accent
        />
        <StatCard
          label="Total Views Today"
          value={formatNum(summary.views_today)}
          icon={Eye}
        />
        <StatCard
          label="Reported Stories"
          value={formatNum(summary.reported_stories)}
          icon={Flag}
          accent={summary.reported_stories > 0}
        />
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

      {/* Creator search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={creatorSearch}
          onChange={(e) => setCreatorSearch(e.target.value)}
          placeholder="Filter by creator username..."
          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#00AFF0] focus:outline-none focus:ring-1 focus:ring-[#00AFF0]"
        />
      </div>

      {/* Error state */}
      {error && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchStories(1);
            }}
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
              className="h-20 animate-pulse rounded-xl border border-gray-200 bg-gray-50"
            />
          ))}
        </div>
      )}

      {/* Stories Grid */}
      {!loading && !error && (
        <>
          {stories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Film className="mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">
                No stories found
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {statusFilter !== "all"
                  ? `No ${statusFilter} stories`
                  : "Stories will appear here when creators post them"}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              {/* Table Header */}
              <div className="hidden border-b border-gray-200 bg-gray-50 px-4 py-3 sm:grid sm:grid-cols-12 sm:gap-4">
                <span className="col-span-1 text-xs font-medium text-gray-500">
                  Media
                </span>
                <span className="col-span-2 text-xs font-medium text-gray-500">
                  Creator
                </span>
                <span className="col-span-3 text-xs font-medium text-gray-500">
                  Caption
                </span>
                <span className="col-span-1 text-xs font-medium text-gray-500">
                  Views
                </span>
                <span className="col-span-1 text-xs font-medium text-gray-500">
                  Reports
                </span>
                <span className="col-span-2 text-xs font-medium text-gray-500">
                  Time
                </span>
                <span className="col-span-2 text-xs font-medium text-gray-500">
                  Actions
                </span>
              </div>

              {/* Table Rows */}
              {stories.map((story) => {
                const isExpired = new Date(story.expires_at) <= new Date();

                return (
                  <div
                    key={story.id}
                    className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 transition-colors last:border-b-0 hover:bg-gray-50 sm:grid sm:grid-cols-12 sm:items-center sm:gap-4"
                  >
                    {/* Thumbnail */}
                    <div className="col-span-1">
                      <button
                        onClick={() => setPreviewTarget(story)}
                        className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 transition-opacity hover:opacity-80"
                      >
                        {story.media_type === "video" ? (
                          <div className="flex h-full w-full items-center justify-center bg-gray-900/10">
                            <Video className="h-5 w-5 text-gray-500" />
                          </div>
                        ) : (
                          <img
                            src={story.media_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        )}
                      </button>
                    </div>

                    {/* Creator */}
                    <div className="col-span-2 flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-xs font-bold text-gray-900">
                        {story.creator_avatar_url ? (
                          <img
                            src={story.creator_avatar_url}
                            alt={story.creator_display_name ?? ""}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          (story.creator_display_name ?? "?").charAt(0)
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {story.creator_display_name ?? "Unknown"}
                        </p>
                        <p className="truncate text-[11px] text-gray-400">
                          @{story.creator_username ?? "unknown"}
                        </p>
                      </div>
                    </div>

                    {/* Caption */}
                    <div className="col-span-3">
                      <p className="truncate text-sm text-gray-600">
                        {story.caption || "No caption"}
                      </p>
                    </div>

                    {/* Views */}
                    <div className="col-span-1 flex items-center gap-1 text-sm text-gray-600">
                      <Eye className="h-3.5 w-3.5 text-gray-400" />
                      {formatNum(story.views_count)}
                    </div>

                    {/* Reports */}
                    <div className="col-span-1">
                      {story.report_count > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                          <Flag className="h-3 w-3" />
                          {story.report_count}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">0</span>
                      )}
                    </div>

                    {/* Time remaining */}
                    <div className="col-span-2">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium ${
                          isExpired ? "text-gray-400" : "text-emerald-600"
                        }`}
                      >
                        <Clock className="h-3 w-3" />
                        {timeRemaining(story.expires_at)}
                      </span>
                      <p className="mt-0.5 text-[10px] text-gray-400">
                        {timeAgo(story.created_at)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex items-center gap-2">
                      <button
                        onClick={() => setPreviewTarget(story)}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
                      >
                        <Eye className="h-3 w-3" />
                        Preview
                      </button>
                      <button
                        onClick={() => setRemoveTarget(story)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
                      >
                        <Trash2 className="h-3 w-3" />
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
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
                  onClick={() => fetchStories(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </button>
                <button
                  onClick={() => fetchStories(pagination.page + 1)}
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

      {/* Remove Story Modal */}
      {removeTarget && (
        <RemoveModal
          story={removeTarget}
          onClose={() => setRemoveTarget(null)}
          onConfirm={handleRemove}
          isRemoving={isRemoving}
        />
      )}

      {/* Story Preview Modal */}
      {previewTarget && (
        <StoryPreviewModal
          story={previewTarget}
          onClose={() => setPreviewTarget(null)}
        />
      )}
    </div>
  );
}
