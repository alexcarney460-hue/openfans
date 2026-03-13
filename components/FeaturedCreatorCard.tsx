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
    <div className="group relative min-w-[300px] max-w-[340px] shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
      {/* Banner */}
      <Link href={`/${creator.username}`} className="block">
        <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-[#d0e8f2] to-[#e0e0f0]">
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />

          {/* Category badge */}
          <div className="absolute right-3 top-3">
            <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium text-gray-700 backdrop-blur-sm">
              {creator.primaryCategory}
            </span>
          </div>
        </div>
      </Link>

      {/* Avatar overlapping banner */}
      <div className="relative -mt-10 px-5">
        <div className="inline-block h-20 w-20 overflow-hidden rounded-full border-[3px] border-white">
          <div className="flex h-full w-full items-center justify-center rounded-full bg-gray-100 text-xl font-bold text-gray-900">
            {creator.displayName.charAt(0)}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="px-5 pb-5 pt-3">
        <Link href={`/${creator.username}`} className="block">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-lg font-bold text-gray-900 group-hover:underline">
              {creator.displayName}
            </h3>
            {creator.isVerified && (
              <BadgeCheck className="h-5 w-5 shrink-0 fill-[#00AFF0] text-white" />
            )}
          </div>
          <p className="text-sm text-gray-400">@{creator.username}</p>

          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-500">
            {creator.bio}
          </p>
        </Link>

        <div className="mt-3 flex items-center gap-1.5 text-sm text-gray-400">
          <Users className="h-4 w-4" />
          <span>{formatNumber(creator.stats.subscribers)} subscribers</span>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
          <span className="text-sm font-medium text-gray-500">
            ${creator.subscriptionPrice.toFixed(2)}/mo
          </span>
          <SubscribeButton price={creator.subscriptionPrice} size="sm" />
        </div>
      </div>
    </div>
  );
}
