"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  Search,
  Sparkles,
  Users,
  Bot,
  ArrowRight,
  Loader2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AiCreator {
  readonly id: string;
  readonly name: string;
  readonly username: string;
  readonly bio: string | null;
  readonly avatar_url: string | null;
  readonly banner_url: string | null;
  readonly source_platform: string;
  readonly categories: string[];
  readonly follower_count: number;
  readonly is_claimed: boolean;
  readonly is_featured: boolean;
  readonly request_count: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_TABS = [
  "All",
  "AI Fashion",
  "AI Art",
  "AI Companion",
  "AI Fitness",
  "AI Lifestyle",
] as const;

type CategoryTab = (typeof CATEGORY_TABS)[number];

// ---------------------------------------------------------------------------
// Follower count formatter
// ---------------------------------------------------------------------------

function formatFollowers(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  }
  return String(count);
}

// ---------------------------------------------------------------------------
// AI Creator Card
// ---------------------------------------------------------------------------

function AiCreatorCard({ creator }: { readonly creator: AiCreator }) {
  const requestUrl = `/request-creator?username=${encodeURIComponent(creator.username)}&name=${encodeURIComponent(creator.name)}`;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-300 hover:border-violet-300/60 hover:shadow-lg hover:shadow-violet-500/5 hover:-translate-y-1">
      {/* Banner */}
      <div className="relative h-28 w-full overflow-hidden sm:h-32">
        {creator.banner_url ? (
          <img
            src={creator.banner_url}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-violet-500/20 to-purple-600/30" />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* AI Badge */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full bg-violet-600/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
          <Bot className="h-3 w-3" />
          AI
        </div>

        {/* Featured badge */}
        {creator.is_featured && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full bg-amber-500/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
            <Sparkles className="h-3 w-3" />
            Featured
          </div>
        )}
      </div>

      {/* Avatar */}
      <div className="relative -mt-8 ml-4 sm:-mt-9 sm:ml-5">
        <div className="relative h-16 w-16 overflow-hidden rounded-xl border-[3px] border-white bg-white shadow-md sm:h-[72px] sm:w-[72px]">
          {creator.avatar_url ? (
            <img
              src={creator.avatar_url}
              alt={creator.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-400 to-purple-600 text-xl font-bold text-white">
              {creator.name.charAt(0)}
            </div>
          )}
          {/* AI ring accent */}
          <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-violet-400/20" />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-4 pt-2 sm:px-5 sm:pb-5 sm:pt-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-gray-900 sm:text-base">
              {creator.name}
            </h3>
            <p className="text-xs text-gray-400">@{creator.username}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-500 sm:text-xs">
            <Users className="h-3 w-3" />
            {formatFollowers(creator.follower_count)}
          </div>
        </div>

        {/* Bio */}
        {creator.bio && (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-gray-500 sm:text-sm">
            {creator.bio}
          </p>
        )}

        {/* Categories */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {creator.categories.slice(0, 3).map((cat) => (
            <span
              key={cat}
              className="inline-flex items-center rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-600 sm:text-xs"
            >
              {cat.replace("AI ", "")}
            </span>
          ))}
        </div>

        {/* Action */}
        <div className="mt-3 sm:mt-4">
          {creator.is_claimed ? (
            <Link href={`/${creator.username}`} className="block">
              <button className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-xs font-semibold text-white shadow-sm transition-all hover:from-violet-700 hover:to-purple-700 hover:shadow-md sm:h-10 sm:text-sm">
                <Zap className="h-3.5 w-3.5" />
                Subscribe
              </button>
            </Link>
          ) : (
            <Link href={requestUrl} className="block">
              <button className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-violet-300 text-xs font-semibold text-violet-600 transition-all hover:bg-violet-50 hover:border-violet-400 sm:h-10 sm:text-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Request
                {creator.request_count > 0 && (
                  <span className="ml-1 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-700">
                    {creator.request_count}
                  </span>
                )}
              </button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function AiCreatorsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryTab>("All");
  const [creators, setCreators] = useState<AiCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

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
      params.set("sort", "popular");
      params.set("limit", "50");

      const res = await fetch(`/api/ai-creators?${params.toString()}`);
      if (!res.ok) {
        setCreators([]);
        return;
      }

      const json = await res.json();
      setCreators(json.data ?? []);
      setTotalCount(json.meta?.total ?? 0);
    } catch {
      setCreators([]);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, searchQuery]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchCreators();
    }, 250);
    return () => clearTimeout(timeout);
  }, [fetchCreators]);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader />

      <main className="flex-1 pt-14">
        {/* ==================== HERO ==================== */}
        <section className="relative overflow-hidden pb-8 pt-12 sm:pb-14 sm:pt-20 lg:pt-24">
          {/* Background effects */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full opacity-[0.06] blur-3xl"
            style={{
              background:
                "radial-gradient(ellipse, #8B5CF6 0%, #6D28D9 30%, transparent 70%)",
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-20 right-0 h-[300px] w-[300px] rounded-full opacity-[0.04] blur-3xl"
            style={{
              background: "radial-gradient(circle, #00AFF0 0%, transparent 70%)",
            }}
          />

          <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            {/* Badge */}
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-300/30 bg-violet-50 px-4 py-1.5 text-xs font-medium tracking-wide text-violet-600 sm:text-sm">
              <Bot className="h-3.5 w-3.5" />
              The Future of Creator Content
            </div>

            <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-4xl md:text-5xl lg:text-6xl">
              AI Creators on{" "}
              <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                OpenFans
              </span>
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-gray-500 sm:mt-5 sm:text-base md:text-lg">
              The future of creator content. Browse AI personas, subscribe to
              your favorites, and experience the next generation of digital
              creators.
            </p>

            {/* Stats bar */}
            <div className="mx-auto mt-6 flex max-w-md flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-400 sm:mt-8 sm:text-sm">
              <span className="flex items-center gap-1.5">
                <Bot className="h-3.5 w-3.5 text-violet-500" />
                <strong className="text-gray-600">{totalCount}+</strong> AI
                Creators
              </span>
              <span className="text-gray-200">|</span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                <strong className="text-gray-600">5</strong> Categories
              </span>
              <span className="text-gray-200">|</span>
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-violet-500" />
                Growing daily
              </span>
            </div>
          </div>
        </section>

        {/* ==================== SEARCH + FILTERS ==================== */}
        <section className="border-b border-gray-200 bg-gray-50/70">
          <div className="mx-auto max-w-6xl px-3 py-4 sm:px-6 sm:py-5 lg:px-8">
            {/* Search */}
            <div className="mx-auto max-w-xl">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Search className="h-4 w-4 text-gray-300" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search AI creators..."
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-300 shadow-sm transition-all focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                />
              </div>
            </div>

            {/* Category tabs */}
            <div className="mt-4 flex justify-center">
              <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                {CATEGORY_TABS.map((tab) => {
                  const isActive = activeCategory === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveCategory(tab)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all sm:px-4 sm:py-2 sm:text-sm ${
                        isActive
                          ? "bg-violet-600 text-white shadow-sm"
                          : "bg-white text-gray-500 border border-gray-200 hover:border-violet-300 hover:text-violet-600"
                      }`}
                    >
                      {tab === "All" ? "All" : tab.replace("AI ", "")}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ==================== GRID ==================== */}
        {loading ? (
          <section className="py-24">
            <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
              </div>
              <p className="mt-4 text-sm text-gray-400">
                Loading AI creators...
              </p>
            </div>
          </section>
        ) : creators.length > 0 ? (
          <section className="py-6 sm:py-10">
            <div className="mx-auto max-w-6xl px-3 sm:px-6 lg:px-8">
              {/* Results count */}
              <div className="mb-4 flex items-center justify-between sm:mb-6">
                <p className="text-sm text-gray-400">
                  {creators.length} AI creator
                  {creators.length !== 1 ? "s" : ""}
                  {searchQuery.trim()
                    ? ` matching "${searchQuery.trim()}"`
                    : ""}
                  {activeCategory !== "All"
                    ? ` in ${activeCategory.replace("AI ", "")}`
                    : ""}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
                {creators.map((creator) => (
                  <AiCreatorCard key={creator.id} creator={creator} />
                ))}
              </div>
            </div>
          </section>
        ) : (
          <section className="py-24">
            <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
              <Bot className="mx-auto h-12 w-12 text-gray-200" />
              <p className="mt-4 text-lg text-gray-400">
                No AI creators found matching your search.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("All");
                }}
                className="mt-4 text-sm font-medium text-violet-600 transition-colors hover:text-violet-500"
              >
                Clear filters
              </button>
            </div>
          </section>
        )}

        {/* ==================== CREATE YOUR OWN CTA ==================== */}
        <section className="border-t border-gray-200 bg-gradient-to-b from-gray-50 to-white py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-50 via-white to-purple-50 p-8 shadow-sm sm:p-12">
              {/* Decorative glow */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-400/10 blur-3xl"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-purple-400/10 blur-3xl"
              />

              <div className="relative">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100">
                  <Bot className="h-7 w-7 text-violet-600" />
                </div>

                <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                  Create Your Own AI Creator
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-gray-500 sm:text-base">
                  Launch your AI persona on OpenFans. Set your own pricing,
                  build an audience, and earn from AI-generated content.
                </p>

                <div className="mt-6">
                  <Link href="/signup">
                    <Button
                      size="lg"
                      className="h-11 border-0 bg-gradient-to-r from-violet-600 to-purple-600 px-8 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all hover:from-violet-700 hover:to-purple-700 hover:shadow-violet-500/30 sm:h-12 sm:px-10 sm:text-base"
                    >
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                <p className="mt-4 text-xs text-gray-400">
                  15% platform fee for AI-generated content. Instant payouts.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
