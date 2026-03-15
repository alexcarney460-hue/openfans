"use client";

import { useEffect, useState, useCallback } from "react";
import { StoryRing } from "@/components/StoryRing";
import { StoryViewer, type CreatorStories } from "@/components/StoryViewer";
import { CreateStoryModal } from "@/components/CreateStoryModal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StoryBarProps {
  /** If set, shows the "Your Story" ring at the beginning. */
  readonly currentUser?: {
    readonly avatar_url: string;
    readonly username: string;
  } | null;
  readonly className?: string;
}

interface StoryBarCreator {
  readonly creator_id: string;
  readonly username: string;
  readonly display_name: string;
  readonly avatar_url: string;
  readonly has_unseen: boolean;
}

interface ApiStoryResponse {
  readonly data: readonly {
    readonly id: string;
    readonly creator_id: string;
    readonly media_url: string;
    readonly media_type: "image" | "video";
    readonly caption: string | null;
    readonly created_at: string;
    readonly duration?: number;
    readonly creator: {
      readonly username: string;
      readonly display_name: string;
      readonly avatar_url: string | null;
    };
  }[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StoryBar({ currentUser = null, className }: StoryBarProps) {
  const [creators, setCreators] = useState<StoryBarCreator[]>([]);
  const [allStories, setAllStories] = useState<CreatorStories[]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerStartIndex, setViewerStartIndex] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchStories = useCallback(async () => {
    try {
      const res = await fetch("/api/stories");
      if (!res.ok) return;
      const json: ApiStoryResponse = await res.json();
      const stories = json.data ?? [];

      // Group stories by creator
      const grouped = new Map<
        string,
        CreatorStories & { has_unseen: boolean }
      >();

      for (const story of stories) {
        const existing = grouped.get(story.creator_id);
        const storyItem = {
          id: story.id,
          media_url: story.media_url,
          media_type: story.media_type,
          caption: story.caption,
          created_at: story.created_at,
          duration: story.duration,
        } as const;

        if (existing) {
          grouped.set(story.creator_id, {
            ...existing,
            stories: [...existing.stories, storyItem],
          });
        } else {
          grouped.set(story.creator_id, {
            creator_id: story.creator_id,
            username: story.creator.username,
            display_name: story.creator.display_name,
            avatar_url: story.creator.avatar_url ?? "",
            has_unseen: true,
            stories: [storyItem],
          });
        }
      }

      const groupedArray = Array.from(grouped.values());

      setCreators(
        groupedArray.map((g) => ({
          creator_id: g.creator_id,
          username: g.username,
          display_name: g.display_name,
          avatar_url: g.avatar_url,
          has_unseen: g.has_unseen,
        })),
      );

      setAllStories(
        groupedArray.map((g) => ({
          creator_id: g.creator_id,
          username: g.username,
          display_name: g.display_name,
          avatar_url: g.avatar_url,
          stories: g.stories,
        })),
      );
    } catch {
      // Silently fail - stories are non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const handleCreatorClick = useCallback((index: number) => {
    setViewerStartIndex(index);
    setViewerOpen(true);
  }, []);

  const handleCloseViewer = useCallback(() => {
    setViewerOpen(false);
  }, []);

  const handleStoryCreated = useCallback(() => {
    setCreateOpen(false);
    fetchStories();
  }, [fetchStories]);

  // Show nothing if no stories and done loading and no current user
  if (!loading && creators.length === 0 && !currentUser) return null;

  // Show skeleton while loading
  if (loading) {
    return (
      <div className={`mb-4 overflow-hidden rounded-xl border border-gray-200 bg-white p-4 ${className ?? ""}`}>
        <div
          className="flex gap-4 overflow-x-auto"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {Array.from({ length: 6 }, (_, i) => (
            <div key={`skel-${i}`} className="flex shrink-0 flex-col items-center gap-1.5">
              <div className="h-16 w-16 animate-pulse rounded-full bg-gray-200" />
              <div className="h-3 w-12 animate-pulse rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`mb-4 overflow-hidden rounded-xl border border-gray-200 bg-white p-4 ${className ?? ""}`}>
        <div
          className="flex gap-4 overflow-x-auto"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {/* Create story / "Your Story" ring */}
          {currentUser && (
            <StoryRing
              creator={{
                avatar_url: currentUser.avatar_url,
                username: currentUser.username,
                has_stories: false,
              }}
              isOwnStory
              hasUnviewed={false}
              onClick={() => setCreateOpen(true)}
            />
          )}

          {/* Creator story rings */}
          {creators.map((creator, index) => (
            <StoryRing
              key={creator.creator_id}
              creator={{
                avatar_url: creator.avatar_url,
                username: creator.username,
                has_stories: true,
              }}
              hasUnviewed={creator.has_unseen}
              onClick={() => handleCreatorClick(index)}
            />
          ))}
        </div>
      </div>

      {/* Story viewer overlay */}
      {viewerOpen && allStories.length > 0 && (
        <StoryViewer
          stories={allStories}
          initialCreatorIndex={viewerStartIndex}
          onClose={handleCloseViewer}
        />
      )}

      {/* Create story modal */}
      {createOpen && (
        <CreateStoryModal
          onClose={() => setCreateOpen(false)}
          onCreated={handleStoryCreated}
        />
      )}
    </>
  );
}
