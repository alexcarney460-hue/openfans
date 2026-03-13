"use client";

import { useEffect, useState } from "react";
import { CreatorCard } from "@/components/CreatorCard";

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

export function HomepageCreators() {
  const [creators, setCreators] = useState<ReturnType<typeof mapApiCreator>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCreators() {
      try {
        const res = await fetch("/api/creators?limit=4");
        if (!res.ok) return;
        const json = await res.json();
        setCreators((json.data ?? []).map(mapApiCreator));
      } catch {
        // silently fail on homepage
      } finally {
        setLoading(false);
      }
    }
    fetchCreators();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-64 animate-pulse rounded-xl border border-gray-200 bg-gray-50"
          />
        ))}
      </div>
    );
  }

  if (creators.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-gray-400">
        No creators to show yet.
      </p>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {creators.map((creator) => (
        <CreatorCard key={creator.username} creator={creator} />
      ))}
    </div>
  );
}
