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
        "group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md sm:hover:scale-[1.02]",
        className,
      )}
    >
      {/* Banner */}
      <Link href={`/${creator.username}`} className="block">
        <div className="relative h-24 overflow-hidden bg-gradient-to-br from-[#d0e8f2] to-[#e0e0f0] sm:h-36">
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
        </div>
      </Link>

      {/* Content */}
      <div className="relative px-3 pb-3 sm:px-4 sm:pb-4">
        {/* Avatar overlapping the banner */}
        <Link href={`/${creator.username}`} className="-mt-7 mb-1.5 block sm:-mt-9 sm:mb-2">
          <div className="inline-block h-14 w-14 overflow-hidden rounded-full border-[3px] border-white sm:h-[72px] sm:w-[72px]">
            {creator.avatarUrl && creator.avatarUrl !== "" ? (
              <img
                src={creator.avatarUrl}
                alt={creator.displayName}
                className="h-full w-full rounded-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-full bg-gray-100 text-base font-bold text-gray-900 sm:text-lg">
                {creator.displayName.charAt(0)}
              </div>
            )}
          </div>
        </Link>

        {/* Name + verified */}
        <Link href={`/${creator.username}`} className="block">
          <div className="mb-0.5 flex items-center gap-1">
            <h3 className="truncate text-sm font-bold text-gray-900 group-hover:underline sm:text-[15px]">
              {creator.displayName}
            </h3>
            {creator.isVerified && (
              <BadgeCheck className="h-3.5 w-3.5 flex-shrink-0 fill-[#00AFF0] text-white sm:h-4 sm:w-4" />
            )}
          </div>
          <p className="text-[11px] text-gray-400 sm:text-xs">@{creator.username}</p>

          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-gray-500 sm:mt-1.5 sm:text-xs">
            {creator.bio}
          </p>
        </Link>

        {/* Stats */}
        <div className="mt-2 flex items-center gap-2.5 text-[11px] text-gray-400 sm:mt-3 sm:gap-3 sm:text-xs">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            {formatNumber(creator.stats.subscribers)}
          </span>
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            {formatNumber(creator.stats.posts)} posts
          </span>
        </div>

        {/* Subscribe */}
        <div className="mt-2 border-t border-gray-200 pt-2 sm:mt-3 sm:pt-3">
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
