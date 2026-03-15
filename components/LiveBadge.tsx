"use client";

import { cn } from "@/lib/utils";

interface LiveBadgeProps {
  readonly size?: "sm" | "lg";
  readonly viewerCount?: number;
  readonly className?: string;
}

export function LiveBadge({
  size = "sm",
  viewerCount,
  className,
}: LiveBadgeProps) {
  const isLarge = size === "lg";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md bg-red-600 font-semibold uppercase text-white",
        isLarge ? "px-3 py-1.5 text-sm" : "px-2 py-0.5 text-[10px]",
        className,
      )}
    >
      <span
        className={cn(
          "relative flex",
          isLarge ? "h-2.5 w-2.5" : "h-2 w-2",
        )}
      >
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
        <span className="relative inline-flex h-full w-full rounded-full bg-white" />
      </span>
      <span>Live</span>
      {viewerCount != null && (
        <>
          <span className="opacity-50">|</span>
          <span className="tabular-nums">
            {viewerCount.toLocaleString()}
          </span>
        </>
      )}
    </div>
  );
}
