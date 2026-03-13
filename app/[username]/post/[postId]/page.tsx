"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Lock,
} from "lucide-react";
import { SubscribeButton } from "@/components/SubscribeButton";
import { PostInteractions } from "@/components/PostInteractions";

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
}

interface ApiCreator {
  readonly display_name: string;
  readonly username: string;
  readonly avatar_url: string | null;
  readonly is_verified: boolean;
  readonly subscription_price_usdc: number;
}

export default function SinglePostPage() {
  const params = useParams<{ username: string; postId: string }>();
  const [post, setPost] = useState<ApiPost | null>(null);
  const [creator, setCreator] = useState<ApiCreator | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [postRes, creatorRes] = await Promise.all([
          fetch(`/api/posts/${params.postId}`),
          fetch(`/api/creators/${params.username}`),
        ]);

        if (postRes.status === 404 || creatorRes.status === 404) {
          setNotFound(true);
          return;
        }

        if (!postRes.ok || !creatorRes.ok) {
          setNotFound(true);
          return;
        }

        const postJson = await postRes.json();
        const creatorJson = await creatorRes.json();
        setPost(postJson.data);
        setCreator(creatorJson.data);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params.postId, params.username]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-400">Loading post...</p>
      </div>
    );
  }

  if (notFound || !post || !creator) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 gap-4">
        <p className="text-lg font-medium text-gray-600">Post not found</p>
        <Link href={`/${params.username}`} className="text-sm text-[#00AFF0] hover:underline">
          Back to profile
        </Link>
      </div>
    );
  }

  const isLocked = post.is_locked === true;
  const subscriptionPrice = (creator.subscription_price_usdc ?? 0) / 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b border-gray-200 bg-white/80 px-4 backdrop-blur-xl">
        <Link
          href={`/${creator.username}`}
          className="flex items-center gap-2 text-gray-500 transition-colors hover:text-gray-900"
          aria-label="Back to profile"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-sm font-bold text-gray-900">Post</h1>
      </nav>

      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Post Header */}
        <div className="mb-4 flex items-center gap-3">
          <Link
            href={`/${creator.username}`}
            className="flex-shrink-0"
            aria-label={`View ${creator.display_name}'s profile`}
          >
            <div className="h-12 w-12 overflow-hidden rounded-full bg-[#00AFF0] p-[2px]">
              {creator.avatar_url ? (
                <img
                  src={creator.avatar_url}
                  alt={creator.display_name}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-gray-100 text-base font-bold text-gray-600">
                  {creator.display_name.charAt(0)}
                </div>
              )}
            </div>
          </Link>
          <div className="min-w-0 flex-1">
            <Link
              href={`/${creator.username}`}
              className="flex items-center gap-1.5"
            >
              <span className="truncate text-sm font-semibold text-gray-900 hover:underline">
                {creator.display_name}
              </span>
              {creator.is_verified && (
                <BadgeCheck className="h-4 w-4 flex-shrink-0 text-[#00AFF0]" />
              )}
            </Link>
            <p className="text-xs text-gray-400">
              @{creator.username} &middot; {timeAgo(post.created_at)}
            </p>
          </div>
          {!post.is_free && post.tier !== "free" && (
            <span className="flex items-center gap-1 rounded-full bg-[#00AFF0]/10 px-2.5 py-1 text-xs font-medium text-[#00AFF0]">
              <Lock className="h-3 w-3" />
              {post.tier}
            </span>
          )}
        </div>

        {/* Post Content */}
        <div className="mb-4">
          {post.title && (
            <h2 className="mb-2 text-base font-semibold text-gray-900">{post.title}</h2>
          )}
          <p
            className={
              isLocked
                ? "text-sm leading-relaxed text-gray-600 line-clamp-3"
                : "text-sm leading-relaxed text-gray-600"
            }
          >
            {post.body ?? ""}
          </p>
        </div>

        {/* Media */}
        {post.media_urls && post.media_urls.length > 0 && (
          <div className="relative mb-4 overflow-hidden rounded-xl">
            <div
              className={
                isLocked
                  ? "flex aspect-video items-center justify-center bg-gray-100 blur-xl"
                  : "flex aspect-video items-center justify-center bg-gray-100"
              }
            >
              <div className="flex h-full w-full items-center justify-center bg-[#00AFF0]/10">
                <span className="text-sm text-gray-300">
                  {post.media_type === "video" ? "Video Content" : "Image Content"}
                </span>
              </div>
            </div>
            {isLocked && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/40 backdrop-blur-sm">
                <div className="rounded-full bg-white/10 p-4">
                  <Lock className="h-8 w-8 text-white" />
                </div>
                <div className="text-center">
                  <p className="mb-1 text-base font-semibold text-white">
                    This content is for subscribers only
                  </p>
                  <p className="mb-4 text-sm text-white/50">
                    Subscribe to {creator.display_name} to unlock all premium
                    content
                  </p>
                  <SubscribeButton
                    price={subscriptionPrice}
                    size="lg"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Locked text-only posts */}
        {isLocked && (!post.media_urls || post.media_urls.length === 0) && (
          <div className="mb-4 flex flex-col items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 px-6 py-10">
            <div className="rounded-full bg-gray-200 p-4">
              <Lock className="h-8 w-8 text-gray-500" />
            </div>
            <div className="text-center">
              <p className="mb-1 text-base font-semibold text-gray-900">
                Subscribe to see full post
              </p>
              <p className="mb-4 text-sm text-gray-500">
                Subscribe to {creator.display_name} to unlock all premium content
              </p>
              <SubscribeButton
                price={subscriptionPrice}
                size="lg"
              />
            </div>
          </div>
        )}

        {/* Interactive actions and comments */}
        <PostInteractions
          initialLikes={post.likes_count}
          initialCommentCount={post.comments_count}
          initialComments={[]}
          isLocked={isLocked}
          postUrl={`/${creator.username}/post/${post.id}`}
        />
      </div>
    </div>
  );
}
