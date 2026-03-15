"use client";

import { cn } from "@/lib/utils";
import { Pin } from "lucide-react";
import Link from "next/link";

export interface ChatMessageData {
  readonly id: string;
  readonly user: {
    readonly username: string;
    readonly display_name: string;
    readonly avatar_url: string | null;
  };
  readonly text: string;
  readonly created_at: string;
  readonly is_creator: boolean;
  readonly is_pinned: boolean;
}

interface ChatMessageProps {
  readonly message: ChatMessageData;
  readonly className?: string;
}

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 5) return "now";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function avatarInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

export function ChatMessage({ message, className }: ChatMessageProps) {
  const { user, text, created_at, is_creator, is_pinned } = message;

  return (
    <div
      className={cn(
        "group flex items-start gap-2.5 px-3 py-1.5 transition-colors hover:bg-gray-50",
        is_pinned && "bg-amber-50 hover:bg-amber-50",
        is_creator && "border-l-2 border-[#00AFF0]",
        className,
      )}
    >
      {/* Avatar */}
      <Link
        href={`/${user.username}`}
        className="flex-shrink-0"
        aria-label={`View ${user.display_name}'s profile`}
      >
        {user.avatar_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={user.avatar_url}
            alt={user.display_name}
            className="h-7 w-7 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200">
            <span className="text-xs font-semibold text-gray-600">
              {avatarInitial(user.display_name)}
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <Link
            href={`/${user.username}`}
            className={cn(
              "truncate text-xs font-semibold hover:underline",
              is_creator ? "text-[#00AFF0]" : "text-gray-900",
            )}
          >
            {user.display_name}
          </Link>
          {is_pinned && (
            <Pin className="h-3 w-3 flex-shrink-0 text-amber-500" />
          )}
          <span className="flex-shrink-0 text-[10px] text-gray-400">
            {timeAgo(created_at)}
          </span>
        </div>
        <p className="break-words text-sm leading-snug text-gray-700">
          {text}
        </p>
      </div>
    </div>
  );
}
