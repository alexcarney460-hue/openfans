"use client";

import { useCallback } from "react";

export function useTrack() {
  const track = useCallback(
    (
      eventType: string,
      targetId?: string,
      metadata?: Record<string, unknown>,
    ) => {
      // Fire and forget — don't block UI
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: eventType,
          target_id: targetId,
          metadata: metadata ? JSON.stringify(metadata) : undefined,
        }),
      }).catch(() => {}); // silently fail — analytics should never break the app
    },
    [],
  );

  return track;
}
