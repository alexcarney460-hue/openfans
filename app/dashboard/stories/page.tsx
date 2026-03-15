"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Camera,
  Clock,
  Eye,
  Trash2,
  Loader2,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { CreateStoryModal } from "@/components/CreateStoryModal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StoryItem {
  readonly id: string;
  readonly media_url: string;
  readonly media_type: "image" | "video";
  readonly caption: string | null;
  readonly created_at: string;
  readonly expires_at: string;
  readonly views_count: number;
  readonly thumbnail_url?: string | null;
}

interface StoryViewer {
  readonly user_id: string;
  readonly username: string;
  readonly display_name: string;
  readonly avatar_url: string | null;
  readonly viewed_at: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeRemaining(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}

function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() <= Date.now();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-6 w-36 animate-pulse rounded bg-gray-200" />
          <div className="mt-1 h-4 w-52 animate-pulse rounded bg-gray-100" />
        </div>
        <div className="h-10 w-32 animate-pulse rounded-lg bg-gray-200" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border border-gray-200 bg-gray-50"
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Story card component
// ---------------------------------------------------------------------------

function StoryCard({
  story,
  onDelete,
  onToggleViewers,
  showViewers,
  viewers,
  viewersLoading,
}: {
  story: StoryItem;
  onDelete: (id: string) => void;
  onToggleViewers: (id: string) => void;
  showViewers: boolean;
  viewers: StoryViewer[];
  viewersLoading: boolean;
}) {
  const [deleting, setDeleting] = useState(false);
  const expired = isExpired(story.expires_at);

  const handleDelete = useCallback(async () => {
    if (!confirm("Delete this story? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/stories/${story.id}`, { method: "DELETE" });
      if (res.ok) {
        onDelete(story.id);
      }
    } catch {
      // Silently fail
    } finally {
      setDeleting(false);
    }
  }, [story.id, onDelete]);

  return (
    <div
      className={`rounded-xl border bg-white transition-colors ${
        expired ? "border-gray-200 opacity-70" : "border-gray-200"
      }`}
    >
      <div className="flex items-center gap-4 p-4">
        {/* Thumbnail */}
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
          {story.media_type === "video" ? (
            <video
              src={story.media_url}
              className="h-full w-full object-cover"
              muted
              preload="metadata"
            />
          ) : (
            <img
              src={story.thumbnail_url ?? story.media_url}
              alt={story.caption ?? "Story"}
              className="h-full w-full object-cover"
            />
          )}
          {story.media_type === "video" && (
            <div className="absolute bottom-1 right-1 rounded bg-black/60 px-1 py-0.5 text-[9px] font-medium text-white">
              VIDEO
            </div>
          )}
        </div>

        {/* Details */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900">
            {story.caption || "No caption"}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {expired ? (
                <span className="text-gray-400">
                  Expired {formatDate(story.expires_at)}
                </span>
              ) : (
                <span className="text-[#00AFF0]">
                  {timeRemaining(story.expires_at)}
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={() => onToggleViewers(story.id)}
              className="flex items-center gap-1 transition-colors hover:text-[#00AFF0]"
            >
              <Eye className="h-3 w-3" />
              {story.views_count} {story.views_count === 1 ? "view" : "views"}
              {showViewers ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
            <span className="text-gray-400">
              Posted {formatDate(story.created_at)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
          aria-label="Delete story"
        >
          {deleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Viewers panel */}
      {showViewers && (
        <div className="border-t border-gray-100 px-4 py-3">
          {viewersLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          ) : viewers.length === 0 ? (
            <p className="py-2 text-center text-xs text-gray-400">
              No viewers yet
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500">
                Viewed by ({viewers.length})
              </p>
              <div className="max-h-40 space-y-1.5 overflow-y-auto">
                {viewers.map((viewer) => (
                  <div
                    key={viewer.user_id}
                    className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-50"
                  >
                    <div className="h-7 w-7 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
                      {viewer.avatar_url ? (
                        <img
                          src={viewer.avatar_url}
                          alt={viewer.display_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-gray-500">
                          {viewer.display_name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-gray-700">
                        {viewer.display_name}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        @{viewer.username}
                      </p>
                    </div>
                    <span className="text-[10px] text-gray-400">
                      {timeAgo(viewer.viewed_at)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function StoriesManagementPage() {
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [expandedViewers, setExpandedViewers] = useState<Set<string>>(new Set());
  const [viewersByStory, setViewersByStory] = useState<Record<string, StoryViewer[]>>({});
  const [viewersLoading, setViewersLoading] = useState<Set<string>>(new Set());

  const fetchStories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stories/my");
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "Failed to load stories.");
        return;
      }
      const json = await res.json();
      setStories(json.data ?? []);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const handleDelete = useCallback((id: string) => {
    setStories((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const handleToggleViewers = useCallback(
    async (storyId: string) => {
      const newExpanded = new Set(expandedViewers);
      if (newExpanded.has(storyId)) {
        newExpanded.delete(storyId);
        setExpandedViewers(newExpanded);
        return;
      }

      newExpanded.add(storyId);
      setExpandedViewers(newExpanded);

      // Fetch viewers if not already cached
      if (!viewersByStory[storyId]) {
        setViewersLoading((prev) => new Set(prev).add(storyId));
        try {
          const res = await fetch(`/api/stories/${storyId}/viewers`);
          if (res.ok) {
            const json = await res.json();
            setViewersByStory((prev) => ({
              ...prev,
              [storyId]: json.data ?? [],
            }));
          }
        } catch {
          // Silently fail
        } finally {
          setViewersLoading((prev) => {
            const next = new Set(prev);
            next.delete(storyId);
            return next;
          });
        }
      }
    },
    [expandedViewers, viewersByStory],
  );

  const handleStoryCreated = useCallback(() => {
    setCreateOpen(false);
    fetchStories();
  }, [fetchStories]);

  if (loading) return <LoadingSkeleton />;

  // Separate active and expired stories
  const activeStories = stories.filter((s) => !isExpired(s.expires_at));
  const expiredStories = stories.filter((s) => isExpired(s.expires_at));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 sm:text-xl">
            My Stories
          </h1>
          <p className="text-xs text-gray-500">
            Manage your stories, view analytics, and track engagement
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#00AFF0] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#009dd8]"
        >
          <Camera className="h-4 w-4" />
          Create Story
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
          <p className="flex-1 text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={fetchStories}
            className="text-sm font-medium text-red-600 hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!error && stories.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <Camera className="h-8 w-8 text-gray-300" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-gray-900">
            No stories yet
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Share moments with your subscribers through stories
          </p>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#00AFF0] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#009dd8]"
          >
            <Camera className="h-4 w-4" />
            Create Your First Story
          </button>
        </div>
      )}

      {/* Active stories */}
      {activeStories.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-bold text-gray-900">
            Active Stories ({activeStories.length})
          </h2>
          <div className="space-y-3">
            {activeStories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                onDelete={handleDelete}
                onToggleViewers={handleToggleViewers}
                showViewers={expandedViewers.has(story.id)}
                viewers={viewersByStory[story.id] ?? []}
                viewersLoading={viewersLoading.has(story.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Expired stories */}
      {expiredStories.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-bold text-gray-500">
            Recently Expired ({expiredStories.length})
          </h2>
          <div className="space-y-3">
            {expiredStories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                onDelete={handleDelete}
                onToggleViewers={handleToggleViewers}
                showViewers={expandedViewers.has(story.id)}
                viewers={viewersByStory[story.id] ?? []}
                viewersLoading={viewersLoading.has(story.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Create story modal */}
      {createOpen && (
        <CreateStoryModal
          onClose={() => setCreateOpen(false)}
          onCreated={handleStoryCreated}
        />
      )}
    </div>
  );
}
