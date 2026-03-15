"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Plus } from "lucide-react";
import { StoryViewer } from "@/components/StoryViewer";
import type { CreatorStories } from "@/components/StoryViewer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Highlight {
  readonly id: string;
  readonly creator_id: string;
  readonly name: string;
  readonly cover_url: string | null;
  readonly position: number;
  readonly story_count: number;
  readonly first_media_url: string | null;
}

interface HighlightDetail {
  readonly id: string;
  readonly name: string;
  readonly creator: {
    readonly username: string;
    readonly display_name: string;
    readonly avatar_url: string | null;
  };
  readonly stories: ReadonlyArray<{
    readonly id: string;
    readonly media_url: string;
    readonly media_type: "image" | "video";
    readonly caption: string | null;
    readonly created_at: string;
  }>;
}

interface HighlightBarProps {
  readonly creatorId: string;
  readonly creatorUsername: string;
  readonly creatorDisplayName: string;
  readonly creatorAvatarUrl: string | null;
  readonly isOwner: boolean;
  readonly onCreateNew?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HighlightBar({
  creatorId,
  creatorUsername,
  creatorDisplayName,
  creatorAvatarUrl,
  isOwner,
  onCreateNew,
}: HighlightBarProps) {
  const [highlights, setHighlights] = useState<readonly Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewerStories, setViewerStories] = useState<readonly CreatorStories[] | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch highlights
  const fetchHighlights = useCallback(async () => {
    try {
      const res = await fetch(`/api/highlights?creator_id=${creatorId}`);
      if (res.ok) {
        const json = await res.json();
        setHighlights(json.data ?? []);
      }
    } catch {
      // Silent fail — highlights are non-critical
    } finally {
      setLoading(false);
    }
  }, [creatorId]);

  useEffect(() => {
    fetchHighlights();
  }, [fetchHighlights]);

  // Open a highlight in the StoryViewer
  const handleOpenHighlight = useCallback(
    async (highlightId: string) => {
      try {
        const res = await fetch(`/api/highlights/${highlightId}`);
        if (!res.ok) return;

        const json = await res.json();
        const detail: HighlightDetail = json.data;

        if (!detail.stories || detail.stories.length === 0) return;

        const creatorStories: CreatorStories = {
          creator_id: creatorId,
          username: creatorUsername,
          display_name: creatorDisplayName,
          avatar_url: creatorAvatarUrl ?? "",
          stories: detail.stories.map((s) => ({
            id: s.id,
            media_url: s.media_url,
            media_type: s.media_type,
            caption: s.caption,
            created_at: s.created_at,
          })),
        };

        setViewerStories([creatorStories]);
      } catch {
        // Silent fail
      }
    },
    [creatorId, creatorUsername, creatorDisplayName, creatorAvatarUrl],
  );

  // Don't render if no highlights and not owner
  if (!loading && highlights.length === 0 && !isOwner) {
    return null;
  }

  // Skeleton while loading
  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto px-4 py-3 scrollbar-hide">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex flex-shrink-0 flex-col items-center gap-1.5">
            <div className="h-16 w-16 animate-pulse rounded-full bg-gray-200" />
            <div className="h-3 w-12 animate-pulse rounded bg-gray-200" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto px-4 py-3 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* Highlight circles */}
        {highlights.map((highlight) => {
          const thumbnail = highlight.cover_url ?? highlight.first_media_url;

          return (
            <button
              key={highlight.id}
              type="button"
              onClick={() => handleOpenHighlight(highlight.id)}
              className="flex flex-shrink-0 flex-col items-center gap-1.5 transition-transform active:scale-95"
            >
              <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-gray-200 bg-gray-100">
                {thumbnail ? (
                  <img
                    src={thumbnail}
                    alt={highlight.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                    <span className="text-lg font-semibold text-gray-400">
                      {highlight.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <span className="max-w-[72px] truncate text-xs text-gray-600">
                {highlight.name}
              </span>
            </button>
          );
        })}

        {/* "New" button — only for profile owner */}
        {isOwner && (
          <button
            type="button"
            onClick={onCreateNew}
            className="flex flex-shrink-0 flex-col items-center gap-1.5 transition-transform active:scale-95"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-[#00AFF0] hover:bg-[#00AFF0]/5">
              <Plus className="h-6 w-6 text-gray-400" />
            </div>
            <span className="text-xs text-gray-500">New</span>
          </button>
        )}
      </div>

      {/* Story Viewer overlay */}
      {viewerStories && (
        <StoryViewer
          stories={viewerStories}
          onClose={() => setViewerStories(null)}
        />
      )}
    </>
  );
}
