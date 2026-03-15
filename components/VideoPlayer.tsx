"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type MouseEvent,
  type TouchEvent,
} from "react";
import { cn } from "@/lib/utils";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Loader2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VideoVariant {
  readonly quality: string; // e.g. "480p", "720p", "1080p"
  readonly url: string;
}

interface VideoPlayerProps {
  readonly src: string;
  readonly poster?: string;
  readonly variants?: readonly VideoVariant[];
  readonly className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return "0:00";
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

/** Pick the best starting quality for the current viewport width. */
function pickDefaultQuality(
  variants: readonly VideoVariant[],
  viewportWidth: number,
): VideoVariant {
  const sortedDesc = [...variants].sort((a, b) => {
    const numA = parseInt(a.quality, 10) || 0;
    const numB = parseInt(b.quality, 10) || 0;
    return numB - numA;
  });

  if (viewportWidth < 640) {
    // Mobile: prefer 480p or lowest
    return (
      sortedDesc.find((v) => parseInt(v.quality, 10) <= 480) ??
      sortedDesc[sortedDesc.length - 1]
    );
  }
  if (viewportWidth < 1024) {
    // Tablet: prefer 720p
    return (
      sortedDesc.find((v) => parseInt(v.quality, 10) <= 720) ??
      sortedDesc[sortedDesc.length - 1]
    );
  }
  // Desktop: prefer 1080p or highest
  return (
    sortedDesc.find((v) => parseInt(v.quality, 10) <= 1080) ?? sortedDesc[0]
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VideoPlayer({
  src,
  poster,
  variants,
  className,
}: VideoPlayerProps) {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });
  const seekIndicatorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // State — playback
  const [isInView, setIsInView] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // State — UI
  const [showControls, setShowControls] = useState(true);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [seekIndicator, setSeekIndicator] = useState<string | null>(null);
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);

  // Quality
  const hasVariants = variants !== undefined && variants.length > 0;
  const [selectedQuality, setSelectedQuality] = useState<string>(() => {
    if (!hasVariants) return "";
    const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
    return pickDefaultQuality(variants!, vw).quality;
  });

  const activeSrc = hasVariants
    ? (variants!.find((v) => v.quality === selectedQuality)?.url ?? src)
    : src;

  // -----------------------------------------------------------------------
  // Intersection Observer — lazy load
  // -----------------------------------------------------------------------

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // -----------------------------------------------------------------------
  // Video event handlers
  // -----------------------------------------------------------------------

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration);
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || isDraggingProgress) return;
    setCurrentTime(video.currentTime);

    // Update buffered
    if (video.buffered.length > 0) {
      setBuffered(video.buffered.end(video.buffered.length - 1));
    }
  }, [isDraggingProgress]);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setShowControls(true);
  }, []);

  const handleWaiting = useCallback(() => setIsBuffering(true), []);
  const handleCanPlay = useCallback(() => setIsBuffering(false), []);

  // -----------------------------------------------------------------------
  // Play / Pause
  // -----------------------------------------------------------------------

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
      setHasStarted(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  // -----------------------------------------------------------------------
  // Controls visibility
  // -----------------------------------------------------------------------

  const scheduleHideControls = useCallback(() => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused && !showQualityMenu) {
        setShowControls(false);
      }
    }, 3000);
  }, [showQualityMenu]);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    scheduleHideControls();
  }, [scheduleHideControls]);

  const handleMouseLeave = useCallback(() => {
    if (isPlaying && !showQualityMenu) {
      scheduleHideControls();
    }
  }, [isPlaying, showQualityMenu, scheduleHideControls]);

  // -----------------------------------------------------------------------
  // Seek via progress bar
  // -----------------------------------------------------------------------

  const seekToPosition = useCallback(
    (clientX: number) => {
      const bar = progressRef.current;
      const video = videoRef.current;
      if (!bar || !video || !duration) return;

      const rect = bar.getBoundingClientRect();
      const fraction = Math.max(
        0,
        Math.min(1, (clientX - rect.left) / rect.width),
      );
      const newTime = fraction * duration;
      video.currentTime = newTime;
      setCurrentTime(newTime);
    },
    [duration],
  );

  const handleProgressMouseDown = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      setIsDraggingProgress(true);
      seekToPosition(e.clientX);

      const handleMouseMoveDoc = (ev: globalThis.MouseEvent) => {
        seekToPosition(ev.clientX);
      };
      const handleMouseUpDoc = () => {
        setIsDraggingProgress(false);
        document.removeEventListener("mousemove", handleMouseMoveDoc);
        document.removeEventListener("mouseup", handleMouseUpDoc);
      };

      document.addEventListener("mousemove", handleMouseMoveDoc);
      document.addEventListener("mouseup", handleMouseUpDoc);
    },
    [seekToPosition],
  );

  const handleProgressTouchStart = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      setIsDraggingProgress(true);
      seekToPosition(e.touches[0].clientX);

      const handleTouchMoveDoc = (ev: globalThis.TouchEvent) => {
        seekToPosition(ev.touches[0].clientX);
      };
      const handleTouchEndDoc = () => {
        setIsDraggingProgress(false);
        document.removeEventListener("touchmove", handleTouchMoveDoc);
        document.removeEventListener("touchend", handleTouchEndDoc);
      };

      document.addEventListener("touchmove", handleTouchMoveDoc);
      document.addEventListener("touchend", handleTouchEndDoc);
    },
    [seekToPosition],
  );

  // -----------------------------------------------------------------------
  // Volume
  // -----------------------------------------------------------------------

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const next = !isMuted;
    video.muted = next;
    setIsMuted(next);
  }, [isMuted]);

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const video = videoRef.current;
      if (!video) return;
      const val = parseFloat(e.target.value);
      video.volume = val;
      setVolume(val);
      if (val === 0) {
        video.muted = true;
        setIsMuted(true);
      } else if (isMuted) {
        video.muted = false;
        setIsMuted(false);
      }
    },
    [isMuted],
  );

  // -----------------------------------------------------------------------
  // Fullscreen
  // -----------------------------------------------------------------------

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      container.requestFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // -----------------------------------------------------------------------
  // Quality switching
  // -----------------------------------------------------------------------

  const handleQualityChange = useCallback(
    (quality: string) => {
      const video = videoRef.current;
      const wasPlaying = video ? !video.paused : false;
      const time = video?.currentTime ?? 0;

      setSelectedQuality(quality);
      setShowQualityMenu(false);

      // After src change, listen for loadedmetadata to restore position
      if (video) {
        video.addEventListener(
          "loadedmetadata",
          () => {
            video.currentTime = time;
            if (wasPlaying) video.play().catch(() => {});
          },
          { once: true },
        );
      }
    },
    [],
  );

  // -----------------------------------------------------------------------
  // Double-tap to seek (mobile)
  // -----------------------------------------------------------------------

  const handleContainerClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      // Ignore clicks on controls
      const target = e.target as HTMLElement;
      if (target.closest("[data-controls]")) return;

      const now = Date.now();
      const tapX = e.clientX;
      const timeDiff = now - lastTapRef.current.time;

      if (timeDiff < 300) {
        // Double tap detected
        const video = videoRef.current;
        const container = containerRef.current;
        if (!video || !container) return;

        const rect = container.getBoundingClientRect();
        const isLeftHalf = tapX < rect.left + rect.width / 2;

        if (isLeftHalf) {
          video.currentTime = Math.max(0, video.currentTime - 10);
          showSeekIndicator("-10s");
        } else {
          video.currentTime = Math.min(
            video.duration,
            video.currentTime + 10,
          );
          showSeekIndicator("+10s");
        }
      } else {
        // Single tap — toggle play
        togglePlay();
      }

      lastTapRef.current = { time: now, x: tapX };
    },
    [togglePlay],
  );

  const showSeekIndicator = useCallback((text: string) => {
    setSeekIndicator(text);
    if (seekIndicatorTimeoutRef.current)
      clearTimeout(seekIndicatorTimeoutRef.current);
    seekIndicatorTimeoutRef.current = setTimeout(
      () => setSeekIndicator(null),
      800,
    );
  }, []);

  // -----------------------------------------------------------------------
  // Keyboard shortcuts
  // -----------------------------------------------------------------------

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Only handle when this player's container or its children have focus
      const container = containerRef.current;
      if (!container || !container.contains(document.activeElement)) return;

      const video = videoRef.current;
      if (!video) return;

      switch (e.key.toLowerCase()) {
        case " ":
          e.preventDefault();
          togglePlay();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "arrowleft":
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 5);
          break;
        case "arrowright":
          e.preventDefault();
          video.currentTime = Math.min(video.duration, video.currentTime + 5);
          break;
        case "arrowup":
          e.preventDefault();
          video.volume = Math.min(1, video.volume + 0.1);
          setVolume(video.volume);
          break;
        case "arrowdown":
          e.preventDefault();
          video.volume = Math.max(0, video.volume - 0.1);
          setVolume(video.volume);
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [togglePlay, toggleFullscreen, toggleMute]);

  // -----------------------------------------------------------------------
  // Cleanup timeout refs on unmount
  // -----------------------------------------------------------------------

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (seekIndicatorTimeoutRef.current) clearTimeout(seekIndicatorTimeoutRef.current);
    };
  }, []);

  // -----------------------------------------------------------------------
  // Start controls hide timer when playing
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (isPlaying) scheduleHideControls();
    else setShowControls(true);
  }, [isPlaying, scheduleHideControls]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferPercent = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={cn(
        "group relative aspect-video w-full overflow-hidden rounded-lg bg-black",
        className,
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleContainerClick}
      tabIndex={0}
      role="application"
      aria-label="Video player"
    >
      {/* Poster / placeholder before in-view */}
      {(!isInView || !hasStarted) && poster && (
        <img
          src={poster}
          alt="Video thumbnail"
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
            hasStarted ? "opacity-0 pointer-events-none" : "opacity-100",
          )}
        />
      )}

      {/* Video element */}
      {isInView && (
        <video
          ref={videoRef}
          src={activeSrc}
          poster={poster}
          preload="metadata"
          playsInline
          className="h-full w-full object-contain"
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onWaiting={handleWaiting}
          onCanPlay={handleCanPlay}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      )}

      {/* Big play button (before first play) */}
      {!hasStarted && isInView && (
        <button
          className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors hover:bg-black/30"
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          aria-label="Play video"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#00AFF0] shadow-lg shadow-[#00AFF0]/30 transition-transform hover:scale-110">
            <Play className="ml-1 h-7 w-7 text-white" fill="white" />
          </div>
        </button>
      )}

      {/* Buffering spinner */}
      {isBuffering && hasStarted && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-white/80" />
        </div>
      )}

      {/* Seek indicator (double-tap feedback) */}
      {seekIndicator && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="rounded-lg bg-black/60 px-4 py-2 text-lg font-semibold text-white">
            {seekIndicator}
          </span>
        </div>
      )}

      {/* Controls overlay */}
      {hasStarted && (
        <div
          data-controls
          className={cn(
            "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-3 pb-3 pt-12 transition-opacity duration-300",
            showControls || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Progress bar */}
          <div
            ref={progressRef}
            className="group/progress mb-3 flex h-1.5 cursor-pointer items-center"
            onMouseDown={handleProgressMouseDown}
            onTouchStart={handleProgressTouchStart}
            onKeyDown={(e) => {
              const video = videoRef.current;
              if (!video) return;
              if (e.key === "ArrowLeft") {
                e.preventDefault();
                video.currentTime = Math.max(0, video.currentTime - 5);
                setCurrentTime(video.currentTime);
              } else if (e.key === "ArrowRight") {
                e.preventDefault();
                video.currentTime = Math.min(video.duration, video.currentTime + 5);
                setCurrentTime(video.currentTime);
              }
            }}
            role="slider"
            tabIndex={0}
            aria-label="Seek"
            aria-valuenow={Math.round(currentTime)}
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
          >
            <div className="relative h-1 w-full rounded-full bg-white/20 transition-all group-hover/progress:h-1.5">
              {/* Buffer progress */}
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-white/30"
                style={{ width: `${bufferPercent}%` }}
              />
              {/* Playback progress */}
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-[#00AFF0]"
                style={{ width: `${progressPercent}%` }}
              />
              {/* Scrub handle */}
              <div
                className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00AFF0] opacity-0 shadow transition-opacity group-hover/progress:opacity-100"
                style={{ left: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Control buttons */}
          <div className="flex items-center gap-3">
            {/* Play / Pause */}
            <button
              onClick={togglePlay}
              className="text-white transition-colors hover:text-[#00AFF0]"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" fill="currentColor" />
              ) : (
                <Play className="ml-0.5 h-5 w-5" fill="currentColor" />
              )}
            </button>

            {/* Time */}
            <span className="min-w-[80px] select-none text-xs tabular-nums text-white/80">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Volume */}
            <div className="group/vol flex items-center gap-1.5">
              <button
                onClick={toggleMute}
                className="text-white transition-colors hover:text-[#00AFF0]"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="hidden h-1 w-16 cursor-pointer appearance-none rounded-full bg-white/20 accent-[#00AFF0] group-hover/vol:block [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#00AFF0]"
                aria-label="Volume"
              />
            </div>

            {/* Quality selector */}
            {hasVariants && (
              <div className="relative">
                <button
                  onClick={() => setShowQualityMenu((prev) => !prev)}
                  className="flex items-center gap-1 text-white transition-colors hover:text-[#00AFF0]"
                  aria-label="Video quality"
                  aria-expanded={showQualityMenu}
                >
                  <Settings className="h-4.5 w-4.5" />
                  <span className="text-xs font-medium">{selectedQuality}</span>
                </button>

                {showQualityMenu && (
                  <div className="absolute bottom-full right-0 mb-2 min-w-[120px] overflow-hidden rounded-lg border border-white/10 bg-gray-900/95 py-1 shadow-xl backdrop-blur-sm">
                    {variants!.map((v) => (
                      <button
                        key={v.quality}
                        onClick={() => handleQualityChange(v.quality)}
                        className={cn(
                          "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-white/10",
                          v.quality === selectedQuality
                            ? "font-medium text-[#00AFF0]"
                            : "text-white/80",
                        )}
                      >
                        {v.quality === selectedQuality && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[#00AFF0]" />
                        )}
                        <span
                          className={
                            v.quality !== selectedQuality ? "pl-3.5" : ""
                          }
                        >
                          {v.quality}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="text-white transition-colors hover:text-[#00AFF0]"
              aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize className="h-5 w-5" />
              ) : (
                <Maximize className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
