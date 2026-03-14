"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Image as ImageIcon, Film, Loader2, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// -- Types --

interface MediaFile {
  readonly file: File;
  readonly preview: string;
  readonly uploading: boolean;
  readonly uploadedUrl: string | null;
  readonly progress: number;
  readonly error: string | null;
}

interface PostFormState {
  readonly title: string;
  readonly body: string;
  readonly tier: Tier;
  readonly ppvEnabled: boolean;
  readonly ppvPrice: string; // dollar string e.g. "5.00"
  readonly scheduleEnabled: boolean;
  readonly scheduledAt: string; // ISO datetime-local string e.g. "2026-03-15T14:00"
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
  ppvEnabled: false,
  ppvPrice: "",
  scheduleEnabled: false,
  scheduledAt: "",
};

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/quicktime",
]);

async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("bucket", "posts");

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(json.error ?? "Upload failed");
  }

  const json = await res.json();
  return json.data.url;
}

export default function NewPostPage() {
  const router = useRouter();
  const [form, setForm] = useState<PostFormState>(INITIAL_STATE);
  const [mediaFiles, setMediaFiles] = useState<readonly MediaFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateField = useCallback(
    <K extends keyof PostFormState>(field: K, value: PostFormState[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const addFiles = useCallback((files: File[]) => {
    const validFiles = files.filter((f) => {
      if (!ALLOWED_TYPES.has(f.type)) {
        setError(`"${f.name}" has an unsupported file type.`);
        return false;
      }
      if (f.size > MAX_FILE_SIZE) {
        setError(`"${f.name}" exceeds the 50MB limit.`);
        return false;
      }
      return true;
    });

    const newMedia: MediaFile[] = validFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: false,
      uploadedUrl: null,
      progress: 0,
      error: null,
    }));

    setMediaFiles((prev) => [...prev, ...newMedia]);

    // Start uploading each file
    for (let i = 0; i < newMedia.length; i++) {
      const mediaIndex = mediaFiles.length + i;
      startUpload(mediaIndex, validFiles[i]);
    }
  }, [mediaFiles]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  }, [addFiles]);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      addFiles(files);
      // Reset so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [addFiles]
  );

  async function startUpload(index: number, file: File) {
    setMediaFiles((prev) =>
      prev.map((m, i) =>
        i === index ? { ...m, uploading: true, progress: 30 } : m
      )
    );

    try {
      const url = await uploadFile(file);
      setMediaFiles((prev) =>
        prev.map((m, i) =>
          i === index
            ? { ...m, uploading: false, uploadedUrl: url, progress: 100 }
            : m
        )
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setMediaFiles((prev) =>
        prev.map((m, i) =>
          i === index
            ? { ...m, uploading: false, error: msg, progress: 0 }
            : m
        )
      );
    }
  }

  const removeMedia = useCallback((index: number) => {
    setMediaFiles((prev) => {
      const item = prev[index];
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handlePublish = useCallback(async () => {
    // Ensure all uploads are complete
    const stillUploading = mediaFiles.some((m) => m.uploading);
    if (stillUploading) {
      setError("Please wait for all uploads to finish.");
      return;
    }

    const failedUploads = mediaFiles.filter((m) => m.error);
    if (failedUploads.length > 0) {
      setError("Some files failed to upload. Remove or retry them.");
      return;
    }

    setPublishing(true);
    setError(null);

    try {
      const mediaUrls = mediaFiles
        .map((m) => m.uploadedUrl)
        .filter((url): url is string => url !== null);

      const hasVideo = mediaFiles.some((m) =>
        m.file.type.startsWith("video/")
      );
      const hasImage = mediaFiles.some((m) =>
        m.file.type.startsWith("image/")
      );

      let mediaType: string = "text";
      if (hasVideo && hasImage) mediaType = "mixed";
      else if (hasVideo) mediaType = "video";
      else if (hasImage) mediaType = "image";

      // Calculate PPV price in cents if enabled
      let ppvPriceCents: number | undefined;
      if (form.ppvEnabled && form.ppvPrice) {
        const parsed = parseFloat(form.ppvPrice);
        if (isNaN(parsed) || parsed < 1) {
          setError("PPV price must be at least $1.00");
          return;
        }
        ppvPriceCents = Math.round(parsed * 100);
      }

      // Build scheduled_at ISO string if scheduling is enabled
      let scheduledAtIso: string | undefined;
      if (form.scheduleEnabled && form.scheduledAt) {
        const scheduledDate = new Date(form.scheduledAt);
        if (isNaN(scheduledDate.getTime())) {
          setError("Please enter a valid date and time for scheduling.");
          return;
        }
        if (scheduledDate <= new Date()) {
          setError("Scheduled time must be in the future.");
          return;
        }
        scheduledAtIso = scheduledDate.toISOString();
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim() || "Untitled",
          body: form.body.trim() || null,
          media_type: mediaType,
          tier: form.tier,
          is_free: form.tier === "free",
          media_urls: mediaUrls,
          ...(ppvPriceCents !== undefined ? { ppv_price_usdc: ppvPriceCents } : {}),
          ...(scheduledAtIso !== undefined ? { scheduled_at: scheduledAtIso } : {}),
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
  }, [form.title, form.body, form.tier, form.ppvEnabled, form.ppvPrice, form.scheduleEnabled, form.scheduledAt, mediaFiles, router]);

  const isUploading = mediaFiles.some((m) => m.uploading);

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

            {/* Uploaded files preview */}
            {mediaFiles.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {mediaFiles.map((media, idx) => (
                  <div
                    key={`${media.file.name}-${idx}`}
                    className="relative overflow-hidden rounded-lg border border-gray-200"
                  >
                    {media.file.type.startsWith("video/") ? (
                      <video
                        src={media.preview}
                        className="h-40 w-full object-cover"
                        muted
                      />
                    ) : (
                      <img
                        src={media.preview}
                        alt={`Upload ${idx + 1}`}
                        className="h-40 w-full object-cover"
                      />
                    )}

                    {/* Upload overlay */}
                    {media.uploading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                        <span className="mt-1 text-xs text-white">
                          Uploading...
                        </span>
                      </div>
                    )}

                    {/* Error overlay */}
                    {media.error && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/60 p-2">
                        <span className="text-center text-xs text-white">
                          {media.error}
                        </span>
                      </div>
                    )}

                    {/* Success indicator */}
                    {media.uploadedUrl && !media.uploading && (
                      <div className="absolute left-2 top-2 rounded-full bg-emerald-500 p-1">
                        <svg
                          className="h-3 w-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => removeMedia(idx)}
                      className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white/80 transition-colors hover:text-white"
                      aria-label={`Remove ${media.file.name}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>

                    {/* File name */}
                    <div className="bg-gradient-to-t from-black/60 to-transparent px-2 py-1 absolute bottom-0 inset-x-0">
                      <span className="truncate text-[10px] text-white/80 block">
                        {media.file.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Drop zone */}
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
                {mediaFiles.length > 0
                  ? "Add more files"
                  : "Drop files here or click to upload"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Images, videos. Max 50MB per file.
              </p>
              <div className="mt-3 flex gap-2">
                <div className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[10px] text-muted-foreground">
                  <ImageIcon className="h-3 w-3" />
                  JPG, PNG, GIF, WebP
                </div>
                <div className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[10px] text-muted-foreground">
                  <Film className="h-3 w-3" />
                  MP4, MOV
                </div>
              </div>
              <input
                ref={fileInputRef}
                id="media-upload"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime"
                multiple
                onChange={handleFileInput}
                className="sr-only"
              />
            </label>
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

          {/* PPV Toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium text-foreground">
                  Pay-Per-View
                </Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Charge a one-time fee to unlock this post
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.ppvEnabled}
                onClick={() => updateField("ppvEnabled", !form.ppvEnabled)}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00AFF0]/50 focus-visible:ring-offset-2",
                  form.ppvEnabled ? "bg-[#00AFF0]" : "bg-gray-200"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                    form.ppvEnabled ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>
            {form.ppvEnabled && (
              <div className="rounded-lg border border-[#00AFF0]/20 bg-[#00AFF0]/5 p-4">
                <Label htmlFor="ppv-price" className="mb-1.5 block text-xs font-medium text-gray-500">
                  Price (USDC)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                    $
                  </span>
                  <Input
                    id="ppv-price"
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="5.00"
                    value={form.ppvPrice}
                    onChange={(e) => updateField("ppvPrice", e.target.value)}
                    className="border-gray-200 bg-white pl-7 text-foreground placeholder:text-muted-foreground focus-visible:ring-[#00AFF0]/50"
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Minimum $1.00. Subscribers at the required tier get access free.
                  Others can buy individually.
                </p>
              </div>
            )}
          </div>

          {/* Schedule Toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium text-foreground">
                  Schedule Post
                </Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Set a future date and time to automatically publish
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.scheduleEnabled}
                onClick={() => updateField("scheduleEnabled", !form.scheduleEnabled)}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00AFF0]/50 focus-visible:ring-offset-2",
                  form.scheduleEnabled ? "bg-[#00AFF0]" : "bg-gray-200"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                    form.scheduleEnabled ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>
            {form.scheduleEnabled && (
              <div className="rounded-lg border border-[#00AFF0]/20 bg-[#00AFF0]/5 p-4">
                <Label htmlFor="schedule-date" className="mb-1.5 block text-xs font-medium text-gray-500">
                  Publish Date & Time
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="schedule-date"
                    type="datetime-local"
                    value={form.scheduledAt}
                    onChange={(e) => updateField("scheduledAt", e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="border-gray-200 bg-white pl-10 text-foreground focus-visible:ring-[#00AFF0]/50"
                  />
                </div>
                {form.scheduledAt && (
                  <p className="mt-2 text-xs text-[#00AFF0]">
                    This post will be published on{" "}
                    {new Date(form.scheduledAt).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    at{" "}
                    {new Date(form.scheduledAt).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Publish / Schedule */}
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
              disabled={!form.body.trim() || publishing || isUploading || (form.scheduleEnabled && !form.scheduledAt)}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : publishing ? (
                form.scheduleEnabled ? "Scheduling..." : "Publishing..."
              ) : form.scheduleEnabled ? (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Post
                </>
              ) : (
                "Publish"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
