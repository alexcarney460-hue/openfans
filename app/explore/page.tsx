"use client";

import { useState, useMemo } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SearchBar } from "@/components/SearchBar";
import { CategoryFilter } from "@/components/CategoryFilter";
import { FeaturedCreatorCard } from "@/components/FeaturedCreatorCard";
import { CreatorCard } from "@/components/CreatorCard";
import {
  EXPLORE_CREATORS,
  CATEGORIES,
  type CreatorCategory,
} from "./mock-data";
import { TrendingUp, Sparkles } from "lucide-react";

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CreatorCategory>("All");

  const filteredCreators = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return EXPLORE_CREATORS.filter((creator) => {
      const matchesCategory =
        activeCategory === "All" ||
        creator.primaryCategory === activeCategory ||
        creator.categories.includes(activeCategory);
      const matchesSearch =
        query === "" ||
        creator.displayName.toLowerCase().includes(query) ||
        creator.username.toLowerCase().includes(query) ||
        creator.bio.toLowerCase().includes(query) ||
        creator.categories.some((c) => c.toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, activeCategory]);

  const featuredCreators = useMemo(
    () => filteredCreators.filter((c) => c.isFeatured),
    [filteredCreators]
  );

  const trendingCreators = useMemo(
    () =>
      [...filteredCreators]
        .sort((a, b) => b.stats.subscribers - a.stats.subscribers)
        .slice(0, 9),
    [filteredCreators]
  );

  const newCreators = useMemo(
    () =>
      [...filteredCreators]
        .sort((a, b) => a.stats.subscribers - b.stats.subscribers)
        .slice(0, 6),
    [filteredCreators]
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a]">
      <SiteHeader />

      <main className="flex-1 pt-16">
        {/* Hero section */}
        <section className="mesh-gradient relative overflow-hidden border-b border-white/5 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center text-center">
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Discover <span className="gradient-text">Creators</span>
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-white/50">
                Browse thousands of creators across fitness, trading, music,
                entertainment, and more. Subscribe with crypto. No middlemen.
              </p>
              <div className="mt-8 w-full max-w-xl">
                <SearchBar value={searchQuery} onChange={setSearchQuery} />
              </div>
              <div className="mt-6 w-full max-w-3xl">
                <CategoryFilter
                  categories={CATEGORIES}
                  activeCategory={activeCategory}
                  onSelect={setActiveCategory}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Featured creators */}
        {featuredCreators.length > 0 && (
          <section className="border-b border-white/5 py-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mb-6 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-400" />
                <h2 className="text-xl font-bold text-white">
                  Featured Creators
                </h2>
              </div>
              <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide">
                {featuredCreators.map((creator) => (
                  <FeaturedCreatorCard key={creator.id} creator={creator} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Trending creators */}
        {trendingCreators.length > 0 && (
          <section className="border-b border-white/5 py-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mb-6 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-pink-400" />
                <h2 className="text-xl font-bold text-white">
                  Trending Creators
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {trendingCreators.map((creator) => (
                  <CreatorCard key={creator.id} creator={creator} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* New creators */}
        {newCreators.length > 0 && (
          <section className="py-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mb-6 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-green-400" />
                <h2 className="text-xl font-bold text-white">New Creators</h2>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {newCreators.map((creator) => (
                  <CreatorCard key={creator.id} creator={creator} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Empty state */}
        {filteredCreators.length === 0 && (
          <section className="py-24">
            <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
              <p className="text-lg text-white/40">
                No creators found matching your search.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("All");
                }}
                className="mt-4 text-sm font-medium text-purple-400 transition-colors hover:text-purple-300"
              >
                Clear filters
              </button>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs text-white/30 sm:px-6 lg:px-8">
          OpenFans -- Own Your Content, Own Your Money.
        </div>
      </footer>
    </div>
  );
}
