"use client";

import Link from "next/link";
import { BadgeCheck, Users } from "lucide-react";
import { formatNumber } from "@/lib/mock-data";
import { SubscribeButton } from "./SubscribeButton";
import type { ExploreCreator } from "@/app/explore/mock-data";

interface FeaturedCreatorCardProps {
  readonly creator: ExploreCreator;
}

export function FeaturedCreatorCard({ creator }: FeaturedCreatorCardProps) {
  return (
    <div className="group relative min-w-[300px] max-w-[340px] shrink-0 overflow-hidden rounded-2xl border border-white/5 bg-[#111111] transition-all hover:border-white/10 hover:shadow-lg hover:shadow-purple-500/5">
      {/* Banner */}
      <Link href={`/${creator.username}`} className="block">
        <div className="relative h-36 w-full overflow-hidden bg-gradient-to-br from-purple-900/40 to-pink-900/40">
          <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-black/20 to-transparent" />

          {/* Category badge */}
          <div className="absolute right-3 top-3">
            <span className="rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
              {creator.primaryCategory}
            </span>
          </div>
        </div>
      </Link>

      {/* Avatar overlapping banner */}
      <div className="relative -mt-10 px-5">
        <div className="inline-block h-20 w-20 overflow-hidden rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-[2px]">
          <div className="flex h-full w-full items-center justify-center rounded-full bg-[#1a1a1a] text-xl font-bold text-white">
            {creator.displayName.charAt(0)}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="px-5 pb-5 pt-3">
        <Link href={`/${creator.username}`} className="block">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-lg font-bold text-white group-hover:underline">
              {creator.displayName}
            </h3>
            {creator.isVerified && (
              <BadgeCheck className="h-5 w-5 shrink-0 text-purple-400" />
            )}
          </div>
          <p className="text-sm text-white/40">@{creator.username}</p>

          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/55">
            {creator.bio}
          </p>
        </Link>

        <div className="mt-3 flex items-center gap-1.5 text-sm text-white/40">
          <Users className="h-4 w-4" />
          <span>{formatNumber(creator.stats.subscribers)} subscribers</span>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
          <span className="text-sm font-semibold text-white/60">
            ${creator.subscriptionPrice.toFixed(2)}/mo
          </span>
          <SubscribeButton price={creator.subscriptionPrice} size="sm" />
        </div>
      </div>
    </div>
  );
}
