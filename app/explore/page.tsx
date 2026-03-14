"use client";

import { useState, useEffect, useCallback } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SearchBar } from "@/components/SearchBar";
import { CategoryFilter } from "@/components/CategoryFilter";
import { CreatorCard } from "@/components/CreatorCard";
import { CATEGORIES, EXPLORE_CREATORS, type CreatorCategory } from "./mock-data";

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
  readonly post_count?: number;
}

type MappedCreator = {
  readonly username: string;
  readonly displayName: string;
  readonly bio: string;
  readonly avatarUrl: string;
  readonly bannerUrl: string;
  readonly isVerified: boolean;
  readonly categories: readonly string[];
  readonly subscriptionPrice: number;
  readonly stats: {
    readonly posts: number;
    readonly subscribers: number;
    readonly likes: number;
  };
  readonly posts: readonly never[];
};

function mapApiCreator(c: ApiCreator): MappedCreator {
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
      posts: c.post_count ?? 0,
      subscribers: c.total_subscribers ?? 0,
      likes: 0,
    },
    posts: [] as never[],
  };
}

function getFilteredMockCreators(
  category: CreatorCategory,
  search: string,
): MappedCreator[] {
  let filtered = [...EXPLORE_CREATORS];

  if (category !== "All") {
    filtered = filtered.filter((c) =>
      c.categories.some((cat) => cat.toLowerCase() === category.toLowerCase()),
    );
  }

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.displayName.toLowerCase().includes(q) ||
        c.username.toLowerCase().includes(q) ||
        c.bio.toLowerCase().includes(q),
    );
  }

  return filtered.map((c) => ({
    username: c.username,
    displayName: c.displayName,
    bio: c.bio,
    avatarUrl: c.avatarUrl,
    bannerUrl: c.bannerUrl,
    isVerified: c.isVerified,
    categories: c.categories as readonly string[],
    subscriptionPrice: c.subscriptionPrice,
    stats: c.stats,
    posts: [] as never[],
  }));
}

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CreatorCategory>("All");
  const [creators, setCreators] = useState<MappedCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        // API failed -- fall back to mock data
        setError(null);
        setCreators(getFilteredMockCreators(activeCategory, searchQuery));
        return;
      }
      setError(null);
      const json = await res.json();
      const mapped: MappedCreator[] = (json.data ?? []).map(mapApiCreator);
      const mockCreators = getFilteredMockCreators(activeCategory, searchQuery);
      // Show real creators first, then fill with mock data so the page looks populated
      const realUsernames = new Set(mapped.map((c) => c.username.toLowerCase()));
      const filteredMock = mockCreators.filter(
        (c) => !realUsernames.has(c.username.toLowerCase()),
      );
      setCreators([...mapped, ...filteredMock]);
    } catch {
      // Network error -- fall back to mock data
      setError(null);
      setCreators(getFilteredMockCreators(activeCategory, searchQuery));
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
          <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
            <div className="flex flex-col items-center gap-3 sm:gap-4">
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

        {/* Error state */}
        {error && !loading && (
          <section className="py-12">
            <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          </section>
        )}

        {/* Loading state */}
        {loading ? (
          <section className="py-24">
            <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
              <div className="flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#00AFF0]" />
              </div>
              <p className="mt-4 text-sm text-gray-400">Loading creators...</p>
            </div>
          </section>
        ) : creators.length > 0 ? (
          <section className="py-4 sm:py-8">
            <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-3">
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
