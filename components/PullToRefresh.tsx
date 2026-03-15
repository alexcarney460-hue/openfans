"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;

export default function PullToRefresh() {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const isPulling = useRef(false);
  const pullDistanceRef = useRef(0);
  const router = useRouter();

  // Keep ref in sync with state
  useEffect(() => {
    pullDistanceRef.current = pullDistance;
  }, [pullDistance]);

  useEffect(() => {
    // Add overscroll-behavior to prevent native pull-to-refresh conflict
    document.documentElement.style.overscrollBehaviorY = "contain";

    function handleTouchStart(e: TouchEvent) {
      if (isRefreshing) return;
      if (window.scrollY > 5) return;
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    }

    function handleTouchMove(e: TouchEvent) {
      if (!isPulling.current || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const delta = currentY - startY.current;

      if (delta > 0 && window.scrollY <= 0) {
        const resistance = Math.min(delta * 0.4, MAX_PULL);
        setPullDistance(resistance);
        pullDistanceRef.current = resistance;

        if (resistance > 5) {
          e.preventDefault();
        }
      } else {
        setPullDistance(0);
        pullDistanceRef.current = 0;
      }
    }

    function handleTouchEnd() {
      if (!isPulling.current) return;
      isPulling.current = false;

      if (pullDistanceRef.current >= PULL_THRESHOLD && !isRefreshing) {
        setIsRefreshing(true);
        setPullDistance(PULL_THRESHOLD * 0.6);

        setTimeout(() => {
          router.refresh();
          setIsRefreshing(false);
          setPullDistance(0);
        }, 400);
      } else {
        setPullDistance(0);
      }
    }

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      document.documentElement.style.overscrollBehaviorY = "";
    };
  }, [isRefreshing, router]);

  if (pullDistance === 0 && !isRefreshing) return null;

  return (
    <div
      className="pointer-events-none fixed left-0 right-0 top-0 z-[60] flex justify-center"
      style={{ transform: `translateY(${pullDistance - 40}px)` }}
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg border border-gray-200"
      >
        <svg
          className={`h-5 w-5 text-[#00AFF0] ${isRefreshing ? "animate-spin" : ""}`}
          style={{
            transform: isRefreshing
              ? undefined
              : `rotate(${Math.min(pullDistance / PULL_THRESHOLD, 1) * 360}deg)`,
          }}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      </div>
    </div>
  );
}
