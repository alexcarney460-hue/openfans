"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StoryRingCreator {
  readonly avatar_url: string;
  readonly username: string;
  readonly has_stories: boolean;
}

type RingSize = "sm" | "lg";

interface StoryRingProps {
  readonly creator: StoryRingCreator;
  readonly onClick?: () => void;
  readonly size?: RingSize;
  readonly hasUnviewed?: boolean;
  readonly isOwnStory?: boolean;
  readonly className?: string;
}

// ---------------------------------------------------------------------------
// Dimension mapping
// ---------------------------------------------------------------------------

const SIZE_MAP: Record<
  RingSize,
  { outer: string; inner: string; avatar: string; plus: string }
> = {
  sm: {
    outer: "h-16 w-16",
    inner: "h-[58px] w-[58px]",
    avatar: "h-[54px] w-[54px]",
    plus: "h-5 w-5",
  },
  lg: {
    outer: "h-20 w-20",
    inner: "h-[74px] w-[74px]",
    avatar: "h-[68px] w-[68px]",
    plus: "h-6 w-6",
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StoryRing({
  creator,
  onClick,
  size = "sm",
  hasUnviewed = true,
  isOwnStory = false,
  className,
}: StoryRingProps) {
  const dims = SIZE_MAP[size];
  const showRing = creator.has_stories;
  const ringGradient = hasUnviewed
    ? "bg-gradient-to-br from-[#00AFF0] to-[#0090c8]"
    : "bg-gray-300";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex flex-col items-center gap-1.5 focus:outline-none",
        className,
      )}
      aria-label={
        isOwnStory ? "Add your story" : `View ${creator.username}'s stories`
      }
    >
      {/* Ring wrapper */}
      <div className="relative">
        {/* Gradient ring background */}
        <div
          className={cn(
            "flex items-center justify-center rounded-full p-[2.5px] transition-transform duration-200 group-hover:scale-105 group-active:scale-95",
            dims.outer,
            showRing ? ringGradient : "bg-transparent",
          )}
        >
          {/* White gap ring */}
          <div
            className={cn(
              "flex items-center justify-center rounded-full",
              dims.inner,
              showRing ? "bg-white" : "bg-transparent",
            )}
          >
            {/* Avatar */}
            <div
              className={cn(
                "overflow-hidden rounded-full bg-gray-200",
                dims.avatar,
              )}
            >
              {creator.avatar_url ? (
                <img
                  src={creator.avatar_url}
                  alt={creator.username}
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-300 text-lg font-semibold text-gray-600">
                  {creator.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* "+" badge for own story */}
        {isOwnStory && (
          <div
            className={cn(
              "absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full border-2 border-white bg-[#00AFF0] text-white",
              dims.plus,
            )}
          >
            <Plus className="h-3 w-3" strokeWidth={3} />
          </div>
        )}
      </div>

      {/* Label */}
      <span className="max-w-[68px] truncate text-[11px] leading-tight text-gray-700">
        {isOwnStory ? "Your Story" : creator.username}
      </span>
    </button>
  );
}
