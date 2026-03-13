"use client";

import Link from "next/link";
import { BadgeCheck, Users, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Creator } from "@/lib/mock-data";
import { formatNumber } from "@/lib/mock-data";
import { SubscribeButton } from "./SubscribeButton";

interface CreatorCardProps {
  readonly creator: Creator;
  readonly className?: string;
}

export function CreatorCard({ creator, className }: CreatorCardProps) {
  return (
    <div
      className={cn(
        "group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02]",
        className,
      )}
    >
      {/* Banner - larger visual area */}
      <Link href={`/${creator.username}`} className="block">
        <div className="relative h-36 overflow-hidden bg-gradient-to-br from-[#d0e8f2] to-[#e0e0f0]">
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
        </div>
      </Link>

      {/* Content */}
      <div className="relative px-4 pb-4">
        {/* Avatar overlapping the banner */}
        <Link href={`/${creator.username}`} className="-mt-9 mb-2 block">
          <div className="inline-block h-[72px] w-[72px] overflow-hidden rounded-full border-[3px] border-white">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-gray-100 text-lg font-bold text-gray-900">
              {creator.displayName.charAt(0)}
            </div>
          </div>
        </Link>

        {/* Name + verified */}
        <Link href={`/${creator.username}`} className="block">
          <div className="mb-0.5 flex items-center gap-1.5">
            <h3 className="truncate text-[15px] font-bold text-gray-900 group-hover:underline">
              {creator.displayName}
            </h3>
            {creator.isVerified && (
              <BadgeCheck className="h-4 w-4 flex-shrink-0 fill-[#00AFF0] text-white" />
            )}
          </div>
          <p className="text-xs text-gray-400">@{creator.username}</p>

          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-gray-500">
            {creator.bio}
          </p>
        </Link>

        {/* Stats */}
        <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {formatNumber(creator.stats.subscribers)}
          </span>
          <span className="flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" />
            {formatNumber(creator.stats.posts)} posts
          </span>
        </div>

        {/* Subscribe */}
        <div className="mt-3 border-t border-gray-200 pt-3">
          <SubscribeButton
            price={creator.subscriptionPrice}
            size="sm"
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
