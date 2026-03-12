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
        "group overflow-hidden rounded-xl border border-white/5 bg-[#111111] transition-all hover:border-white/10 hover:shadow-lg hover:shadow-purple-500/5",
        className,
      )}
    >
      {/* Banner */}
      <Link href={`/${creator.username}`} className="block">
        <div className="relative h-28 overflow-hidden bg-gradient-to-br from-purple-900/40 to-pink-900/40 transition-transform duration-500 group-hover:scale-[1.02]">
          <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-transparent" />
        </div>
      </Link>

      {/* Content */}
      <div className="relative px-4 pb-4">
        {/* Avatar */}
        <Link href={`/${creator.username}`} className="-mt-8 mb-2 block">
          <div className="inline-block h-16 w-16 overflow-hidden rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-[2px]">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-[#1a1a1a] text-lg font-bold text-white">
              {creator.displayName.charAt(0)}
            </div>
          </div>
        </Link>

        {/* Info */}
        <Link href={`/${creator.username}`} className="block">
          <div className="mb-0.5 flex items-center gap-1.5">
            <h3 className="truncate text-base font-bold text-white group-hover:underline">
              {creator.displayName}
            </h3>
            {creator.isVerified && (
              <BadgeCheck className="h-4 w-4 flex-shrink-0 text-purple-400" />
            )}
          </div>
          <p className="text-xs text-white/40">@{creator.username}</p>

          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-white/55">
            {creator.bio}
          </p>
        </Link>

        {/* Stats */}
        <div className="mt-3 flex items-center gap-3 text-xs text-white/40">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {formatNumber(creator.stats.subscribers)}
          </span>
          <span className="flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" />
            {formatNumber(creator.stats.posts)} posts
          </span>
        </div>

        {/* Categories + Subscribe */}
        <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
          <div className="flex flex-wrap gap-1.5">
            {creator.categories.slice(0, 2).map((category) => (
              <span
                key={category}
                className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/50"
              >
                {category}
              </span>
            ))}
          </div>
          <SubscribeButton
            price={creator.subscriptionPrice}
            size="sm"
          />
        </div>
      </div>
    </div>
  );
}
