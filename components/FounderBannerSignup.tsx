"use client";

import { useEffect, useState } from "react";
import { Crown } from "lucide-react";

/**
 * Compact founder promotion banner for the signup page.
 * Fetches spot count from /api/founder-count and displays
 * an amber-themed banner above the signup form.
 */
export function FounderBannerSignup() {
  const [spotsRemaining, setSpotsRemaining] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    fetch("/api/founder-count")
      .then((res) => res.json())
      .then((data) => {
        if (data.spots_remaining !== undefined) {
          setSpotsRemaining(data.spots_remaining);
          setIsActive(data.is_active);
        }
      })
      .catch(() => {
        // Non-critical
      });
  }, []);

  if (spotsRemaining === null || !isActive) return null;

  return (
    <div className="mb-4 rounded-xl border border-amber-200/60 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 text-center shadow-sm">
      <div className="flex items-center justify-center gap-2">
        <Crown className="h-4 w-4 text-amber-500" />
        <span className="text-sm font-semibold text-amber-800">
          Founding Creator Offer
        </span>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-amber-700/80">
        Join as one of our first 100 Founding Creators &mdash;{" "}
        <span className="font-bold text-amber-700">5% fee for life</span>,
        even on adult content.{" "}
        <span
          className={`font-bold ${
            spotsRemaining <= 10 ? "text-red-600" : "text-amber-700"
          }`}
        >
          {spotsRemaining} spots left!
        </span>
      </p>
    </div>
  );
}
