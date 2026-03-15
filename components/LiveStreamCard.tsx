"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Bell, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { LiveBadge } from "./LiveBadge";

interface LiveStreamCardProps {
  readonly stream: {
    readonly id: string;
    readonly title: string;
    readonly status: "live" | "scheduled";
    readonly thumbnail_url: string | null;
    readonly viewer_count: number;
    readonly scheduled_at: string | null;
    readonly is_subscriber_only: boolean;
    readonly creator: {
      readonly username: string;
      readonly display_name: string;
      readonly avatar_url: string | null;
    };
  };
  readonly className?: string;
}

function formatTimeRemaining(scheduledAt: string): string {
  const diff = new Date(scheduledAt).getTime() - Date.now();
  if (diff <= 0) return "Starting soon";

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function LiveStreamCard({ stream, className }: LiveStreamCardProps) {
  const [timeLeft, setTimeLeft] = useState(() =>
    stream.scheduled_at ? formatTimeRemaining(stream.scheduled_at) : "",
  );

  const isLive = stream.status === "live";

  // Update countdown every minute for scheduled streams
  useEffect(() => {
    if (isLive || !stream.scheduled_at) return;

    const interval = setInterval(() => {
      setTimeLeft(formatTimeRemaining(stream.scheduled_at!));
    }, 60000);

    return () => clearInterval(interval);
  }, [isLive, stream.scheduled_at]);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-200 hover:shadow-md sm:hover:scale-[1.02]",
        isLive
          ? "border-red-200 ring-1 ring-red-500/20"
          : "border-gray-200",
        className,
      )}
    >
      {/* Thumbnail */}
      <Link href={`/stream/${stream.id}`} className="block">
        <div className="relative aspect-video overflow-hidden bg-gray-100">
          {stream.thumbnail_url ? (
            <img
              src={stream.thumbnail_url}
              alt={stream.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div
              className={cn(
                "flex h-full w-full items-center justify-center",
                isLive
                  ? "bg-gradient-to-br from-red-900/80 via-red-800/60 to-gray-900"
                  : "bg-gradient-to-br from-[#0A1628] via-[#151a2e] to-[#1a1a2e]",
              )}
            >
              <Radio
                className={cn(
                  "h-10 w-10",
                  isLive ? "text-red-400/40" : "text-gray-500/30",
                )}
              />
            </div>
          )}

          {/* Live badge overlay */}
          {isLive && (
            <div className="absolute left-2 top-2">
              <LiveBadge viewerCount={stream.viewer_count} />
            </div>
          )}

          {/* Scheduled countdown overlay */}
          {!isLive && stream.scheduled_at && (
            <div className="absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-md bg-black/70 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
              <Bell className="h-3 w-3" />
              Starts in {timeLeft}
            </div>
          )}

          {/* Subscriber-only badge */}
          {stream.is_subscriber_only && (
            <div className="absolute right-2 top-2 rounded-md bg-[#00AFF0]/90 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
              Subscribers
            </div>
          )}

          {/* Viewer count for live streams */}
          {isLive && (
            <div className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
              <Users className="h-3 w-3" />
              {stream.viewer_count.toLocaleString()} watching
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-3 sm:p-4">
        <div className="flex items-start gap-3">
          {/* Creator avatar */}
          <Link
            href={`/${stream.creator.username}`}
            className="flex-shrink-0"
            aria-label={`View ${stream.creator.display_name}'s profile`}
          >
            <div className="h-9 w-9 overflow-hidden rounded-full border-2 border-white shadow-sm">
              {stream.creator.avatar_url ? (
                <img
                  src={stream.creator.avatar_url}
                  alt={stream.creator.display_name}
                  className="h-full w-full rounded-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-[#00AFF0] to-[#0A1628] text-xs font-bold text-white">
                  {stream.creator.display_name.charAt(0)}
                </div>
              )}
            </div>
          </Link>

          <div className="min-w-0 flex-1">
            {/* Stream title */}
            <Link href={`/stream/${stream.id}`} className="block">
              <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-[#00AFF0] transition-colors">
                {stream.title}
              </h3>
            </Link>

            {/* Creator name */}
            <Link
              href={`/${stream.creator.username}`}
              className="mt-0.5 block text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {stream.creator.display_name}
            </Link>
          </div>
        </div>

        {/* Action button */}
        <div className="mt-3">
          <Link
            href={`/stream/${stream.id}`}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
              isLive
                ? "bg-red-600 text-white hover:bg-red-700 active:scale-[0.98]"
                : "border border-[#00AFF0] text-[#00AFF0] hover:bg-[#00AFF0]/10",
            )}
          >
            {isLive ? (
              <>
                <Radio className="h-4 w-4" />
                Watch Now
              </>
            ) : (
              <>
                <Bell className="h-4 w-4" />
                Notify Me
              </>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}
