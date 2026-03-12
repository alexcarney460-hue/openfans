"use client";

import { useState, useMemo } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SearchBar } from "@/components/SearchBar";
import { CategoryFilter } from "@/components/CategoryFilter";
import { CreatorCard } from "@/components/CreatorCard";
import {
  EXPLORE_CREATORS,
  CATEGORIES,
  type CreatorCategory,
} from "./mock-data";

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

  const sortedCreators = useMemo(() => {
    return [...filteredCreators].sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return b.stats.subscribers - a.stats.subscribers;
    });
  }, [filteredCreators]);

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a]">
      <SiteHeader />

      <main className="flex-1 pt-14">
        {/* Search and filters */}
        <div className="border-b border-white/5 bg-black/40">
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

        {/* Creator grid */}
        {sortedCreators.length > 0 ? (
          <section className="py-8">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {sortedCreators.map((creator) => (
                  <CreatorCard key={creator.id} creator={creator} />
                ))}
              </div>
            </div>
          </section>
        ) : (
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
