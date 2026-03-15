"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;

export default function PullToRefresh() {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const isPulling = useRef(false);
  const isTouchDevice = useRef(false);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (isRefreshing) return;
      // Only activate when scrolled to top
      if (window.scrollY > 5) return;

      isTouchDevice.current = true;
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    },
    [isRefreshing]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isPulling.current || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const delta = currentY - startY.current;

      if (delta > 0 && window.scrollY <= 0) {
        // Apply resistance curve for natural feel
        const resistance = Math.min(delta * 0.4, MAX_PULL);
        setPullDistance(resistance);

        // Prevent default scroll when pulling down
        if (resistance > 5) {
          e.preventDefault();
        }
      } else {
        setPullDistance(0);
      }
    },
    [isRefreshing]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD * 0.6);

      // Small delay so user sees the spinner, then reload
      setTimeout(() => {
        location.reload();
      }, 400);
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, isRefreshing]);

  useEffect(() => {
    const options: AddEventListenerOptions = { passive: false };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, options);
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Don't render anything if no pull is happening
  if (pullDistance === 0 && !isRefreshing) return null;

  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const rotation = pullDistance * 3;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex justify-center"
      style={{
        transform: `translateY(${pullDistance - 40}px)`,
        opacity: progress,
        transition: isPulling.current ? "none" : "all 0.3s ease-out",
      }}
    >
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg",
          isRefreshing && "animate-spin"
        )}
      >
        <svg
          className="h-5 w-5 text-[#00AFF0]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isRefreshing ? "none" : `rotate(${rotation}deg)`,
          }}
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      </div>
    </div>
  );
}
