"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  PenSquare,
  Edit,
  Trash2,
  Heart,
  MessageCircle,
  Image as ImageIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// -- Types --

interface Post {
  readonly id: number;
  readonly title: string | null;
  readonly body: string | null;
  readonly media_urls: string[];
  readonly media_type: string;
  readonly is_free: boolean;
  readonly tier: "free" | "basic" | "premium" | "vip";
  readonly likes_count: number;
  readonly comments_count: number;
  readonly created_at: string;
}

// -- Helpers --

const TIER_STYLES: Record<string, string> = {
  free: "bg-gray-100 text-gray-500",
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
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      // First get the current user to find their creator_id
      const meRes = await fetch("/api/me");
      if (!meRes.ok) {
        setError("Please log in to view your posts.");
        setLoading(false);
        return;
      }
      const meJson = await meRes.json();
      const userId = meJson.data?.id;
      if (!userId) {
        setError("Could not determine user.");
        setLoading(false);
        return;
      }

      const postsRes = await fetch(`/api/posts?creator_id=${userId}&limit=50`);
      if (!postsRes.ok) {
        setError("Failed to load posts.");
        setLoading(false);
        return;
      }
      const postsJson = await postsRes.json();
      setPosts(postsJson.data ?? []);
    } catch {
      setError("Failed to load posts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleDelete = async (postId: number, title: string | null) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${title ?? "this post"}"?`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      } else {
        const json = await res.json();
        alert(json.error ?? "Failed to delete post.");
      }
    } catch {
      alert("Failed to delete post.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">My Posts</h1>
            <p className="mt-1 text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">My Posts</h1>
          <p className="mt-1 text-sm text-red-400">{error}</p>
        </div>
      </div>
    );
  }

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
      <Card className="border-gray-200 bg-white">
        <CardHeader className="border-b border-gray-200 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              All Posts ({posts.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {posts.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">
              No posts yet. Create your first post to get started.
            </div>
          ) : (
            <>
              {/* Table header */}
              <div className="hidden border-b border-gray-200 px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground md:grid md:grid-cols-12 md:gap-4">
                <div className="col-span-5">Post</div>
                <div className="col-span-2">Date</div>
                <div className="col-span-1">Tier</div>
                <div className="col-span-1 text-center">Likes</div>
                <div className="col-span-1 text-center">Comments</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              {/* Table rows */}
              <div className="divide-y divide-gray-200">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="group flex flex-col gap-3 px-6 py-4 transition-colors hover:bg-gray-50 md:grid md:grid-cols-12 md:items-center md:gap-4"
                  >
                    {/* Post info */}
                    <div className="col-span-5 flex items-center gap-3">
                      <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded-md bg-gray-100">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {post.title ?? "(Untitled)"}
                        </p>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="col-span-2">
                      <span className="text-sm text-muted-foreground">
                        {formatDate(post.created_at)}
                      </span>
                    </div>

                    {/* Tier */}
                    <div className="col-span-1">
                      <Badge
                        className={cn(
                          "border-0 text-[10px] font-semibold uppercase",
                          TIER_STYLES[post.tier] ?? TIER_STYLES.free
                        )}
                      >
                        {post.tier}
                      </Badge>
                    </div>

                    {/* Likes */}
                    <div className="col-span-1 flex items-center justify-center gap-1 text-sm text-muted-foreground">
                      <Heart className="h-3.5 w-3.5" />
                      {post.likes_count}
                    </div>

                    {/* Comments */}
                    <div className="col-span-1 flex items-center justify-center gap-1 text-sm text-muted-foreground">
                      <MessageCircle className="h-3.5 w-3.5" />
                      {post.comments_count}
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-muted-foreground hover:text-foreground"
                        aria-label={`Edit ${post.title ?? "post"}`}
                        onClick={() => router.push("/dashboard/posts/new")}
                      >
                        <Edit className="mr-1.5 h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-muted-foreground hover:text-red-400"
                        aria-label={`Delete ${post.title ?? "post"}`}
                        onClick={() => handleDelete(post.id, post.title)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
