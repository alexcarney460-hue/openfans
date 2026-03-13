"use client";

import { useState, useEffect, useCallback } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SearchBar } from "@/components/SearchBar";
import { CategoryFilter } from "@/components/CategoryFilter";
import { CreatorCard } from "@/components/CreatorCard";
import { CATEGORIES, type CreatorCategory } from "./mock-data";

interface ApiCreator {
  readonly id: string;
  readonly username: string;
  readonly display_name: string;
  readonly bio: string | null;
  readonly avatar_url: string | null;
  readonly banner_url: string | null;
  readonly is_verified: boolean;
  readonly wallet_address: string | null;
  readonly created_at: string;
  readonly profile_id: number;
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

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CreatorCategory>("All");
  const [creators, setCreators] = useState<ReturnType<typeof mapApiCreator>[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCreators = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeCategory !== "All") {
        params.set("category", activeCategory);
      }
      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }
      params.set("limit", "40");
      const res = await fetch(`/api/creators?${params.toString()}`);
      if (!res.ok) {
        setCreators([]);
        return;
      }
      const json = await res.json();
      const mapped = (json.data ?? []).map(mapApiCreator);
      setCreators(mapped);
    } catch {
      setCreators([]);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, searchQuery]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchCreators();
    }, 300);
    return () => clearTimeout(timeout);
  }, [fetchCreators]);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader />

      <main className="flex-1 pt-14">
        {/* Search and filters */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center gap-4">
              <div className="w-full max-w-xl">
                <SearchBar value={searchQuery} onChange={setSearchQuery} />
              </div>
              <div className="w-full max-w-3xl">
                <CategoryFilter
                  categories={CATEGORIES}
                  activeCategory={activeCategory}
                  onSelect={setActiveCategory}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {loading ? (
          <section className="py-24">
            <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
              <p className="text-lg text-gray-400">Loading creators...</p>
            </div>
          </section>
        ) : creators.length > 0 ? (
          <section className="py-8">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {creators.map((creator) => (
                  <CreatorCard key={creator.username} creator={creator} />
                ))}
              </div>
            </div>
          </section>
        ) : (
          <section className="py-24">
            <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
              <p className="text-lg text-gray-400">
                No creators found matching your search.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("All");
                }}
                className="mt-4 text-sm font-medium text-[#00AFF0] transition-colors hover:text-[#00AFF0]/80"
              >
                Clear filters
              </button>
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
