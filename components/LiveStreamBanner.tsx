"use client";

import { useState } from "react";
import Link from "next/link";
import { X, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { LiveBadge } from "./LiveBadge";

interface LiveStream {
  readonly id: string;
  readonly title: string;
  readonly viewer_count: number;
  readonly creator: {
    readonly username: string;
    readonly display_name: string;
    readonly avatar_url: string | null;
  };
}

interface LiveStreamBannerProps {
  readonly stream: LiveStream;
  readonly className?: string;
}

export function LiveStreamBanner({ stream, className }: LiveStreamBannerProps) {
  const storageKey = `live-banner-dismissed-${stream.id}`;
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    try { return sessionStorage.getItem(storageKey) === "true"; } catch { return false; }
  });

  const handleDismiss = () => {
    setDismissed(true);
    try { sessionStorage.setItem(storageKey, "true"); } catch { /* private browsing */ }
  };

  if (dismissed) return null;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl",
        className,
      )}
    >
      {/* Animated gradient border */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500 via-orange-500 to-red-500 p-[2px] animate-gradient-x">
        <div className="h-full w-full rounded-[10px] bg-white" />
      </div>

      {/* Content */}
      <div className="relative flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5 sm:py-4">
        {/* Creator avatar with live ring */}
        <Link
          href={`/${stream.creator.username}`}
          className="relative flex-shrink-0"
        >
          <div className="h-10 w-10 overflow-hidden rounded-full ring-2 ring-red-500 ring-offset-2 sm:h-12 sm:w-12">
            {stream.creator.avatar_url ? (
              <img
                src={stream.creator.avatar_url}
                alt={stream.creator.display_name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-[#00AFF0] to-[#0A1628] text-sm font-bold text-white sm:text-base">
                {stream.creator.display_name.charAt(0)}
              </div>
            )}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5">
            <LiveBadge size="sm" />
          </div>
        </Link>

        {/* Stream info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/${stream.creator.username}`}
              className="truncate text-sm font-bold text-gray-900 hover:underline sm:text-base"
            >
              {stream.creator.display_name}
            </Link>
            <span className="hidden text-sm text-gray-400 sm:inline">
              is live now!
            </span>
          </div>
          <p className="truncate text-xs text-gray-500 sm:text-sm">
            {stream.title}
          </p>
          <p className="mt-0.5 text-[10px] text-gray-400 sm:hidden">
            Live now
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            href={`/stream/${stream.id}`}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-red-700 active:scale-[0.98] sm:px-4 sm:py-2 sm:text-sm"
          >
            <Radio className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Watch
          </Link>
          <button
            onClick={handleDismiss}
            className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 sm:h-8 sm:w-8"
            aria-label="Dismiss live stream notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
