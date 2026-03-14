"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Bookmark, BadgeCheck, Heart, MessageCircle, Eye, X } from "lucide-react";

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface BookmarkedPost {
  readonly bookmark_id: number;
  readonly bookmarked_at: string;
  readonly post: {
    readonly id: number;
    readonly title: string | null;
    readonly body: string | null;
    readonly media_urls: string[];
    readonly media_type: string;
    readonly is_free: boolean;
    readonly tier: string;
    readonly likes_count: number;
    readonly comments_count: number;
    readonly views_count: number;
    readonly created_at: string;
  };
  readonly creator: {
    readonly id: string;
    readonly username: string;
    readonly display_name: string;
    readonly avatar_url: string | null;
    readonly is_verified: boolean;
  };
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBookmarks() {
      try {
        const res = await fetch("/api/bookmarks?limit=50");
        if (res.ok) {
          const json = await res.json();
          setBookmarks(json.data ?? []);
        }
      } catch {
        // Failed to fetch bookmarks
      } finally {
        setLoading(false);
      }
    }
    fetchBookmarks();
  }, []);

  const handleRemoveBookmark = useCallback(async (postId: number) => {
    // Save the removed bookmark before filtering so we can revert on failure
    const removed = bookmarks.find((b) => b.post.id === postId);
    setBookmarks((prev) => prev.filter((b) => b.post.id !== postId));

    try {
      const res = await fetch(`/api/posts/${postId}/bookmark`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to remove bookmark");
    } catch {
      // Revert: re-add the bookmark in its original sorted position
      if (removed) {
        setBookmarks((prev) =>
          [...prev, removed].sort(
            (a, b) => new Date(b.bookmarked_at).getTime() - new Date(a.bookmarked_at).getTime(),
          ),
        );
      }
    }
  }, [bookmarks]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#00AFF0]" />
        <p className="mt-4 text-sm text-gray-400">Loading bookmarks...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <Bookmark className="h-6 w-6 text-[#00AFF0]" />
        <h1 className="text-2xl font-bold text-gray-900">Bookmarks</h1>
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-500">
          {bookmarks.length}
        </span>
      </div>

      {bookmarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16">
          <Bookmark className="mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">No bookmarks yet</p>
          <p className="mt-1 text-xs text-gray-400">
            Bookmark posts to save them for later
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookmarks.map((item) => (
            <article
              key={item.bookmark_id}
              className="group rounded-xl border border-gray-200 bg-white transition-colors hover:border-gray-300"
            >
              {/* Creator header */}
              <div className="flex items-center gap-3 p-4 pb-3">
                <Link
                  href={`/${item.creator.username}`}
                  className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gray-200"
                >
                  {item.creator.avatar_url ? (
                    <img
                      src={item.creator.avatar_url}
                      alt={item.creator.display_name}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-gray-600">
                      {item.creator.display_name.charAt(0)}
                    </span>
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/${item.creator.username}`}
                      className="truncate text-sm font-semibold text-gray-900 hover:underline"
                    >
                      {item.creator.display_name}
                    </Link>
                    {item.creator.is_verified && (
                      <BadgeCheck className="h-4 w-4 flex-shrink-0 fill-[#00AFF0] text-white" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    Bookmarked {timeAgo(item.bookmarked_at)}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveBookmark(item.post.id)}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-400 opacity-0 transition-all hover:border-red-200 hover:text-red-400 group-hover:opacity-100"
                  aria-label="Remove bookmark"
                >
                  <X className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>

              {/* Post content */}
              <Link
                href={`/${item.creator.username}/post/${item.post.id}`}
                className="block px-4 pb-3"
              >
                {item.post.title && (
                  <p className="mb-1 text-sm font-semibold text-gray-900">
                    {item.post.title}
                  </p>
                )}
                {item.post.body && (
                  <p className="line-clamp-3 text-sm leading-relaxed text-gray-600">
                    {item.post.body}
                  </p>
                )}
                {item.post.media_urls && item.post.media_urls.length > 0 && (
                  <div className="mt-2 overflow-hidden rounded-lg">
                    <img
                      src={item.post.media_urls[0]}
                      alt={item.post.title ?? "Post media"}
                      className="aspect-video w-full object-cover"
                      loading="lazy"
                    />
                    {item.post.media_urls.length > 1 && (
                      <p className="mt-1 text-xs text-gray-400">
                        +{item.post.media_urls.length - 1} more
                      </p>
                    )}
                  </div>
                )}
              </Link>

              {/* Stats bar */}
              <div className="flex items-center gap-6 border-t border-gray-200 px-4 py-3">
                <span className="flex items-center gap-1.5 text-gray-400">
                  <Heart className="h-4 w-4" />
                  <span className="text-xs">{formatNumber(item.post.likes_count)}</span>
                </span>
                <span className="flex items-center gap-1.5 text-gray-400">
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-xs">{formatNumber(item.post.comments_count)}</span>
                </span>
                <span className="flex items-center gap-1.5 text-gray-400">
                  <Eye className="h-4 w-4" />
                  <span className="text-xs">{formatNumber(item.post.views_count)}</span>
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
