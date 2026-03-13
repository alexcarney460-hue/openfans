"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Image as ImageIcon, Film } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// -- Types --

interface PostFormState {
  readonly title: string;
  readonly body: string;
  readonly tier: Tier;
  readonly mediaPreview: string | null;
  readonly mediaName: string | null;
}

type Tier = "free" | "basic" | "premium" | "vip";

const TIERS: readonly { readonly value: Tier; readonly label: string; readonly description: string }[] = [
  { value: "free", label: "Free", description: "Visible to everyone" },
  { value: "basic", label: "Basic", description: "$9.99/mo subscribers" },
  { value: "premium", label: "Premium", description: "$19.99/mo subscribers" },
  { value: "vip", label: "VIP", description: "$49.99/mo subscribers" },
] as const;

const TIER_RING_STYLES: Record<Tier, string> = {
  free: "border-gray-300 bg-gray-50",
  basic: "border-blue-500 bg-blue-500/10",
  premium: "border-[#00AFF0] bg-[#00AFF0]/10",
  vip: "border-amber-500 bg-amber-500/10",
};

const INITIAL_STATE: PostFormState = {
  title: "",
  body: "",
  tier: "free",
  mediaPreview: null,
  mediaName: null,
};

export default function NewPostPage() {
  const router = useRouter();
  const [form, setForm] = useState<PostFormState>(INITIAL_STATE);
  const [isDragging, setIsDragging] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = useCallback(
    <K extends keyof PostFormState>(field: K, value: PostFormState[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    },
    []
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    []
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    []
  );

  function handleFileSelect(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      setForm((prev) => ({
        ...prev,
        mediaPreview: e.target?.result as string,
        mediaName: file.name,
      }));
    };
    reader.readAsDataURL(file);
  }

  const clearMedia = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      mediaPreview: null,
      mediaName: null,
    }));
  }, []);

  const handlePublish = useCallback(async () => {
    setPublishing(true);
    setError(null);

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim() || "Untitled",
          body: form.body.trim() || null,
          media_type: "text",
          tier: form.tier,
          is_free: form.tier === "free",
          media_urls: [],
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({ error: "Unknown error" }));
        setError(json.error ?? "Failed to create post.");
        return;
      }

      router.push("/dashboard/posts");
    } catch {
      setError("Failed to create post. Please try again.");
    } finally {
      setPublishing(false);
    }
  }, [form.title, form.body, form.tier, router]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Create New Post
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Share content with your subscribers.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <Card className="border-gray-200 bg-white">
        <CardContent className="space-y-6 p-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="post-title" className="text-sm font-medium text-foreground">
              Title
              <span className="ml-1 text-xs text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="post-title"
              placeholder="Give your post a title..."
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              className="border-gray-200 bg-gray-50 text-foreground placeholder:text-muted-foreground focus-visible:ring-[#00AFF0]/50"
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label htmlFor="post-body" className="text-sm font-medium text-foreground">
              Body
            </Label>
            <textarea
              id="post-body"
              rows={6}
              placeholder="What do you want to share?"
              value={form.body}
              onChange={(e) => updateField("body", e.target.value)}
              className="w-full resize-none rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00AFF0]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            />
          </div>

          {/* Media upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Media
            </Label>
            {form.mediaPreview ? (
              <div className="relative overflow-hidden rounded-lg border border-gray-200">
                <img
                  src={form.mediaPreview}
                  alt="Upload preview"
                  className="h-64 w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
                  <span className="truncate text-xs text-white/80">
                    {form.mediaName}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearMedia}
                    className="h-7 text-white/80 hover:text-white"
                    aria-label="Remove media"
                  >
                    <X className="mr-1 h-3.5 w-3.5" />
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <label
                htmlFor="media-upload"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
                  isDragging
                    ? "border-[#00AFF0] bg-[#00AFF0]/10"
                    : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
                )}
              >
                <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  Drop files here or click to upload
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Images, videos, or audio. Max 100MB.
                </p>
                <div className="mt-3 flex gap-2">
                  <div className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[10px] text-muted-foreground">
                    <ImageIcon className="h-3 w-3" />
                    JPG, PNG, GIF
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[10px] text-muted-foreground">
                    <Film className="h-3 w-3" />
                    MP4, MOV
                  </div>
                </div>
                <input
                  id="media-upload"
                  type="file"
                  accept="image/*,video/*,audio/*"
                  onChange={handleFileInput}
                  className="sr-only"
                />
              </label>
            )}
          </div>

          {/* Tier selector */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">
              Access Tier
            </Label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {TIERS.map((tier) => (
                <button
                  key={tier.value}
                  type="button"
                  onClick={() => updateField("tier", tier.value)}
                  className={cn(
                    "flex flex-col items-center rounded-lg border-2 p-3 text-center transition-all",
                    form.tier === tier.value
                      ? TIER_RING_STYLES[tier.value]
                      : "border-gray-200 bg-transparent hover:border-gray-300"
                  )}
                  aria-pressed={form.tier === tier.value}
                >
                  <span className="text-sm font-semibold text-foreground">
                    {tier.label}
                  </span>
                  <span className="mt-0.5 text-[10px] text-muted-foreground">
                    {tier.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Publish */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-6">
            <Button
              variant="outline"
              className="border-gray-200"
              onClick={() => router.push("/dashboard/posts")}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePublish}
              className="bg-[#00AFF0] hover:bg-[#009dd8] px-8"
              disabled={!form.body.trim() || publishing}
            >
              {publishing ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
