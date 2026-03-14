import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Distributed rate limiter with Redis-backed sliding window (Upstash).
 * Falls back to in-memory Map for local development when Upstash is not configured.
 */

// ---------------------------------------------------------------------------
// In-memory fallback (local dev without Redis)
// ---------------------------------------------------------------------------

interface RateLimitEntry {
  readonly count: number;
  readonly resetAt: number;
}

const limiters = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    limiters.forEach((entry, key) => {
      if (now > entry.resetAt) limiters.delete(key);
    });
  }, 60_000);
}

interface RateLimitResult {
  readonly success: boolean;
  readonly remaining: number;
  readonly resetAt: number;
}

function inMemoryRateLimit(
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

// ---------------------------------------------------------------------------
// Upstash Redis rate limiter (production)
// ---------------------------------------------------------------------------

function isUpstashConfigured(): boolean {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

/** Cache of Upstash Ratelimit instances keyed by "limit:windowSec" */
const upstashLimiters = new Map<string, Ratelimit>();

function getUpstashLimiter(limit: number, windowMs: number): Ratelimit {
  const windowSec = Math.ceil(windowMs / 1000);
  const cacheKey = `${limit}:${windowSec}`;

  const cached = upstashLimiters.get(cacheKey);
  if (cached) return cached;

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
    analytics: false,
    prefix: "openfans:rl",
  });

  upstashLimiters.set(cacheKey, limiter);
  return limiter;
}

// ---------------------------------------------------------------------------
// Public API — same signatures as original (checkRateLimit is now async)
// ---------------------------------------------------------------------------

/**
 * Low-level rate limit check. Prefer `checkRateLimit` in route handlers.
 *
 * @deprecated Kept for backward compatibility. Use `checkRateLimit` instead.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  return inMemoryRateLimit(key, limit, windowMs);
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
 *
 * Uses Upstash Redis when configured, otherwise falls back to in-memory.
 */
export async function checkRateLimit(
  request: NextRequest,
  identifier: string,
  routeKey: string,
  limit: number,
  windowMs: number,
): Promise<NextResponse | null> {
  const key = `${routeKey}:${identifier}`;

  // --- Upstash Redis path ---
  if (isUpstashConfigured()) {
    const limiter = getUpstashLimiter(limit, windowMs);
    const { success, remaining, reset } = await limiter.limit(key);

    if (!success) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((reset - Date.now()) / 1000),
      );
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
            "X-RateLimit-Reset": String(Math.ceil(reset / 1000)),
          },
        },
      );
    }

    return null;
  }

  // --- In-memory fallback ---
  const result = inMemoryRateLimit(key, limit, windowMs);

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
