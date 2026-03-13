import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheck,
  FileText,
  Users,
  Heart,
  ArrowLeft,
} from "lucide-react";
import { getCreator, getAllCreators, formatNumber } from "@/lib/mock-data";
import { PostCard } from "@/components/PostCard";
import { CreatorSubscribeSection } from "@/components/CreatorSubscribeSection";

interface PageProps {
  params: { username: string };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const creator = getCreator(params.username);
  if (!creator) {
    return { title: "Creator Not Found | OpenFans" };
  }

  return {
    title: `${creator.displayName} (@${creator.username}) | OpenFans`,
    description: creator.bio,
    openGraph: {
      title: `${creator.displayName} on OpenFans`,
      description: creator.bio,
      type: "profile",
      url: `https://openfans.online/${creator.username}`,
      siteName: "OpenFans",
    },
    twitter: {
      card: "summary_large_image",
      title: `${creator.displayName} on OpenFans`,
      description: creator.bio,
    },
  };
}

export async function generateStaticParams() {
  const creators = getAllCreators();
  return creators.map((creator) => ({
    username: creator.username,
  }));
}

export default function CreatorProfilePage({ params }: PageProps) {
  const creator = getCreator(params.username);

  if (!creator) {
    notFound();
  }

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
              {creator.displayName}
            </h1>
            {creator.isVerified && (
              <BadgeCheck className="h-4 w-4 flex-shrink-0 fill-[#00AFF0] text-white" />
            )}
          </div>
          <p className="text-xs text-gray-400">
            {formatNumber(creator.stats.posts)} posts
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
            <div className="flex h-full w-full items-center justify-center rounded-full bg-gray-200 text-3xl font-bold text-gray-600 sm:text-4xl">
              {creator.displayName.charAt(0)}
            </div>
          </div>
          <div className="pb-1">
            <CreatorSubscribeSection
              creatorName={creator.displayName}
              creatorUsername={creator.username}
              subscriptionPrice={creator.subscriptionPrice}
            />
          </div>
        </div>

        {/* Creator Info */}
        <div className="mb-4">
          <div className="mb-1 flex items-center gap-2">
            <h2 className="text-2xl font-bold text-gray-900">
              {creator.displayName}
            </h2>
            {creator.isVerified && (
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
              {formatNumber(creator.stats.posts)}
            </span>
            <span className="text-gray-400">posts</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <Users className="h-4 w-4 text-gray-300" />
            <span className="font-semibold text-gray-900">
              {formatNumber(creator.stats.subscribers)}
            </span>
            <span className="text-gray-400">subscribers</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <Heart className="h-4 w-4 text-gray-300" />
            <span className="font-semibold text-gray-900">
              {formatNumber(creator.stats.likes)}
            </span>
            <span className="text-gray-400">likes</span>
          </div>
        </div>

        {/* Categories */}
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

        {/* Divider */}
        <div className="mb-6 border-t border-gray-200" />

        {/* Content Feed */}
        <section aria-label="Posts feed">
          <div className="space-y-4 pb-16">
            {creator.posts.map((post) => (
              <PostCard key={post.id} post={post} isSubscribed={false} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
