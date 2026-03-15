"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type DragEvent,
} from "react";
import { cn } from "@/lib/utils";
import {
  Upload,
  X,
  Film,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ProcessingStatus = "idle" | "uploading" | "processing" | "ready" | "error";

interface VideoUploadPreviewProps {
  /** Called when a file is selected or dropped. Return a promise that resolves when the upload finishes. */
  readonly onUpload?: (file: File) => Promise<void>;
  /** Called when the user removes the video. */
  readonly onRemove?: () => void;
  /** Externally controlled processing status. */
  readonly status?: ProcessingStatus;
  /** Upload progress percentage (0-100). */
  readonly progress?: number;
  /** Error message to display. */
  readonly errorMessage?: string;
  /** Maximum file size in bytes. Defaults to 500 MB. */
  readonly maxFileSize?: number;
  /** Accepted mime types. */
  readonly accept?: string;
  readonly className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const STATUS_LABELS: Record<ProcessingStatus, string> = {
  idle: "Ready",
  uploading: "Uploading...",
  processing: "Processing...",
  ready: "Ready",
  error: "Error",
};

const DEFAULT_MAX_SIZE = 500 * 1024 * 1024; // 500 MB
const DEFAULT_ACCEPT = "video/mp4,video/webm,video/quicktime,video/x-msvideo";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VideoUploadPreview({
  onUpload,
  onRemove,
  status: externalStatus,
  progress: externalProgress,
  errorMessage,
  maxFileSize = DEFAULT_MAX_SIZE,
  accept = DEFAULT_ACCEPT,
  className,
}: VideoUploadPreviewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  // File state
  const [file, setFile] = useState<File | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);

  // Upload state (internal, overridden by external props)
  const [internalStatus, setInternalStatus] = useState<ProcessingStatus>("idle");
  const [internalProgress, setInternalProgress] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Drag state
  const [isDragOver, setIsDragOver] = useState(false);

  const status = externalStatus ?? internalStatus;
  const progress = externalProgress ?? internalProgress;
  const displayError = errorMessage ?? validationError;

  // -----------------------------------------------------------------------
  // Generate thumbnail from video file
  // -----------------------------------------------------------------------

  const generateThumbnail = useCallback((videoFile: File) => {
    const url = URL.createObjectURL(videoFile);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    video.onloadeddata = () => {
      setVideoDuration(video.duration);

      // Seek to 1 second or 10% of duration
      video.currentTime = Math.min(1, video.duration * 0.1);
    };

    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        setThumbnailUrl(canvas.toDataURL("image/jpeg", 0.8));
      }
      URL.revokeObjectURL(url);
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
    };

    video.src = url;
  }, []);

  // -----------------------------------------------------------------------
  // Validate and process file
  // -----------------------------------------------------------------------

  const processFile = useCallback(
    async (selectedFile: File) => {
      setValidationError(null);

      // Validate type
      const acceptedTypes = accept.split(",").map((t) => t.trim());
      const isAccepted = acceptedTypes.some((t) => {
        if (t.endsWith("/*")) {
          return selectedFile.type.startsWith(t.replace("/*", "/"));
        }
        return selectedFile.type === t;
      });

      if (!isAccepted) {
        setValidationError(
          `Invalid file type. Accepted: ${acceptedTypes.join(", ")}`,
        );
        return;
      }

      // Validate size
      if (selectedFile.size > maxFileSize) {
        setValidationError(
          `File too large. Maximum size: ${formatFileSize(maxFileSize)}`,
        );
        return;
      }

      setFile(selectedFile);
      generateThumbnail(selectedFile);

      // Trigger upload
      if (onUpload) {
        setInternalStatus("uploading");
        setInternalProgress(0);

        // Simulate progress if no external progress control
        let progressInterval: ReturnType<typeof setInterval> | null = null;
        if (externalProgress === undefined) {
          progressInterval = setInterval(() => {
            setInternalProgress((prev) => {
              if (prev >= 90) return prev;
              return prev + Math.random() * 15;
            });
          }, 400);
        }

        try {
          await onUpload(selectedFile);
          setInternalProgress(100);
          setInternalStatus("ready");
        } catch (err) {
          setInternalStatus("error");
          setValidationError(
            err instanceof Error ? err.message : "Upload failed",
          );
        } finally {
          if (progressInterval) clearInterval(progressInterval);
        }
      }
    },
    [accept, maxFileSize, generateThumbnail, onUpload, externalProgress],
  );

  // -----------------------------------------------------------------------
  // File input change
  // -----------------------------------------------------------------------

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) processFile(selected);
    },
    [processFile],
  );

  // -----------------------------------------------------------------------
  // Drag and drop
  // -----------------------------------------------------------------------

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) processFile(droppedFile);
    },
    [processFile],
  );

  // -----------------------------------------------------------------------
  // Remove
  // -----------------------------------------------------------------------

  const handleRemove = useCallback(() => {
    setFile(null);
    setThumbnailUrl(null);
    setVideoDuration(null);
    setInternalStatus("idle");
    setInternalProgress(0);
    setValidationError(null);

    if (fileInputRef.current) fileInputRef.current.value = "";
    onRemove?.();
  }, [onRemove]);

  // -----------------------------------------------------------------------
  // Replace
  // -----------------------------------------------------------------------

  const handleReplace = useCallback(() => {
    handleRemove();
    // Small delay so state resets before file dialog opens
    setTimeout(() => fileInputRef.current?.click(), 50);
  }, [handleRemove]);

  // -----------------------------------------------------------------------
  // Cleanup blob URLs
  // -----------------------------------------------------------------------

  useEffect(() => {
    return () => {
      if (thumbnailUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(thumbnailUrl);
      }
    };
  }, [thumbnailUrl]);

  // -----------------------------------------------------------------------
  // Render — empty state (drop zone)
  // -----------------------------------------------------------------------

  if (!file) {
    return (
      <div
        className={cn(
          "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all duration-200",
          isDragOver
            ? "border-[#00AFF0] bg-[#00AFF0]/5"
            : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100",
          className,
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          aria-label="Upload video file"
        />

        <div
          className={cn(
            "mb-3 flex h-12 w-12 items-center justify-center rounded-full transition-colors",
            isDragOver ? "bg-[#00AFF0]/10" : "bg-gray-200",
          )}
        >
          <Upload
            className={cn(
              "h-6 w-6 transition-colors",
              isDragOver ? "text-[#00AFF0]" : "text-gray-400",
            )}
          />
        </div>

        <p className="mb-1 text-sm font-medium text-gray-700">
          {isDragOver ? "Drop video here" : "Upload a video"}
        </p>
        <p className="mb-4 text-xs text-gray-400">
          Drag and drop or click to browse. Max {formatFileSize(maxFileSize)}.
        </p>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-lg bg-[#00AFF0] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#009DD8]"
        >
          Choose File
        </button>

        {displayError && (
          <div className="mt-3 flex items-center gap-1.5 text-sm text-red-500">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{displayError}</span>
          </div>
        )}
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render — preview state
  // -----------------------------------------------------------------------

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-gray-200 bg-white",
        className,
      )}
    >
      {/* Thumbnail preview */}
      <div className="relative aspect-video bg-gray-900">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt="Video preview"
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Film className="h-12 w-12 text-gray-600" />
          </div>
        )}

        {/* Status overlay */}
        {(status === "uploading" || status === "processing") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
            <Loader2 className="mb-2 h-8 w-8 animate-spin text-white" />
            <span className="text-sm font-medium text-white">
              {STATUS_LABELS[status]}
            </span>
          </div>
        )}

        {status === "ready" && (
          <div className="absolute right-3 top-3">
            <div className="flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-xs font-medium text-white shadow">
              <CheckCircle2 className="h-3 w-3" />
              Ready
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
            <AlertCircle className="mb-2 h-8 w-8 text-red-400" />
            <span className="text-sm font-medium text-red-300">
              {displayError ?? "Upload failed"}
            </span>
          </div>
        )}
      </div>

      {/* Upload progress bar */}
      {status === "uploading" && (
        <div className="h-1 w-full bg-gray-200">
          <div
            className="h-full bg-[#00AFF0] transition-all duration-300 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}

      {/* Processing indicator */}
      {status === "processing" && (
        <div className="h-1 w-full overflow-hidden bg-gray-200">
          <div className="h-full w-1/3 animate-[shimmer_1.5s_ease-in-out_infinite] bg-[#00AFF0]" />
        </div>
      )}

      {/* File info & actions */}
      <div className="flex items-center gap-3 p-3">
        <Film className="h-5 w-5 flex-shrink-0 text-gray-400" />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900">
            {file.name}
          </p>
          <p className="text-xs text-gray-400">
            {formatFileSize(file.size)}
            {videoDuration !== null && (
              <span className="ml-2">{formatDuration(videoDuration)}</span>
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleReplace}
            className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Replace video"
            title="Replace"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleRemove}
            className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
            aria-label="Remove video"
            title="Remove"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Hidden file input for replace */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload video file"
      />

      {/* Shimmer animation keyframes (injected once) */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }
      `}</style>
    </div>
  );
}
