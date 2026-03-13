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
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b border-white/[0.06] bg-[#0a0a0a]/80 px-4 backdrop-blur-xl">
        <Link
          href="/"
          className="flex items-center gap-2 text-white/60 transition-colors hover:text-white"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="truncate text-sm font-bold text-white">
              {creator.displayName}
            </h1>
            {creator.isVerified && (
              <BadgeCheck className="h-4 w-4 flex-shrink-0 fill-[#00AFF0] text-white" />
            )}
          </div>
          <p className="text-xs text-white/40">
            {formatNumber(creator.stats.posts)} posts
          </p>
        </div>
      </nav>

      {/* Banner */}
      <div className="relative h-48 w-full sm:h-64 md:h-72 lg:h-80">
        <div className="h-full w-full bg-gradient-to-br from-[#0f1923] via-[#151a2e] to-[#1a1a2e]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
      </div>

      {/* Profile Section */}
      <div className="relative mx-auto max-w-2xl px-4">
        {/* Avatar */}
        <div className="-mt-16 mb-4 flex items-end justify-between sm:-mt-20">
          <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-[#0a0a0a] sm:h-32 sm:w-32">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-[#1e1e1e] text-3xl font-bold text-white sm:text-4xl">
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
            <h2 className="text-2xl font-bold text-white">
              {creator.displayName}
            </h2>
            {creator.isVerified && (
              <BadgeCheck className="h-5 w-5 fill-[#00AFF0] text-white" />
            )}
          </div>
          <p className="mb-3 text-sm text-white/40">@{creator.username}</p>
          <p className="text-sm leading-relaxed text-white/70">
            {creator.bio}
          </p>
        </div>

        {/* Stats Row */}
        <div className="mb-4 flex items-center gap-6">
          <div className="flex items-center gap-1.5 text-sm">
            <FileText className="h-4 w-4 text-white/25" />
            <span className="font-semibold text-white">
              {formatNumber(creator.stats.posts)}
            </span>
            <span className="text-white/40">posts</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <Users className="h-4 w-4 text-white/25" />
            <span className="font-semibold text-white">
              {formatNumber(creator.stats.subscribers)}
            </span>
            <span className="text-white/40">subscribers</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <Heart className="h-4 w-4 text-white/25" />
            <span className="font-semibold text-white">
              {formatNumber(creator.stats.likes)}
            </span>
            <span className="text-white/40">likes</span>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-6 flex flex-wrap gap-2">
          {creator.categories.map((category) => (
            <span
              key={category}
              className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs font-medium text-white/50"
            >
              {category}
            </span>
          ))}
        </div>

        {/* Divider */}
        <div className="mb-6 border-t border-white/[0.06]" />

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
