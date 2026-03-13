"use client";

import { useEffect, useState } from "react";
import { CreatorCard } from "@/components/CreatorCard";
import { EXPLORE_CREATORS } from "@/app/explore/mock-data";

interface ApiCreator {
  readonly id: string;
  readonly username: string;
  readonly display_name: string;
  readonly bio: string | null;
  readonly avatar_url: string | null;
  readonly banner_url: string | null;
  readonly is_verified: boolean;
  readonly subscription_price_usdc: number;
  readonly total_subscribers: number;
  readonly categories: string[];
  readonly is_featured: boolean;
}

function mapApiCreator(c: ApiCreator) {
  return {
    username: c.username,
    displayName: c.display_name,
    bio: c.bio ?? "",
    avatarUrl: c.avatar_url ?? "",
    bannerUrl: c.banner_url ?? "",
    isVerified: c.is_verified,
    categories: c.categories ?? [],
    subscriptionPrice: (c.subscription_price_usdc ?? 0) / 100,
    stats: {
      posts: 0,
      subscribers: c.total_subscribers ?? 0,
      likes: 0,
    },
    posts: [] as never[],
  };
}

const HOMEPAGE_FALLBACK = EXPLORE_CREATORS.filter((c) => c.isFeatured)
  .slice(0, 8)
  .map((c) => ({
    username: c.username,
    displayName: c.displayName,
    bio: c.bio,
    avatarUrl: c.avatarUrl,
    bannerUrl: c.bannerUrl,
    isVerified: c.isVerified,
    categories: [...c.categories] as string[],
    subscriptionPrice: c.subscriptionPrice,
    stats: { posts: c.stats.posts, subscribers: c.stats.subscribers, likes: c.stats.likes },
    posts: [] as never[],
  }));

export function HomepageCreators() {
  const [creators, setCreators] = useState<ReturnType<typeof mapApiCreator>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCreators() {
      try {
        const res = await fetch("/api/creators?limit=8");
        if (!res.ok) {
          setCreators(HOMEPAGE_FALLBACK);
          return;
        }
        const json = await res.json();
        const mapped: ReturnType<typeof mapApiCreator>[] = (json.data ?? []).map(mapApiCreator);
        setCreators(mapped.length > 0 ? mapped : HOMEPAGE_FALLBACK);
      } catch {
        setCreators(HOMEPAGE_FALLBACK);
      } finally {
        setLoading(false);
      }
    }
    fetchCreators();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-64 animate-pulse rounded-xl border border-gray-200 bg-gray-50"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
      {creators.map((creator) => (
        <CreatorCard key={creator.username} creator={creator} />
      ))}
    </div>
  );
}
