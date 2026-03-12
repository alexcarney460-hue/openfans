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
    <div className="group relative min-w-[300px] max-w-[340px] shrink-0 overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111] transition-all duration-200 hover:shadow-lg hover:shadow-black/20 hover:scale-[1.02]">
      {/* Banner */}
      <Link href={`/${creator.username}`} className="block">
        <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-[#1a2a3a] to-[#1a1a2e]">
          <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-transparent" />

          {/* Category badge */}
          <div className="absolute right-3 top-3">
            <span className="rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white/80 backdrop-blur-sm">
              {creator.primaryCategory}
            </span>
          </div>
        </div>
      </Link>

      {/* Avatar overlapping banner */}
      <div className="relative -mt-10 px-5">
        <div className="inline-block h-20 w-20 overflow-hidden rounded-full border-[3px] border-[#111111]">
          <div className="flex h-full w-full items-center justify-center rounded-full bg-[#1e1e1e] text-xl font-bold text-white">
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
              <BadgeCheck className="h-5 w-5 shrink-0 fill-[#00AFF0] text-white" />
            )}
          </div>
          <p className="text-sm text-white/40">@{creator.username}</p>

          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/50">
            {creator.bio}
          </p>
        </Link>

        <div className="mt-3 flex items-center gap-1.5 text-sm text-white/35">
          <Users className="h-4 w-4" />
          <span>{formatNumber(creator.stats.subscribers)} subscribers</span>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-4">
          <span className="text-sm font-medium text-white/50">
            ${creator.subscriptionPrice.toFixed(2)}/mo
          </span>
          <SubscribeButton price={creator.subscriptionPrice} size="sm" />
        </div>
      </div>
    </div>
  );
}
