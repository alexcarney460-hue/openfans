"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  X,
  Image as ImageIcon,
  Film,
  Loader2,
  Calendar,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
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

interface VideoAsset {
  readonly id: string;
  readonly original_url: string;
  readonly status: string; // "uploaded" | "processing" | "ready" | "failed"
  readonly original_filename: string;
  readonly file_size_bytes: number;
  readonly thumbnail_url: string | null;
  readonly hls_url: string | null;
  readonly duration_seconds: number | null;
  readonly width: number | null;
  readonly height: number | null;
}

interface VideoUploadState {
  readonly file: File | null;
  readonly preview: string | null;
  readonly uploading: boolean;
  readonly progress: number;
  readonly error: string | null;
  readonly asset: VideoAsset | null;
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
type MediaTab = "image" | "video";

const TIERS: readonly {
  readonly value: Tier;
  readonly label: string;
  readonly description: string;
}[] = [
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

const INITIAL_VIDEO_STATE: VideoUploadState = {
  file: null,
  preview: null,
  uploading: false,
  progress: 0,
  error: null,
  asset: null,
};

// Image upload constants
const MAX_IMAGE_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

// Video upload constants
const MAX_VIDEO_FILE_SIZE = 500 * 1024 * 1024;
const ALLOWED_VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-msvideo",
  "video/x-matroska",
]);
const ALLOWED_VIDEO_EXTENSIONS = new Set(["mp4", "mov", "webm", "avi", "mkv"]);

// Combined types for the old generic drop zone (images only now)
const ALLOWED_IMAGE_ACCEPT =
  "image/jpeg,image/png,image/gif,image/webp";
const ALLOWED_VIDEO_ACCEPT =
  "video/mp4,video/quicktime,video/webm,video/x-msvideo,video/x-matroska,.mp4,.mov,.webm,.avi,.mkv";

// -- Helpers --

async function uploadImageFile(file: File): Promise<string> {
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

function uploadVideoFile(
  file: File,
  onProgress: (percent: number) => void,
): Promise<VideoAsset> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText);
          resolve(json.data as VideoAsset);
        } catch {
          reject(new Error("Invalid response from server"));
        }
      } else {
        try {
          const json = JSON.parse(xhr.responseText);
          reject(new Error(json.error ?? "Video upload failed"));
        } catch {
          reject(new Error("Video upload failed"));
        }
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
    xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));

    xhr.open("POST", "/api/upload/video");
    xhr.send(formData);
  });
}

function getVideoExtension(filename: string): string {
  return (filename.split(".").pop() || "").toLowerCase();
}

function isAllowedVideoFile(file: File): boolean {
  const ext = getVideoExtension(file.name);
  return ALLOWED_VIDEO_MIME_TYPES.has(file.type) || ALLOWED_VIDEO_EXTENSIONS.has(ext);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function getStatusLabel(status: string): { text: string; color: string } {
  switch (status) {
    case "uploaded":
      return { text: "Processing queued", color: "text-amber-600" };
    case "processing":
      return { text: "Processing...", color: "text-blue-600" };
    case "ready":
      return { text: "Ready", color: "text-emerald-600" };
    case "failed":
      return { text: "Processing failed", color: "text-red-600" };
    default:
      return { text: status, color: "text-gray-600" };
  }
}

// -- Component --

export default function NewPostPage() {
  const router = useRouter();
  const [form, setForm] = useState<PostFormState>(INITIAL_STATE);
  const [mediaTab, setMediaTab] = useState<MediaTab>("image");
  const [mediaFiles, setMediaFiles] = useState<readonly MediaFile[]>([]);
  const [videoState, setVideoState] = useState<VideoUploadState>(INITIAL_VIDEO_STATE);
  const [isDragging, setIsDragging] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const statusPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (statusPollRef.current) {
        clearInterval(statusPollRef.current);
      }
    };
  }, []);

  const updateField = useCallback(
    <K extends keyof PostFormState>(field: K, value: PostFormState[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  // -- Image upload handlers --

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const addImageFiles = useCallback(
    (files: File[]) => {
      const validFiles = files.filter((f) => {
        if (!ALLOWED_IMAGE_TYPES.has(f.type)) {
          setError(`"${f.name}" has an unsupported file type.`);
          return false;
        }
        if (f.size > MAX_IMAGE_FILE_SIZE) {
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
        startImageUpload(mediaIndex, validFiles[i]);
      }
    },
    [mediaFiles],
  );

  const handleImageDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      addImageFiles(files);
    },
    [addImageFiles],
  );

  const handleImageFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      addImageFiles(files);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [addImageFiles],
  );

  async function startImageUpload(index: number, file: File) {
    setMediaFiles((prev) =>
      prev.map((m, i) =>
        i === index ? { ...m, uploading: true, progress: 30 } : m,
      ),
    );

    try {
      const url = await uploadImageFile(file);
      setMediaFiles((prev) =>
        prev.map((m, i) =>
          i === index
            ? { ...m, uploading: false, uploadedUrl: url, progress: 100 }
            : m,
        ),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setMediaFiles((prev) =>
        prev.map((m, i) =>
          i === index
            ? { ...m, uploading: false, error: msg, progress: 0 }
            : m,
        ),
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

  // -- Video upload handlers --

  const pollVideoStatus = useCallback((videoId: string) => {
    // Clear any existing poll
    if (statusPollRef.current) {
      clearInterval(statusPollRef.current);
    }

    let pollCount = 0;
    const MAX_POLL_COUNT = 120; // 120 * 5s = 10 minutes

    statusPollRef.current = setInterval(async () => {
      pollCount += 1;

      if (pollCount > MAX_POLL_COUNT) {
        if (statusPollRef.current) {
          clearInterval(statusPollRef.current);
          statusPollRef.current = null;
        }
        setVideoState((prev) => ({
          ...prev,
          error: "Video processing timed out. Please try uploading again.",
        }));
        return;
      }

      try {
        const res = await fetch(`/api/upload/video/${videoId}`);
        if (!res.ok) return;

        const json = await res.json();
        const asset = json.data as VideoAsset;

        setVideoState((prev) => ({
          ...prev,
          asset: { ...asset },
        }));

        // Stop polling when video is ready or failed
        if (asset.status === "ready" || asset.status === "failed") {
          if (statusPollRef.current) {
            clearInterval(statusPollRef.current);
            statusPollRef.current = null;
          }
        }
      } catch {
        // Silently continue polling on network errors
      }
    }, 5000);
  }, []);

  const handleVideoSelect = useCallback(
    async (file: File) => {
      // Validate
      if (!isAllowedVideoFile(file)) {
        setError(
          `"${file.name}" is not a supported video format. Use MP4, MOV, WebM, AVI, or MKV.`,
        );
        return;
      }

      if (file.size > MAX_VIDEO_FILE_SIZE) {
        setError(`"${file.name}" exceeds the 500MB limit.`);
        return;
      }

      if (file.size === 0) {
        setError(`"${file.name}" is empty.`);
        return;
      }

      setError(null);

      const preview = URL.createObjectURL(file);

      setVideoState({
        file,
        preview,
        uploading: true,
        progress: 0,
        error: null,
        asset: null,
      });

      try {
        const asset = await uploadVideoFile(file, (percent) => {
          setVideoState((prev) => ({ ...prev, progress: percent }));
        });

        setVideoState((prev) => ({
          ...prev,
          uploading: false,
          progress: 100,
          asset,
        }));

        // Start polling for processing status if not already ready
        if (asset.status !== "ready") {
          pollVideoStatus(asset.id);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Video upload failed";
        setVideoState((prev) => ({
          ...prev,
          uploading: false,
          progress: 0,
          error: msg,
        }));
      }
    },
    [pollVideoStatus],
  );

  const handleVideoDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      const videoFile = files.find(
        (f) => isAllowedVideoFile(f),
      );

      if (videoFile) {
        handleVideoSelect(videoFile);
      } else if (files.length > 0) {
        setError("Please drop a video file (MP4, MOV, WebM, AVI, or MKV).");
      }
    },
    [handleVideoSelect],
  );

  const handleVideoFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleVideoSelect(file);
      }
      if (videoInputRef.current) videoInputRef.current.value = "";
    },
    [handleVideoSelect],
  );

  const removeVideo = useCallback(() => {
    if (statusPollRef.current) {
      clearInterval(statusPollRef.current);
      statusPollRef.current = null;
    }
    if (videoState.preview) {
      URL.revokeObjectURL(videoState.preview);
    }
    setVideoState(INITIAL_VIDEO_STATE);
  }, [videoState.preview]);

  // -- Tab switching --

  const handleTabSwitch = useCallback(
    (tab: MediaTab) => {
      if (tab === mediaTab) return;

      // Warn if switching tabs would lose data
      if (tab === "video" && mediaFiles.length > 0) {
        const uploading = mediaFiles.some((m) => m.uploading);
        if (uploading) {
          setError("Please wait for image uploads to finish before switching.");
          return;
        }
      }
      if (tab === "image" && videoState.uploading) {
        setError("Please wait for the video upload to finish before switching.");
        return;
      }

      // Clear the other tab's data
      if (tab === "video") {
        // Clear images
        for (const m of mediaFiles) {
          if (m.preview) URL.revokeObjectURL(m.preview);
        }
        setMediaFiles([]);
      } else {
        // Clear video
        removeVideo();
      }

      setError(null);
      setMediaTab(tab);
    },
    [mediaTab, mediaFiles, videoState.uploading, removeVideo],
  );

  // -- Publish --

  const handlePublish = useCallback(async () => {
    // Ensure all uploads are complete
    if (mediaTab === "image") {
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
    }

    if (mediaTab === "video") {
      if (videoState.uploading) {
        setError("Please wait for the video upload to finish.");
        return;
      }
      if (videoState.error) {
        setError("Video upload failed. Please remove and try again.");
        return;
      }
    }

    setPublishing(true);
    setError(null);

    try {
      let mediaType: string = "text";
      let mediaUrls: string[] = [];
      let videoAssetId: string | undefined;

      if (mediaTab === "image" && mediaFiles.length > 0) {
        mediaUrls = mediaFiles
          .map((m) => m.uploadedUrl)
          .filter((url): url is string => url !== null);
        mediaType = "image";
      } else if (mediaTab === "video" && videoState.asset) {
        mediaType = "video";
        videoAssetId = videoState.asset.id;
        // Include the original URL in media_urls for backwards compatibility
        if (videoState.asset.original_url) {
          mediaUrls = [videoState.asset.original_url];
        }
      }

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
          ...(videoAssetId !== undefined
            ? { video_asset_id: videoAssetId }
            : {}),
          ...(ppvPriceCents !== undefined
            ? { ppv_price_usdc: ppvPriceCents }
            : {}),
          ...(scheduledAtIso !== undefined
            ? { scheduled_at: scheduledAtIso }
            : {}),
        }),
      });

      if (!res.ok) {
        const json = await res
          .json()
          .catch(() => ({ error: "Unknown error" }));
        setError(json.error ?? "Failed to create post.");
        return;
      }

      router.push("/dashboard/posts");
    } catch {
      setError("Failed to create post. Please try again.");
    } finally {
      setPublishing(false);
    }
  }, [
    form.title,
    form.body,
    form.tier,
    form.ppvEnabled,
    form.ppvPrice,
    form.scheduleEnabled,
    form.scheduledAt,
    mediaTab,
    mediaFiles,
    videoState,
    router,
  ]);

  const isUploading =
    mediaFiles.some((m) => m.uploading) || videoState.uploading;

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
            <Label
              htmlFor="post-title"
              className="text-sm font-medium text-foreground"
            >
              Title
              <span className="ml-1 text-xs text-muted-foreground">
                (optional)
              </span>
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
            <Label
              htmlFor="post-body"
              className="text-sm font-medium text-foreground"
            >
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
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">Media</Label>

            {/* Tab switcher */}
            <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
              <button
                type="button"
                onClick={() => handleTabSwitch("image")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all",
                  mediaTab === "image"
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <ImageIcon className="h-4 w-4" />
                Images
              </button>
              <button
                type="button"
                onClick={() => handleTabSwitch("video")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all",
                  mediaTab === "video"
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Film className="h-4 w-4" />
                Video
              </button>
            </div>

            {/* Image tab content */}
            {mediaTab === "image" && (
              <>
                {/* Uploaded files preview */}
                {mediaFiles.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    {mediaFiles.map((media, idx) => (
                      <div
                        key={`${media.file.name}-${idx}`}
                        className="relative overflow-hidden rounded-lg border border-gray-200"
                      >
                        <img
                          src={media.preview}
                          alt={`Upload ${idx + 1}`}
                          className="h-40 w-full object-cover"
                        />

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
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1">
                          <span className="block truncate text-[10px] text-white/80">
                            {media.file.name}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Image drop zone */}
                <label
                  htmlFor="media-upload"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleImageDrop}
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
                    isDragging
                      ? "border-[#00AFF0] bg-[#00AFF0]/10"
                      : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100",
                  )}
                >
                  <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">
                    {mediaFiles.length > 0
                      ? "Add more images"
                      : "Drop images here or click to upload"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Max 50MB per file
                  </p>
                  <div className="mt-3 flex gap-2">
                    <div className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[10px] text-muted-foreground">
                      <ImageIcon className="h-3 w-3" />
                      JPG, PNG, GIF, WebP
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    id="media-upload"
                    type="file"
                    accept={ALLOWED_IMAGE_ACCEPT}
                    multiple
                    onChange={handleImageFileInput}
                    className="sr-only"
                  />
                </label>
              </>
            )}

            {/* Video tab content */}
            {mediaTab === "video" && (
              <>
                {/* Video preview after selection */}
                {videoState.file && (
                  <div className="relative overflow-hidden rounded-lg border border-gray-200">
                    {/* Video preview */}
                    <div className="relative bg-black">
                      <video
                        src={videoState.preview ?? undefined}
                        className="mx-auto max-h-64 w-full object-contain"
                        controls={!videoState.uploading}
                        muted
                        playsInline
                      />

                      {/* Upload progress overlay */}
                      {videoState.uploading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
                          <Loader2 className="h-8 w-8 animate-spin text-white" />
                          <span className="mt-2 text-sm font-medium text-white">
                            Uploading... {videoState.progress}%
                          </span>
                          {/* Progress bar */}
                          <div className="mt-3 h-2 w-48 overflow-hidden rounded-full bg-white/20">
                            <div
                              className="h-full rounded-full bg-[#00AFF0] transition-all duration-300 ease-out"
                              style={{ width: `${videoState.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Error overlay */}
                      {videoState.error && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/60 p-4">
                          <AlertCircle className="h-8 w-8 text-white" />
                          <span className="mt-2 text-center text-sm text-white">
                            {videoState.error}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Video info bar */}
                    <div className="flex items-center justify-between bg-gray-50 px-3 py-2">
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate text-xs font-medium text-foreground">
                          {videoState.file.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatFileSize(videoState.file.size)}
                          {videoState.asset?.duration_seconds
                            ? ` - ${Math.round(videoState.asset.duration_seconds)}s`
                            : ""}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Status badge */}
                        {videoState.asset && !videoState.uploading && (
                          <div className="flex items-center gap-1">
                            {videoState.asset.status === "ready" ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            ) : videoState.asset.status === "failed" ? (
                              <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                            ) : (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                            )}
                            <span
                              className={cn(
                                "text-[10px] font-medium",
                                getStatusLabel(videoState.asset.status).color,
                              )}
                            >
                              {getStatusLabel(videoState.asset.status).text}
                            </span>
                          </div>
                        )}

                        {/* Upload complete indicator */}
                        {videoState.asset &&
                          !videoState.uploading &&
                          !videoState.error && (
                            <div className="rounded-full bg-emerald-500 p-0.5">
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
                          onClick={removeVideo}
                          className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-gray-200 hover:text-foreground"
                          aria-label="Remove video"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Video drop zone (only show when no video selected) */}
                {!videoState.file && (
                  <label
                    htmlFor="video-upload"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleVideoDrop}
                    className={cn(
                      "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
                      isDragging
                        ? "border-[#00AFF0] bg-[#00AFF0]/10"
                        : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100",
                    )}
                  >
                    <Film className="mb-3 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">
                      Drop a video here or click to upload
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Max 500MB per file
                    </p>
                    <div className="mt-3 flex gap-2">
                      <div className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[10px] text-muted-foreground">
                        <Film className="h-3 w-3" />
                        MP4, MOV, WebM, AVI, MKV
                      </div>
                    </div>
                    <input
                      ref={videoInputRef}
                      id="video-upload"
                      type="file"
                      accept={ALLOWED_VIDEO_ACCEPT}
                      onChange={handleVideoFileInput}
                      className="sr-only"
                    />
                  </label>
                )}
              </>
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
                      : "border-gray-200 bg-transparent hover:border-gray-300",
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
                  form.ppvEnabled ? "bg-[#00AFF0]" : "bg-gray-200",
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                    form.ppvEnabled ? "translate-x-5" : "translate-x-0",
                  )}
                />
              </button>
            </div>
            {form.ppvEnabled && (
              <div className="rounded-lg border border-[#00AFF0]/20 bg-[#00AFF0]/5 p-4">
                <Label
                  htmlFor="ppv-price"
                  className="mb-1.5 block text-xs font-medium text-gray-500"
                >
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
                  Minimum $1.00. Subscribers at the required tier get access
                  free. Others can buy individually.
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
                onClick={() =>
                  updateField("scheduleEnabled", !form.scheduleEnabled)
                }
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00AFF0]/50 focus-visible:ring-offset-2",
                  form.scheduleEnabled ? "bg-[#00AFF0]" : "bg-gray-200",
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                    form.scheduleEnabled ? "translate-x-5" : "translate-x-0",
                  )}
                />
              </button>
            </div>
            {form.scheduleEnabled && (
              <div className="rounded-lg border border-[#00AFF0]/20 bg-[#00AFF0]/5 p-4">
                <Label
                  htmlFor="schedule-date"
                  className="mb-1.5 block text-xs font-medium text-gray-500"
                >
                  Publish Date & Time
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
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
              className="bg-[#00AFF0] px-8 hover:bg-[#009dd8]"
              disabled={
                !form.body.trim() ||
                publishing ||
                isUploading ||
                (form.scheduleEnabled && !form.scheduledAt)
              }
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : publishing ? (
                form.scheduleEnabled ? (
                  "Scheduling..."
                ) : (
                  "Publishing..."
                )
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
