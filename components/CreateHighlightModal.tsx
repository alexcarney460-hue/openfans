"use client";

import { useEffect, useState, useCallback } from "react";
import { X, Check, Loader2 } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StoryItem {
  readonly id: string;
  readonly media_url: string;
  readonly media_type: "image" | "video";
  readonly caption: string | null;
  readonly is_active: boolean;
  readonly created_at: string;
}

interface CreateHighlightModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onCreated?: (highlight: { id: string; name: string }) => void;
  /** When set, the modal operates in "edit" mode for an existing highlight. */
  readonly editHighlightId?: string;
  readonly editName?: string;
  readonly editSelectedStoryIds?: readonly string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeLabel(dateStr: string, isActive: boolean): string {
  if (isActive) return "Active";
  const hours = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 3_600_000,
  );
  if (hours < 1) return "Expired <1h ago";
  return `Expired ${hours}h ago`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CreateHighlightModal({
  isOpen,
  onClose,
  onCreated,
  editHighlightId,
  editName,
  editSelectedStoryIds,
}: CreateHighlightModalProps) {
  const [name, setName] = useState(editName ?? "");
  const [stories, setStories] = useState<readonly StoryItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    new Set(editSelectedStoryIds ?? []),
  );
  const [loadingStories, setLoadingStories] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = Boolean(editHighlightId);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setName(editName ?? "");
      setSelectedIds(new Set(editSelectedStoryIds ?? []));
      setError(null);
    }
  }, [isOpen, editName, editSelectedStoryIds]);

  // Fetch creator's recent/expired stories
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setLoadingStories(true);

    fetch("/api/stories/my")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch stories");
        return res.json();
      })
      .then((json) => {
        if (cancelled) return;
        setStories(json.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setStories([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingStories(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Lock body scroll
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // Toggle story selection (immutable set pattern)
  const toggleStory = useCallback((storyId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(storyId)) {
        next.delete(storyId);
      } else {
        next.add(storyId);
      }
      return next;
    });
  }, []);

  // Submit: create or update
  const handleSubmit = useCallback(async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Name is required");
      return;
    }
    if (trimmedName.length > 50) {
      setError("Name must be 50 characters or less");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (isEditMode && editHighlightId) {
        // Update highlight name
        const patchRes = await fetch(`/api/highlights/${editHighlightId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmedName }),
        });

        if (!patchRes.ok) {
          const errJson = await patchRes.json().catch(() => null);
          setError(errJson?.error ?? "Failed to update highlight");
          return;
        }

        // Sync stories: add new, remove removed
        const currentIds = new Set(editSelectedStoryIds ?? []);
        const toAdd = Array.from(selectedIds).filter((id) => !currentIds.has(id));
        const toRemove = Array.from(currentIds).filter((id) => !selectedIds.has(id));

        await Promise.all([
          ...toAdd.map((storyId) =>
            fetch(`/api/highlights/${editHighlightId}/stories`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ story_id: storyId }),
            }),
          ),
          ...toRemove.map((storyId) =>
            fetch(`/api/highlights/${editHighlightId}/stories`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ story_id: storyId }),
            }),
          ),
        ]);

        onCreated?.({ id: editHighlightId, name: trimmedName });
      } else {
        // Create new highlight
        const createRes = await fetch("/api/highlights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmedName }),
        });

        if (!createRes.ok) {
          const errJson = await createRes.json().catch(() => null);
          setError(errJson?.error ?? "Failed to create highlight");
          return;
        }

        const createJson = await createRes.json();
        const highlightId = createJson.data.id;

        // Add selected stories
        if (selectedIds.size > 0) {
          await Promise.all(
            Array.from(selectedIds).map((storyId) =>
              fetch(`/api/highlights/${highlightId}/stories`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ story_id: storyId }),
              }),
            ),
          );
        }

        onCreated?.({ id: highlightId, name: trimmedName });
      }

      onClose();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [
    name,
    selectedIds,
    isEditMode,
    editHighlightId,
    editSelectedStoryIds,
    onCreated,
    onClose,
  ]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div className="relative z-10 w-full max-w-lg rounded-t-2xl bg-white sm:rounded-2xl sm:shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-lg font-bold text-gray-900">
            {isEditMode ? "Edit Highlight" : "New Highlight"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
          {/* Name input */}
          <div className="mb-5">
            <label
              htmlFor="highlight-name"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Name
            </label>
            <input
              id="highlight-name"
              type="text"
              maxLength={50}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Best Moments"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#00AFF0] focus:outline-none focus:ring-2 focus:ring-[#00AFF0]/20"
            />
            <p className="mt-1 text-xs text-gray-400">
              {name.trim().length}/50
            </p>
          </div>

          {/* Story grid */}
          <div className="mb-2">
            <p className="mb-2 text-sm font-medium text-gray-700">
              Select Stories
            </p>

            {loadingStories ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : stories.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-400">
                No recent stories available.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {stories.map((story) => {
                  const isSelected = selectedIds.has(story.id);

                  return (
                    <button
                      key={story.id}
                      type="button"
                      onClick={() => toggleStory(story.id)}
                      className={`group relative aspect-[9/16] overflow-hidden rounded-lg border-2 transition-all ${
                        isSelected
                          ? "border-[#00AFF0] ring-2 ring-[#00AFF0]/20"
                          : "border-transparent hover:border-gray-300"
                      }`}
                    >
                      {story.media_type === "video" ? (
                        <video
                          src={story.media_url}
                          className="h-full w-full object-cover"
                          muted
                          preload="metadata"
                        />
                      ) : (
                        <img
                          src={story.media_url}
                          alt={story.caption ?? "Story"}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      )}

                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                      {/* Status badge */}
                      <span
                        className={`absolute left-1 top-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          story.is_active
                            ? "bg-green-500/80 text-white"
                            : "bg-gray-800/70 text-gray-300"
                        }`}
                      >
                        {timeLabel(story.created_at, story.is_active)}
                      </span>

                      {/* Checkmark */}
                      {isSelected && (
                        <div className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#00AFF0] text-white shadow-sm">
                          <Check className="h-4 w-4" strokeWidth={3} />
                        </div>
                      )}

                      {/* Unselected circle indicator */}
                      {!isSelected && (
                        <div className="absolute right-1.5 top-1.5 h-6 w-6 rounded-full border-2 border-white/60 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <p className="mt-3 text-sm text-red-500">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 px-5 py-4">
          <p className="text-sm text-gray-400">
            {selectedIds.size} {selectedIds.size === 1 ? "story" : "stories"} selected
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || name.trim().length === 0}
              className="flex items-center gap-2 rounded-lg bg-[#00AFF0] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#009ad6] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditMode ? "Save" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
