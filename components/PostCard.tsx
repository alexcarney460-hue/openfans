"use client";

import { cn } from "@/lib/utils";
import type { Post } from "@/lib/mock-data";
import { formatNumber, timeAgo } from "@/lib/mock-data";
import { Heart, MessageCircle, Lock, Share2 } from "lucide-react";
import Link from "next/link";

interface PostCardProps {
  readonly post: Post;
  readonly isSubscribed?: boolean;
  readonly className?: string;
}

export function PostCard({
  post,
  isSubscribed = false,
  className,
}: PostCardProps) {
  const isLocked = post.isPremium && !isSubscribed;

  return (
    <article
      className={cn(
        "rounded-xl border border-white/5 bg-[#111111] transition-colors hover:border-white/10",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-3">
        <Link
          href={`/${post.creatorUsername}`}
          className="flex-shrink-0"
          aria-label={`View ${post.creatorDisplayName}'s profile`}
        >
          <div className="h-10 w-10 overflow-hidden rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-[2px]">
            <div className="h-full w-full rounded-full bg-[#1a1a1a]" />
          </div>
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={`/${post.creatorUsername}`}
            className="flex items-center gap-1.5"
          >
            <span className="truncate text-sm font-semibold text-white hover:underline">
              {post.creatorDisplayName}
            </span>
          </Link>
          <p className="text-xs text-white/40">{timeAgo(post.createdAt)}</p>
        </div>
        {post.isPremium && (
          <span className="flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-1 text-xs font-medium text-purple-400">
            <Lock className="h-3 w-3" />
            Premium
          </span>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p
          className={cn(
            "text-sm leading-relaxed text-white/80",
            isLocked && "line-clamp-2",
          )}
        >
          {post.text}
        </p>
      </div>

      {/* Media */}
      {post.mediaUrl && (
        <div className="relative mx-4 mb-3 overflow-hidden rounded-lg">
          <Link href={`/${post.creatorUsername}/post/${post.id}`}>
            <div
              className={cn(
                "flex aspect-video items-center justify-center bg-white/5",
                isLocked && "blur-lg",
              )}
            >
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-900/20 to-pink-900/20">
                <span className="text-sm text-white/20">
                  {post.mediaType === "video" ? "Video" : "Image"}
                </span>
              </div>
            </div>
          </Link>
          {isLocked && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg bg-black/60 backdrop-blur-sm">
              <div className="rounded-full bg-white/10 p-3">
                <Lock className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm font-medium text-white">
                Subscribe to unlock
              </p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-6 border-t border-white/5 px-4 py-3">
        <button
          className="flex items-center gap-1.5 text-white/40 transition-colors hover:text-pink-500"
          aria-label={`Like this post. ${formatNumber(post.stats.likes)} likes`}
        >
          <Heart className="h-4 w-4" />
          <span className="text-xs">{formatNumber(post.stats.likes)}</span>
        </button>
        <Link
          href={`/${post.creatorUsername}/post/${post.id}`}
          className="flex items-center gap-1.5 text-white/40 transition-colors hover:text-purple-400"
          aria-label={`View comments. ${formatNumber(post.stats.comments)} comments`}
        >
          <MessageCircle className="h-4 w-4" />
          <span className="text-xs">{formatNumber(post.stats.comments)}</span>
        </Link>
        <button
          className="ml-auto text-white/40 transition-colors hover:text-white/60"
          aria-label="Share this post"
        >
          <Share2 className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}
