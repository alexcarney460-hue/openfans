"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, Volume2, VolumeX, ChevronLeft, ChevronRight } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Story {
  readonly id: string;
  readonly media_url: string;
  readonly media_type: "image" | "video";
  readonly caption: string | null;
  readonly created_at: string;
  readonly duration?: number; // seconds, for video
}

export interface CreatorStories {
  readonly creator_id: string;
  readonly username: string;
  readonly display_name: string;
  readonly avatar_url: string;
  readonly stories: readonly Story[];
}

interface StoryViewerProps {
  readonly stories: readonly CreatorStories[];
  readonly initialCreatorIndex?: number;
  readonly initialStoryIndex?: number;
  readonly onClose: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const IMAGE_DURATION = 5_000; // ms

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000,
  );
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StoryViewer({
  stories,
  initialCreatorIndex = 0,
  initialStoryIndex = 0,
  onClose,
}: StoryViewerProps) {
  const [creatorIdx, setCreatorIdx] = useState(initialCreatorIndex);
  const [storyIdx, setStoryIdx] = useState(initialStoryIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [touchStart, setTouchStart] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);
  const elapsedRef = useRef(0);
  const trackedRef = useRef<Set<string>>(new Set());

  const currentCreator = stories[creatorIdx];
  const currentStory = currentCreator?.stories[storyIdx];
  const isVideo = currentStory?.media_type === "video";

  // ---- Track view ----
  const trackView = useCallback(
    (storyId: string) => {
      if (trackedRef.current.has(storyId)) return;
      trackedRef.current.add(storyId);
      fetch(`/api/stories/${storyId}`, { method: "GET" }).catch(() => {
        /* silent */
      });
    },
    [],
  );

  // ---- Navigation helpers ----
  const goNextStory = useCallback(() => {
    const creator = stories[creatorIdx];
    if (storyIdx < creator.stories.length - 1) {
      setStoryIdx((i) => i + 1);
    } else if (creatorIdx < stories.length - 1) {
      setCreatorIdx((i) => i + 1);
      setStoryIdx(0);
    } else {
      onClose();
    }
    setProgress(0);
    elapsedRef.current = 0;
  }, [creatorIdx, storyIdx, stories, onClose]);

  const goPrevStory = useCallback(() => {
    if (storyIdx > 0) {
      setStoryIdx((i) => i - 1);
    } else if (creatorIdx > 0) {
      const prevCreator = stories[creatorIdx - 1];
      setCreatorIdx((i) => i - 1);
      setStoryIdx(prevCreator.stories.length - 1);
    }
    setProgress(0);
    elapsedRef.current = 0;
  }, [creatorIdx, storyIdx, stories]);

  // ---- Get duration for current story ----
  const getDuration = useCallback((): number => {
    if (isVideo && currentStory?.duration) {
      return currentStory.duration * 1000;
    }
    return IMAGE_DURATION;
  }, [isVideo, currentStory]);

  // ---- Progress timer (images) ----
  useEffect(() => {
    if (!currentStory || isVideo) return;

    const duration = getDuration();

    const tick = () => {
      if (isPaused) {
        timerRef.current = requestAnimationFrame(tick);
        return;
      }
      const now = performance.now();
      const delta = now - startTimeRef.current;
      startTimeRef.current = now;
      elapsedRef.current += delta;

      const pct = Math.min(elapsedRef.current / duration, 1);
      setProgress(pct);

      if (pct >= 1) {
        goNextStory();
      } else {
        timerRef.current = requestAnimationFrame(tick);
      }
    };

    startTimeRef.current = performance.now();
    timerRef.current = requestAnimationFrame(tick);

    return () => {
      if (timerRef.current !== null) cancelAnimationFrame(timerRef.current);
    };
  }, [currentStory, isVideo, isPaused, getDuration, goNextStory]);

  // ---- Video progress sync ----
  useEffect(() => {
    if (!isVideo || !videoRef.current) return;
    const video = videoRef.current;

    const onTimeUpdate = () => {
      if (video.duration) {
        setProgress(video.currentTime / video.duration);
      }
    };
    const onEnded = () => {
      goNextStory();
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", onEnded);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", onEnded);
    };
  }, [isVideo, goNextStory, creatorIdx, storyIdx]);

  // ---- Pause / resume video when isPaused changes ----
  useEffect(() => {
    if (!isVideo || !videoRef.current) return;
    if (isPaused) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
  }, [isPaused, isVideo]);

  // ---- Track view on story change ----
  useEffect(() => {
    if (currentStory) {
      trackView(currentStory.id);
    }
  }, [currentStory, trackView]);

  // ---- Keyboard navigation ----
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
          goNextStory();
          break;
        case "ArrowLeft":
          goPrevStory();
          break;
        case "Escape":
          onClose();
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNextStory, goPrevStory, onClose]);

  // ---- Lock body scroll ----
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // ---- Touch handlers for swipe / hold ----
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up hold timer on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    };
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      setTouchStart({ x: touch.clientX, y: touch.clientY });

      // Long press to pause
      holdTimerRef.current = setTimeout(() => {
        setIsPaused(true);
      }, 200);
    },
    [],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }

      // Resume if was paused by hold
      if (isPaused) {
        setIsPaused(false);
        return;
      }

      if (!touchStart) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStart.x;
      const dy = touch.clientY - touchStart.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // Horizontal swipe (between creators)
      if (absDx > 50 && absDx > absDy * 1.5) {
        if (dx < 0) {
          // Swipe left -> next creator
          if (creatorIdx < stories.length - 1) {
            setCreatorIdx((i) => i + 1);
            setStoryIdx(0);
            setProgress(0);
            elapsedRef.current = 0;
          } else {
            onClose();
          }
        } else {
          // Swipe right -> prev creator
          if (creatorIdx > 0) {
            setCreatorIdx((i) => i - 1);
            setStoryIdx(0);
            setProgress(0);
            elapsedRef.current = 0;
          }
        }
        setTouchStart(null);
        return;
      }

      // Tap: left third = prev, right two-thirds = next
      const screenWidth = window.innerWidth;
      if (touch.clientX < screenWidth / 3) {
        goPrevStory();
      } else {
        goNextStory();
      }
      setTouchStart(null);
    },
    [
      touchStart,
      isPaused,
      creatorIdx,
      stories,
      onClose,
      goNextStory,
      goPrevStory,
    ],
  );

  const handleTouchMove = useCallback(() => {
    // Cancel long-press if user moves
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  // ---- Click handlers for desktop ----
  const handleLeftClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      goPrevStory();
    },
    [goPrevStory],
  );

  const handleRightClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      goNextStory();
    },
    [goNextStory],
  );

  if (!currentCreator || !currentStory) return null;

  const storyCount = currentCreator.stories.length;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
    >
      {/* Desktop prev/next arrows */}
      {creatorIdx > 0 && (
        <button
          type="button"
          onClick={() => {
            setCreatorIdx((i) => i - 1);
            setStoryIdx(0);
            setProgress(0);
            elapsedRef.current = 0;
          }}
          className="absolute left-2 top-1/2 z-[110] hidden -translate-y-1/2 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20 md:block"
          aria-label="Previous creator"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      {creatorIdx < stories.length - 1 && (
        <button
          type="button"
          onClick={() => {
            setCreatorIdx((i) => i + 1);
            setStoryIdx(0);
            setProgress(0);
            elapsedRef.current = 0;
          }}
          className="absolute right-2 top-1/2 z-[110] hidden -translate-y-1/2 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20 md:block"
          aria-label="Next creator"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Story container */}
      <div className="relative h-full w-full max-w-[480px] overflow-hidden bg-black md:h-[calc(100vh-40px)] md:max-h-[920px] md:rounded-2xl">
        {/* Progress bars */}
        <div className="absolute left-0 right-0 top-0 z-[105] flex gap-1 px-3 pt-3">
          {Array.from({ length: storyCount }, (_, i) => {
            let barProgress = 0;
            if (i < storyIdx) barProgress = 1;
            else if (i === storyIdx) barProgress = progress;
            return (
              <div
                key={`bar-${currentCreator.creator_id}-${i}`}
                className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30"
              >
                <div
                  className="h-full rounded-full bg-white transition-none"
                  style={{ width: `${barProgress * 100}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* Header */}
        <div className="absolute left-0 right-0 top-0 z-[104] flex items-center gap-3 bg-gradient-to-b from-black/60 to-transparent px-4 pb-8 pt-8">
          <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full border-2 border-white/40">
            {currentCreator.avatar_url ? (
              <img
                src={currentCreator.avatar_url}
                alt={currentCreator.display_name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-600 text-sm font-semibold text-white">
                {currentCreator.display_name.charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {currentCreator.username}
            </p>
          </div>
          <span className="text-xs text-white/70">
            {timeAgo(currentStory.created_at)}
          </span>
          {isVideo && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted((m) => !m);
              }}
              className="rounded-full bg-black/30 p-1.5 text-white/80 transition-colors hover:bg-black/50"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="rounded-full bg-black/30 p-1.5 text-white/80 transition-colors hover:bg-black/50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Media */}
        <div className="flex h-full w-full items-center justify-center">
          {isVideo ? (
            <video
              ref={videoRef}
              key={currentStory.id}
              src={currentStory.media_url}
              className="h-full w-full object-contain"
              autoPlay
              muted={isMuted}
              playsInline
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted((m) => !m);
              }}
            />
          ) : (
            <img
              key={currentStory.id}
              src={currentStory.media_url}
              alt={currentStory.caption ?? "Story"}
              className="h-full w-full object-contain"
              draggable={false}
            />
          )}
        </div>

        {/* Caption */}
        {currentStory.caption && (
          <div className="absolute bottom-0 left-0 right-0 z-[104] bg-gradient-to-t from-black/70 to-transparent px-5 pb-6 pt-16">
            <p className="text-sm leading-relaxed text-white drop-shadow-sm">
              {currentStory.caption}
            </p>
          </div>
        )}

        {/* Desktop tap zones */}
        <div className="absolute inset-0 z-[103] hidden md:flex">
          <button
            type="button"
            className="h-full w-1/3 cursor-pointer bg-transparent"
            onClick={handleLeftClick}
            aria-label="Previous story"
          />
          <div className="h-full w-1/3" />
          <button
            type="button"
            className="h-full w-1/3 cursor-pointer bg-transparent"
            onClick={handleRightClick}
            aria-label="Next story"
          />
        </div>
      </div>
    </div>
  );
}
