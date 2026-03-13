import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Lock,
} from "lucide-react";
import {
  getCreator,
  getPost,
  timeAgo,
  formatNumber,
} from "@/lib/mock-data";
import { SubscribeButton } from "@/components/SubscribeButton";
import { PostInteractions } from "@/components/PostInteractions";

interface PageProps {
  params: { username: string; postId: string };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const post = getPost(params.username, params.postId);
  const creator = getCreator(params.username);

  if (!post || !creator) {
    return { title: "Post Not Found | OpenFans" };
  }

  const truncatedText =
    post.text.length > 160 ? `${post.text.slice(0, 157)}...` : post.text;

  return {
    title: `${creator.displayName} on OpenFans`,
    description: truncatedText,
    openGraph: {
      title: `${creator.displayName} on OpenFans`,
      description: truncatedText,
      type: "article",
      url: `https://openfans.online/${creator.username}/post/${post.id}`,
      siteName: "OpenFans",
    },
  };
}

export default function SinglePostPage({ params }: PageProps) {
  const creator = getCreator(params.username);
  const post = getPost(params.username, params.postId);

  if (!creator || !post) {
    notFound();
  }

  const isSubscribed = false;
  const isLocked = post.isPremium && !isSubscribed;

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
            aria-label={`View ${creator.displayName}'s profile`}
          >
            <div className="h-12 w-12 overflow-hidden rounded-full bg-[#00AFF0] p-[2px]">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-gray-100 text-base font-bold text-gray-600">
                {creator.displayName.charAt(0)}
              </div>
            </div>
          </Link>
          <div className="min-w-0 flex-1">
            <Link
              href={`/${creator.username}`}
              className="flex items-center gap-1.5"
            >
              <span className="truncate text-sm font-semibold text-gray-900 hover:underline">
                {creator.displayName}
              </span>
              {creator.isVerified && (
                <BadgeCheck className="h-4 w-4 flex-shrink-0 text-[#00AFF0]" />
              )}
            </Link>
            <p className="text-xs text-gray-400">
              @{creator.username} &middot; {timeAgo(post.createdAt)}
            </p>
          </div>
          {post.isPremium && (
            <span className="flex items-center gap-1 rounded-full bg-[#00AFF0]/10 px-2.5 py-1 text-xs font-medium text-[#00AFF0]">
              <Lock className="h-3 w-3" />
              Premium
            </span>
          )}
        </div>

        {/* Post Content */}
        <div className="mb-4">
          <p
            className={
              isLocked
                ? "text-sm leading-relaxed text-gray-600 line-clamp-3"
                : "text-sm leading-relaxed text-gray-600"
            }
          >
            {post.text}
          </p>
        </div>

        {/* Media */}
        {post.mediaUrl && (
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
                  {post.mediaType === "video" ? "Video Content" : "Image Content"}
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
                    Subscribe to {creator.displayName} to unlock all premium
                    content
                  </p>
                  <SubscribeButton
                    price={creator.subscriptionPrice}
                    size="lg"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Locked text-only posts */}
        {isLocked && !post.mediaUrl && (
          <div className="mb-4 flex flex-col items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 px-6 py-10">
            <div className="rounded-full bg-gray-200 p-4">
              <Lock className="h-8 w-8 text-gray-500" />
            </div>
            <div className="text-center">
              <p className="mb-1 text-base font-semibold text-gray-900">
                Subscribe to see full post
              </p>
              <p className="mb-4 text-sm text-gray-500">
                Subscribe to {creator.displayName} to unlock all premium content
              </p>
              <SubscribeButton
                price={creator.subscriptionPrice}
                size="lg"
              />
            </div>
          </div>
        )}

        {/* Interactive actions and comments (client component) */}
        <PostInteractions
          initialLikes={post.stats.likes}
          initialCommentCount={post.stats.comments}
          initialComments={post.comments}
          isLocked={isLocked}
          postUrl={`/${creator.username}/post/${post.id}`}
        />
      </div>
    </div>
  );
}
