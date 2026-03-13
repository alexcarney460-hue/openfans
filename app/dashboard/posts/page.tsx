"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  PenSquare,
  Edit,
  Trash2,
  Heart,
  MessageCircle,
  Image as ImageIcon,
  MoreVertical,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// -- Types --

interface Post {
  readonly id: string;
  readonly title: string;
  readonly thumbnail: string | null;
  readonly date: string;
  readonly tier: "free" | "basic" | "premium" | "vip";
  readonly likes: number;
  readonly comments: number;
  readonly status: "published" | "draft";
}

// -- Mock data --

const MOCK_POSTS: readonly Post[] = [
  {
    id: "1",
    title: "Behind the scenes of my latest shoot",
    thumbnail: null,
    date: "2026-03-12",
    tier: "premium",
    likes: 245,
    comments: 32,
    status: "published",
  },
  {
    id: "2",
    title: "Exclusive Q&A with subscribers",
    thumbnail: null,
    date: "2026-03-10",
    tier: "vip",
    likes: 182,
    comments: 67,
    status: "published",
  },
  {
    id: "3",
    title: "Weekly update - March",
    thumbnail: null,
    date: "2026-03-08",
    tier: "basic",
    likes: 120,
    comments: 18,
    status: "published",
  },
  {
    id: "4",
    title: "My crypto journey - how I got started",
    thumbnail: null,
    date: "2026-03-05",
    tier: "free",
    likes: 534,
    comments: 89,
    status: "published",
  },
  {
    id: "5",
    title: "New merch drop announcement",
    thumbnail: null,
    date: "2026-03-03",
    tier: "free",
    likes: 312,
    comments: 45,
    status: "published",
  },
  {
    id: "6",
    title: "Premium tutorial coming soon",
    thumbnail: null,
    date: "2026-03-02",
    tier: "premium",
    likes: 0,
    comments: 0,
    status: "draft",
  },
] as const;

// -- Helpers --

const TIER_STYLES: Record<Post["tier"], string> = {
  free: "bg-white/[0.06] text-muted-foreground",
  basic: "bg-blue-500/15 text-blue-400",
  premium: "bg-[#00AFF0]/15 text-[#00AFF0]",
  vip: "bg-amber-500/15 text-amber-400",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function PostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([...MOCK_POSTS]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            My Posts
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage and organize your content.
          </p>
        </div>
        <Button asChild className="bg-[#00AFF0] hover:bg-[#009dd8]">
          <Link href="/dashboard/posts/new">
            <PenSquare className="mr-2 h-4 w-4" />
            New Post
          </Link>
        </Button>
      </div>

      {/* Posts list */}
      <Card className="border-white/[0.06] bg-[#111111]">
        <CardHeader className="border-b border-white/[0.06] pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              All Posts ({posts.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Table header */}
          <div className="hidden border-b border-white/[0.06] px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground md:grid md:grid-cols-12 md:gap-4">
            <div className="col-span-5">Post</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-1">Tier</div>
            <div className="col-span-1 text-center">Likes</div>
            <div className="col-span-1 text-center">Comments</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Table rows */}
          <div className="divide-y divide-white/[0.04]">
            {posts.map((post) => (
              <div
                key={post.id}
                className="group flex flex-col gap-3 px-6 py-4 transition-colors hover:bg-white/[0.02] md:grid md:grid-cols-12 md:items-center md:gap-4"
              >
                {/* Post info */}
                <div className="col-span-5 flex items-center gap-3">
                  <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded-md bg-white/[0.04]">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {post.title}
                    </p>
                    {post.status === "draft" && (
                      <Badge
                        variant="outline"
                        className="mt-1 border-amber-500/30 text-[10px] text-amber-400"
                      >
                        Draft
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Date */}
                <div className="col-span-2">
                  <span className="text-sm text-muted-foreground">
                    {formatDate(post.date)}
                  </span>
                </div>

                {/* Tier */}
                <div className="col-span-1">
                  <Badge
                    className={cn(
                      "border-0 text-[10px] font-semibold uppercase",
                      TIER_STYLES[post.tier]
                    )}
                  >
                    {post.tier}
                  </Badge>
                </div>

                {/* Likes */}
                <div className="col-span-1 flex items-center justify-center gap-1 text-sm text-muted-foreground">
                  <Heart className="h-3.5 w-3.5" />
                  {post.likes}
                </div>

                {/* Comments */}
                <div className="col-span-1 flex items-center justify-center gap-1 text-sm text-muted-foreground">
                  <MessageCircle className="h-3.5 w-3.5" />
                  {post.comments}
                </div>

                {/* Actions */}
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-muted-foreground hover:text-foreground"
                    aria-label={`Edit ${post.title}`}
                    onClick={() => router.push("/dashboard/posts/new")}
                  >
                    <Edit className="mr-1.5 h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-muted-foreground hover:text-red-400"
                    aria-label={`Delete ${post.title}`}
                    onClick={() => {
                      const confirmed = window.confirm(
                        `Are you sure you want to delete "${post.title}"?`
                      );
                      if (confirmed) {
                        setPosts((prev) =>
                          prev.filter((p) => p.id !== post.id)
                        );
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
