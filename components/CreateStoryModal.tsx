"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  X,
  Upload,
  Image as ImageIcon,
  Video,
  Loader2,
  AlertCircle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
const MAX_VIDEO_DURATION = 60; // seconds
const MAX_CAPTION_LENGTH = 200;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const ALL_ACCEPTED = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CreateStoryModalProps {
  readonly onClose: () => void;
  readonly onCreated: () => void;
}

type UploadState =
  | { status: "idle" }
  | { status: "previewing"; file: File; previewUrl: string; mediaType: "image" | "video"; duration: number | null }
  | { status: "uploading" }
  | { status: "error"; message: string };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getMediaType(file: File): "image" | "video" | null {
  if (ACCEPTED_IMAGE_TYPES.includes(file.type)) return "image";
  if (ACCEPTED_VIDEO_TYPES.includes(file.type)) return "video";
  return null;
}

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error("Could not read video metadata"));
    };
    video.src = URL.createObjectURL(file);
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CreateStoryModal({ onClose, onCreated }: CreateStoryModalProps) {
  const [state, setState] = useState<UploadState>({ status: "idle" });
  const [caption, setCaption] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  // ---- Lock body scroll ----
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // ---- Keyboard: Escape to close ----
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // ---- Cleanup preview URL ----
  useEffect(() => {
    return () => {
      if (state.status === "previewing") {
        URL.revokeObjectURL(state.previewUrl);
      }
    };
  }, [state]);

  // ---- File selection handler ----
  const handleFileSelect = useCallback(async (file: File) => {
    const mediaType = getMediaType(file);
    if (!mediaType) {
      setState({
        status: "error",
        message: "Unsupported file type. Please use JPEG, PNG, WebP, GIF, MP4, WebM, or MOV.",
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setState({
        status: "error",
        message: `File is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
      });
      return;
    }

    let duration: number | null = null;

    if (mediaType === "video") {
      try {
        duration = await getVideoDuration(file);
        if (duration > MAX_VIDEO_DURATION) {
          setState({
            status: "error",
            message: `Video is too long (${Math.ceil(duration)}s). Maximum duration is ${MAX_VIDEO_DURATION} seconds.`,
          });
          return;
        }
      } catch {
        setState({
          status: "error",
          message: "Could not read video file. Please try a different format.",
        });
        return;
      }
    }

    const previewUrl = URL.createObjectURL(file);
    setState({ status: "previewing", file, previewUrl, mediaType, duration });
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
      // Reset input so same file can be re-selected
      e.target.value = "";
    },
    [handleFileSelect],
  );

  // ---- Drop zone handlers ----
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect],
  );

  // ---- Post story ----
  const handlePost = useCallback(async () => {
    if (state.status !== "previewing") return;

    setState({ status: "uploading" });

    try {
      const formData = new FormData();
      formData.append("file", state.file);
      formData.append("media_type", state.mediaType);
      if (caption.trim()) {
        formData.append("caption", caption.trim());
      }
      if (state.duration !== null) {
        formData.append("duration", String(Math.round(state.duration)));
      }

      const res = await fetch("/api/stories", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          body?.error ?? `Upload failed (${res.status})`,
        );
      }

      onCreated();
    } catch (err) {
      setState({
        status: "error",
        message:
          err instanceof Error ? err.message : "Something went wrong. Please try again.",
      });
    }
  }, [state, caption, onCreated]);

  // ---- Reset to idle ----
  const handleReset = useCallback(() => {
    if (state.status === "previewing") {
      URL.revokeObjectURL(state.previewUrl);
    }
    setState({ status: "idle" });
    setCaption("");
  }, [state]);

  // ---- Render ----
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      {/* Backdrop click to close */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        role="presentation"
      />

      {/* Modal */}
      <div className="relative z-10 mx-4 flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Create Story</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-5">
          {/* IDLE: Upload zone */}
          {state.status === "idle" && (
            <div
              className={`flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-10 transition-colors ${
                isDragging
                  ? "border-[#00AFF0] bg-[#00AFF0]/5"
                  : "border-gray-300 bg-gray-50 hover:border-[#00AFF0] hover:bg-[#00AFF0]/5"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  fileInputRef.current?.click();
                }
              }}
            >
              <div className="flex gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#00AFF0]/10">
                  <ImageIcon className="h-6 w-6 text-[#00AFF0]" />
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#00AFF0]/10">
                  <Video className="h-6 w-6 text-[#00AFF0]" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">
                  Drop an image or video here, or click to browse
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Images: JPEG, PNG, WebP, GIF. Videos: MP4, WebM, MOV (max 60s, 100MB)
                </p>
              </div>
              <Upload className="h-5 w-5 text-gray-300" />
            </div>
          )}

          {/* PREVIEWING: Show media preview */}
          {state.status === "previewing" && (
            <div className="space-y-4">
              {/* Preview */}
              <div className="relative overflow-hidden rounded-xl bg-black">
                {state.mediaType === "image" ? (
                  <img
                    src={state.previewUrl}
                    alt="Story preview"
                    className="mx-auto max-h-[400px] object-contain"
                  />
                ) : (
                  <video
                    ref={previewVideoRef}
                    src={state.previewUrl}
                    className="mx-auto max-h-[400px]"
                    controls
                    playsInline
                    muted
                  />
                )}

                {/* Remove / change file */}
                <button
                  type="button"
                  onClick={handleReset}
                  className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white transition-colors hover:bg-black/70"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Caption */}
              <div>
                <label
                  htmlFor="story-caption"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Caption{" "}
                  <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <div className="relative">
                  <textarea
                    id="story-caption"
                    value={caption}
                    onChange={(e) => {
                      if (e.target.value.length <= MAX_CAPTION_LENGTH) {
                        setCaption(e.target.value);
                      }
                    }}
                    placeholder="Write a caption..."
                    rows={2}
                    maxLength={MAX_CAPTION_LENGTH}
                    className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#00AFF0] focus:outline-none focus:ring-1 focus:ring-[#00AFF0]"
                  />
                  <span className="absolute bottom-2 right-3 text-[11px] text-gray-300">
                    {caption.length}/{MAX_CAPTION_LENGTH}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* UPLOADING */}
          {state.status === "uploading" && (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <Loader2 className="h-10 w-10 animate-spin text-[#00AFF0]" />
              <p className="text-sm font-medium text-gray-600">
                Posting your story...
              </p>
            </div>
          )}

          {/* ERROR */}
          {state.status === "error" && (
            <div className="flex flex-col items-center justify-center gap-4 py-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                <AlertCircle className="h-7 w-7 text-red-500" />
              </div>
              <p className="max-w-sm text-center text-sm text-red-600">
                {state.message}
              </p>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-lg bg-gray-100 px-5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Footer: Post button (only when previewing) */}
        {state.status === "previewing" && (
          <div className="border-t border-gray-100 px-5 py-4">
            <button
              type="button"
              onClick={handlePost}
              className="w-full rounded-xl bg-[#00AFF0] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#009dd8] active:bg-[#008bc0]"
            >
              Post Story
            </button>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ALL_ACCEPTED.join(",")}
          onChange={handleInputChange}
          className="hidden"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
