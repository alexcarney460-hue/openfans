"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SearchBar } from "@/components/SearchBar";
import { CategoryFilter } from "@/components/CategoryFilter";
import { CreatorCard } from "@/components/CreatorCard";
import { SortSelect, type SortOption } from "@/components/SortSelect";
import { CATEGORIES, EXPLORE_CREATORS } from "./mock-data";
import { TrendingUp } from "lucide-react";

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
  readonly total_earnings_usdc?: number;
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
  readonly isFeatured: boolean;
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
    isFeatured: c.is_featured ?? false,
    stats: {
      posts: c.post_count ?? 0,
      subscribers: c.total_subscribers ?? 0,
      likes: 0,
    },
    posts: [] as never[],
  };
}

function mapMockCreator(c: (typeof EXPLORE_CREATORS)[number]): MappedCreator {
  return {
    username: c.username,
    displayName: c.displayName,
    bio: c.bio,
    avatarUrl: c.avatarUrl,
    bannerUrl: c.bannerUrl,
    isVerified: c.isVerified,
    categories: c.categories as readonly string[],
    subscriptionPrice: c.subscriptionPrice,
    isFeatured: c.isFeatured,
    stats: c.stats,
    posts: [] as never[],
  };
}

function getFilteredMockCreators(
  category: string,
  search: string,
  sort: SortOption,
): MappedCreator[] {
  let filtered = EXPLORE_CREATORS.map(mapMockCreator);

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

  // Sort mock data
  const sorted = [...filtered];
  switch (sort) {
    case "new":
      // Mock data doesn't have created_at, reverse the array as approximation
      sorted.reverse();
      break;
    case "earnings":
      sorted.sort((a, b) => b.subscriptionPrice * b.stats.subscribers - a.subscriptionPrice * a.stats.subscribers);
      break;
    case "popular":
    default:
      sorted.sort((a, b) => b.stats.subscribers - a.stats.subscribers);
      break;
  }

  return sorted;
}

function getFeaturedMockCreators(): MappedCreator[] {
  const featured = EXPLORE_CREATORS.filter((c) => c.isFeatured).map(mapMockCreator);
  if (featured.length > 0) return featured.slice(0, 5);
  // Fallback: top 3 by subscribers
  return [...EXPLORE_CREATORS]
    .sort((a, b) => b.stats.subscribers - a.stats.subscribers)
    .slice(0, 3)
    .map(mapMockCreator);
}

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [sortOption, setSortOption] = useState<SortOption>("popular");
  const [creators, setCreators] = useState<MappedCreator[]>([]);
  const [featuredCreators, setFeaturedCreators] = useState<MappedCreator[]>([]);
  const [dynamicCategories, setDynamicCategories] = useState<readonly string[]>(CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch featured creators once on mount
  useEffect(() => {
    async function fetchFeatured() {
      try {
        const res = await fetch("/api/creators?featured=true&limit=5&sort=popular");
        if (!res.ok) {
          setFeaturedCreators(getFeaturedMockCreators());
          return;
        }
        const json = await res.json();
        const mapped = (json.data ?? []).map(mapApiCreator);
        if (mapped.length > 0) {
          setFeaturedCreators(mapped);
        } else {
          setFeaturedCreators(getFeaturedMockCreators());
        }
      } catch {
        setFeaturedCreators(getFeaturedMockCreators());
      }
    }
    fetchFeatured();
  }, []);

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
      params.set("sort", sortOption);
      params.set("limit", "40");
      const res = await fetch(`/api/creators?${params.toString()}`);
      if (!res.ok) {
        setError(null);
        setCreators(getFilteredMockCreators(activeCategory, searchQuery, sortOption));
        return;
      }
      setError(null);
      const json = await res.json();
      const mapped: MappedCreator[] = (json.data ?? []).map(mapApiCreator);

      // Update dynamic categories from API if available
      if (json.categories && Array.isArray(json.categories) && json.categories.length > 0) {
        const apiCats: string[] = ["All", ...json.categories];
        setDynamicCategories(apiCats);
      }

      const mockCreators = getFilteredMockCreators(activeCategory, searchQuery, sortOption);
      const realUsernames = new Set(mapped.map((c) => c.username.toLowerCase()));
      const filteredMock = mockCreators.filter(
        (c) => !realUsernames.has(c.username.toLowerCase()),
      );
      setCreators([...mapped, ...filteredMock]);
    } catch {
      setError(null);
      setCreators(getFilteredMockCreators(activeCategory, searchQuery, sortOption));
    } finally {
      setLoading(false);
    }
  }, [activeCategory, searchQuery, sortOption]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchCreators();
    }, 300);
    return () => clearTimeout(timeout);
  }, [fetchCreators]);

  // Determine if we should show the featured/trending section
  const showFeatured = !searchQuery.trim() && activeCategory === "All" && featuredCreators.length > 0;

  // Build the set of featured usernames to avoid duplication in the main grid
  const featuredUsernames = useMemo(() => {
    if (!showFeatured) return new Set<string>();
    return new Set(featuredCreators.map((c) => c.username.toLowerCase()));
  }, [showFeatured, featuredCreators]);

  const mainCreators = useMemo(() => {
    if (!showFeatured) return creators;
    return creators.filter((c) => !featuredUsernames.has(c.username.toLowerCase()));
  }, [creators, showFeatured, featuredUsernames]);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader />

      <main className="flex-1 pt-14">
        {/* Search, filters, and sort */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
            <div className="flex flex-col items-center gap-3 sm:gap-4">
              <div className="w-full max-w-xl">
                <SearchBar value={searchQuery} onChange={setSearchQuery} />
              </div>
              <div className="flex w-full max-w-4xl flex-col items-center gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="w-full max-w-3xl overflow-hidden">
                  <CategoryFilter
                    categories={dynamicCategories}
                    activeCategory={activeCategory}
                    onSelect={setActiveCategory}
                  />
                </div>
                <div className="shrink-0">
                  <SortSelect value={sortOption} onChange={setSortOption} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Featured / Trending Section */}
        {showFeatured && !loading && (
          <section className="border-b border-gray-100 bg-gradient-to-b from-gray-50/50 to-white py-6 sm:py-8">
            <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
              <div className="mb-4 flex items-center gap-2 sm:mb-6">
                <div className="flex items-center gap-2 rounded-full bg-[#00AFF0]/10 px-3 py-1.5">
                  <TrendingUp className="h-4 w-4 text-[#00AFF0]" />
                  <span className="text-sm font-semibold text-[#00AFF0]">
                    {featuredCreators.some((c) => c.isFeatured) ? "Featured" : "Trending"}
                  </span>
                </div>
                <span className="text-sm text-gray-400">
                  Top creators right now
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-5">
                {featuredCreators.slice(0, 5).map((creator) => (
                  <CreatorCard
                    key={creator.username}
                    creator={creator}
                    isTrending
                  />
                ))}
              </div>
            </div>
          </section>
        )}

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
        ) : mainCreators.length > 0 ? (
          <section className="py-4 sm:py-8">
            <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
              {/* Results count */}
              <div className="mb-3 flex items-center justify-between sm:mb-5">
                <p className="text-sm text-gray-400">
                  {mainCreators.length} creator{mainCreators.length !== 1 ? "s" : ""}
                  {searchQuery.trim() ? ` matching "${searchQuery.trim()}"` : ""}
                  {activeCategory !== "All" ? ` in ${activeCategory}` : ""}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-3">
                {mainCreators.map((creator) => (
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
                  setSortOption("popular");
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
