"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  BadgeCheck,
  FileText,
  Users,
  Heart,
  ArrowLeft,
  Lock,
  DollarSign,
} from "lucide-react";
import { CreatorSubscribeSection } from "@/components/CreatorSubscribeSection";
import { TipModal } from "@/components/TipModal";
import { PPVUnlockModal } from "@/components/PPVUnlockModal";

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface ApiCreatorData {
  readonly id: string;
  readonly username: string;
  readonly display_name: string;
  readonly bio: string | null;
  readonly avatar_url: string | null;
  readonly banner_url: string | null;
  readonly is_verified: boolean;
  readonly created_at: string;
  readonly profile_id: number;
  readonly subscription_price_usdc: number;
  readonly total_subscribers: number;
  readonly categories: string[];
  readonly is_featured: boolean;
  readonly subscriber_count: number;
  readonly post_count: number;
  readonly recent_posts: readonly ApiPost[];
}

interface ApiPost {
  readonly id: number;
  readonly creator_id: string;
  readonly title: string | null;
  readonly body: string | null;
  readonly media_urls: string[];
  readonly media_type: string;
  readonly is_free: boolean;
  readonly tier: string;
  readonly likes_count: number;
  readonly comments_count: number;
  readonly created_at: string;
  readonly is_locked?: boolean;
  readonly is_ppv?: boolean;
  readonly ppv_price_usdc?: number | null;
  readonly has_purchased?: boolean;
}

export default function CreatorProfilePage() {
  const params = useParams<{ username: string }>();
  const [creator, setCreator] = useState<ApiCreatorData | null>(null);
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [ppvTarget, setPpvTarget] = useState<ApiPost | null>(null);

  useEffect(() => {
    async function fetchCreator() {
      try {
        const res = await fetch(`/api/creators/${params.username}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const json = await res.json();
        setCreator(json.data);

        // Fetch full post feed with PPV access info
        const postsRes = await fetch(
          `/api/posts?creator_id=${json.data.id}&limit=50`,
        );
        if (postsRes.ok) {
          const postsJson = await postsRes.json();
          setPosts(postsJson.data ?? []);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    fetchCreator();
  }, [params.username]);

  const handlePpvUnlocked = (unlockedPost: Record<string, unknown>) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === unlockedPost.id
          ? ({ ...p, ...unlockedPost, is_locked: false, has_purchased: true } as ApiPost)
          : p,
      ),
    );
    setPpvTarget(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#00AFF0]" />
        <p className="mt-4 text-sm text-gray-400">Loading profile...</p>
      </div>
    );
  }

  if (notFound || !creator) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 gap-4">
        <p className="text-lg font-medium text-gray-600">Creator not found</p>
        <Link href="/explore" className="text-sm text-[#00AFF0] hover:underline">
          Browse creators
        </Link>
      </div>
    );
  }

  const subscriptionPrice = (creator.subscription_price_usdc ?? 0) / 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b border-gray-200 bg-white/80 px-4 backdrop-blur-xl">
        <Link
          href="/"
          className="flex items-center gap-2 text-gray-500 transition-colors hover:text-gray-900"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="truncate text-sm font-bold text-gray-900">
              {creator.display_name}
            </h1>
            {creator.is_verified && (
              <BadgeCheck className="h-4 w-4 flex-shrink-0 fill-[#00AFF0] text-white" />
            )}
          </div>
          <p className="text-xs text-gray-400">
            {formatNumber(creator.post_count)} posts
          </p>
        </div>
      </nav>

      {/* Banner */}
      <div className="relative h-48 w-full sm:h-64 md:h-72 lg:h-80">
        <div className="h-full w-full bg-gradient-to-br from-[#0f1923] via-[#151a2e] to-[#1a1a2e]" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-transparent to-transparent" />
      </div>

      {/* Profile Section */}
      <div className="relative mx-auto max-w-2xl px-4">
        {/* Avatar */}
        <div className="-mt-16 mb-4 flex items-end justify-between sm:-mt-20">
          <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-gray-50 sm:h-32 sm:w-32">
            {creator.avatar_url ? (
              <img
                src={creator.avatar_url}
                alt={creator.display_name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-full bg-gray-200 text-3xl font-bold text-gray-600 sm:text-4xl">
                {creator.display_name.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 pb-1">
            <button
              onClick={() => setShowTipModal(true)}
              className="flex items-center gap-1.5 rounded-lg border border-[#10b981] px-4 py-2 text-sm font-semibold text-[#10b981] transition-colors hover:bg-[#10b981]/10"
            >
              <DollarSign className="h-4 w-4" />
              Tip
            </button>
            <CreatorSubscribeSection
              creatorId={creator.id}
              creatorName={creator.display_name}
              creatorUsername={creator.username}
              subscriptionPrice={subscriptionPrice}
            />
          </div>
        </div>

        {/* Creator Info */}
        <div className="mb-4">
          <div className="mb-1 flex items-center gap-2">
            <h2 className="text-2xl font-bold text-gray-900">
              {creator.display_name}
            </h2>
            {creator.is_verified && (
              <BadgeCheck className="h-5 w-5 fill-[#00AFF0] text-white" />
            )}
          </div>
          <p className="mb-3 text-sm text-gray-400">@{creator.username}</p>
          <p className="text-sm leading-relaxed text-gray-600">
            {creator.bio}
          </p>
        </div>

        {/* Stats Row */}
        <div className="mb-4 flex items-center gap-6">
          <div className="flex items-center gap-1.5 text-sm">
            <FileText className="h-4 w-4 text-gray-300" />
            <span className="font-semibold text-gray-900">
              {formatNumber(creator.post_count)}
            </span>
            <span className="text-gray-400">posts</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <Users className="h-4 w-4 text-gray-300" />
            <span className="font-semibold text-gray-900">
              {formatNumber(creator.subscriber_count)}
            </span>
            <span className="text-gray-400">subscribers</span>
          </div>
        </div>

        {/* Categories */}
        {creator.categories && creator.categories.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {creator.categories.map((category) => (
              <span
                key={category}
                className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-500"
              >
                {category}
              </span>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="mb-6 border-t border-gray-200" />

        {/* Content Feed */}
        <section aria-label="Posts feed">
          <div className="space-y-4 pb-16">
            {posts.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-400">
                No posts yet.
              </p>
            ) : (
              posts.map((post) => {
                const isLocked = post.is_locked === true;
                const isPpv = post.is_ppv === true;
                const canUnlockViaPpv = isLocked && isPpv && !post.has_purchased;
                const ppvPriceDollars =
                  post.ppv_price_usdc != null ? (post.ppv_price_usdc / 100).toFixed(2) : null;

                return (
                  <article
                    key={post.id}
                    className="rounded-xl border border-gray-200 bg-white transition-colors hover:border-gray-300"
                  >
                    <div className="flex items-center gap-3 p-4 pb-3">
                      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gray-200">
                        {creator.avatar_url ? (
                          <img
                            src={creator.avatar_url}
                            alt={creator.display_name}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-gray-600">
                            {creator.display_name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="truncate text-sm font-semibold text-gray-900">
                          {creator.display_name}
                        </span>
                        <p className="text-xs text-gray-400">{timeAgo(post.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {!post.is_free && post.tier !== "free" && (
                          <span className="flex items-center gap-1 rounded-full bg-[#00AFF0]/10 px-2.5 py-1 text-xs font-medium text-[#00AFF0]">
                            <Lock className="h-3 w-3" />
                            {post.tier}
                          </span>
                        )}
                        {isPpv && (
                          <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600">
                            <DollarSign className="h-3 w-3" />
                            PPV
                          </span>
                        )}
                      </div>
                    </div>

                    {isLocked ? (
                      <div className="relative px-4 pb-3">
                        {/* Blurred placeholder content */}
                        <div className="select-none blur-sm" aria-hidden="true">
                          <p className="mb-1 text-sm font-semibold text-gray-900">
                            {post.title ?? "Exclusive Content"}
                          </p>
                          <p className="text-sm leading-relaxed text-gray-600">
                            This content is locked. Subscribe or purchase to view.
                          </p>
                        </div>
                        {/* Overlay with unlock option */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-[2px]">
                          <Lock className="mb-2 h-6 w-6 text-gray-300" />
                          {canUnlockViaPpv ? (
                            <button
                              onClick={() => setPpvTarget(post)}
                              className="rounded-lg bg-[#00AFF0] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#009ad6] active:scale-[0.98]"
                            >
                              Unlock for ${ppvPriceDollars} USDC
                            </button>
                          ) : (
                            <p className="text-xs text-gray-400">
                              Subscribe to unlock
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="px-4 pb-3">
                        {post.title && (
                          <p className="mb-1 text-sm font-semibold text-gray-900">{post.title}</p>
                        )}
                        <p className="text-sm leading-relaxed text-gray-600">
                          {post.body ?? ""}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-6 border-t border-gray-200 px-4 py-3">
                      <span className="flex items-center gap-1.5 text-gray-400">
                        <Heart className="h-4 w-4" />
                        <span className="text-xs">{formatNumber(post.likes_count)}</span>
                      </span>
                      {isPpv && ppvPriceDollars && !isLocked && post.has_purchased && (
                        <span className="ml-auto text-xs text-green-500">Purchased</span>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Tip Modal */}
      {creator.id && (
        <TipModal
          isOpen={showTipModal}
          onClose={() => setShowTipModal(false)}
          creatorName={creator.display_name}
          creatorUsername={creator.username}
          creatorId={creator.id}
        />
      )}

      {/* PPV Unlock Modal */}
      {ppvTarget && ppvTarget.ppv_price_usdc != null && (
        <PPVUnlockModal
          isOpen={ppvTarget !== null}
          onClose={() => setPpvTarget(null)}
          onUnlocked={handlePpvUnlocked}
          postId={ppvTarget.id}
          postTitle={ppvTarget.title}
          priceUsdc={ppvTarget.ppv_price_usdc}
        />
      )}
    </div>
  );
}
