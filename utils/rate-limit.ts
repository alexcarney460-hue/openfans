import { NextRequest, NextResponse } from "next/server";

/**
 * Simple in-memory rate limiter using a sliding window.
 * For production with multiple instances, use @upstash/ratelimit with Redis.
 */

interface RateLimitEntry {
  readonly count: number;
  readonly resetAt: number;
}

const limiters = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  limiters.forEach((entry, key) => {
    if (now > entry.resetAt) limiters.delete(key);
  });
}, 60_000);

interface RateLimitResult {
  readonly success: boolean;
  readonly remaining: number;
  readonly resetAt: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const entry = limiters.get(key);

  if (!entry || now > entry.resetAt) {
    limiters.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  const newCount = entry.count + 1;
  limiters.set(key, { count: newCount, resetAt: entry.resetAt });

  if (newCount > limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { success: true, remaining: limit - newCount, resetAt: entry.resetAt };
}

/**
 * Extract a rate-limit key from the request.
 * Uses the authenticated userId if available, otherwise falls back to IP.
 */
export function getRateLimitKey(
  request: NextRequest,
  userId?: string,
): string {
  if (userId) return userId;

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown-ip";
  return `ip:${ip}`;
}

/**
 * Check rate limit and return a 429 response if exceeded.
 * Returns null if the request is within limits.
 */
export function checkRateLimit(
  request: NextRequest,
  identifier: string,
  routeKey: string,
  limit: number,
  windowMs: number,
): NextResponse | null {
  const key = `${routeKey}:${identifier}`;
  const result = rateLimit(key, limit, windowMs);

  if (!result.success) {
    const retryAfterSeconds = Math.ceil((result.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      {
        error: "Too many requests. Please try again later.",
        code: "RATE_LIMIT_EXCEEDED",
        retryAfter: retryAfterSeconds,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSeconds),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
        },
      },
    );
  }

  return null;
}
