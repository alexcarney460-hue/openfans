import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Heart,
  MessageCircle,
  Share2,
  Lock,
  Send,
} from "lucide-react";
import {
  getCreator,
  getPost,
  formatNumber,
  timeAgo,
} from "@/lib/mock-data";
import { SubscribeButton } from "@/components/SubscribeButton";

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
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b border-white/5 bg-[#0a0a0a]/80 px-4 backdrop-blur-xl">
        <Link
          href={`/${creator.username}`}
          className="flex items-center gap-2 text-white/60 transition-colors hover:text-white"
          aria-label="Back to profile"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-sm font-bold text-white">Post</h1>
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
              <div className="flex h-full w-full items-center justify-center rounded-full bg-[#1a1a1a] text-base font-bold text-white">
                {creator.displayName.charAt(0)}
              </div>
            </div>
          </Link>
          <div className="min-w-0 flex-1">
            <Link
              href={`/${creator.username}`}
              className="flex items-center gap-1.5"
            >
              <span className="truncate text-sm font-semibold text-white hover:underline">
                {creator.displayName}
              </span>
              {creator.isVerified && (
                <BadgeCheck className="h-4 w-4 flex-shrink-0 text-[#00AFF0]" />
              )}
            </Link>
            <p className="text-xs text-white/40">
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
                ? "text-sm leading-relaxed text-white/80 line-clamp-3"
                : "text-sm leading-relaxed text-white/80"
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
                  ? "flex aspect-video items-center justify-center bg-white/5 blur-xl"
                  : "flex aspect-video items-center justify-center bg-white/5"
              }
            >
              <div className="flex h-full w-full items-center justify-center bg-[#00AFF0]/10">
                <span className="text-sm text-white/20">
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
          <div className="mb-4 flex flex-col items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] px-6 py-10">
            <div className="rounded-full bg-white/10 p-4">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <div className="text-center">
              <p className="mb-1 text-base font-semibold text-white">
                Subscribe to see full post
              </p>
              <p className="mb-4 text-sm text-white/50">
                Subscribe to {creator.displayName} to unlock all premium content
              </p>
              <SubscribeButton
                price={creator.subscriptionPrice}
                size="lg"
              />
            </div>
          </div>
        )}

        {/* Actions Bar */}
        <div className="mb-6 flex items-center gap-6 border-b border-t border-white/5 py-3">
          <button
            className="flex items-center gap-2 text-white/40 transition-colors hover:text-[#00AFF0]"
            aria-label={`Like this post. ${formatNumber(post.stats.likes)} likes`}
          >
            <Heart className="h-5 w-5" />
            <span className="text-sm">{formatNumber(post.stats.likes)}</span>
          </button>
          <div
            className="flex items-center gap-2 text-white/40"
            aria-label={`${formatNumber(post.stats.comments)} comments`}
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-sm">
              {formatNumber(post.stats.comments)}
            </span>
          </div>
          <button
            className="ml-auto text-white/40 transition-colors hover:text-white/60"
            aria-label="Share this post"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>

        {/* Comments Section */}
        <section aria-label="Comments">
          <h2 className="mb-4 text-sm font-semibold text-white">
            Comments ({post.stats.comments})
          </h2>

          {/* Comment Input */}
          <div className="mb-6 flex items-center gap-3">
            <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-white/10">
              <div className="flex h-full w-full items-center justify-center text-xs text-white/40">
                ?
              </div>
            </div>
            <div className="flex flex-1 items-center rounded-full border border-white/10 bg-white/5 px-4 py-2">
              <input
                type="text"
                placeholder="Add a comment..."
                className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
                aria-label="Write a comment"
                disabled={isLocked}
              />
              <button
                className="ml-2 text-[#00AFF0] transition-colors hover:text-[#33C1F5] disabled:text-white/20"
                aria-label="Submit comment"
                disabled={isLocked}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Comment List */}
          {post.comments.length > 0 ? (
            <div className="space-y-4">
              {post.comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-[#00AFF0]/20">
                    <div className="flex h-full w-full items-center justify-center text-xs font-medium text-white/60">
                      {comment.displayName.charAt(0)}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">
                        {comment.displayName}
                      </span>
                      <span className="text-xs text-white/30">
                        {timeAgo(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-white/60">
                      {comment.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-white/30">
              No comments yet. Be the first to comment.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
