/**
 * Differentiated platform fee structure.
 *
 * Adult creators pay a 10% platform fee (90% creator share).
 * Non-adult creators pay a 5% platform fee (95% creator share).
 *
 * This module provides helpers to look up a creator's fee rate
 * from the database and compute platform fee / creator share splits.
 *
 * All monetary values are in USDC cents (integer).
 */

import { db } from "@/utils/db/db";
import { sql } from "drizzle-orm";

// ── Fee rate constants ──────────────────────────────────────────────────────

export const ADULT_FEE_RATE = 0.10;
export const ADULT_SHARE_RATE = 0.90;
export const STANDARD_FEE_RATE = 0.05;
export const STANDARD_SHARE_RATE = 0.95;

export const ADULT_FEE_PERCENT = 10;
export const STANDARD_FEE_PERCENT = 5;

// ── Types ───────────────────────────────────────────────────────────────────

export interface FeeConfig {
  /** Platform fee as a decimal (0.05 or 0.10). */
  feeRate: number;
  /** Creator share as a decimal (0.95 or 0.90). */
  shareRate: number;
  /** Platform fee as an integer percent (5 or 10). */
  feePercent: number;
  /** Whether the creator is classified as adult content. */
  isAdult: boolean;
}

// ── Simple per-request memoization cache ────────────────────────────────────

const feeConfigCache = new Map<string, { config: FeeConfig; timestamp: number }>();
const CACHE_TTL_MS = 30_000; // 30 seconds — short enough to pick up changes quickly

function getCachedConfig(creatorId: string): FeeConfig | null {
  const entry = feeConfigCache.get(creatorId);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    feeConfigCache.delete(creatorId);
    return null;
  }
  return entry.config;
}

function setCachedConfig(creatorId: string, config: FeeConfig): void {
  // Prevent unbounded cache growth in long-lived processes
  if (feeConfigCache.size > 500) {
    // Evict oldest entries
    const entries = Array.from(feeConfigCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    for (let i = 0; i < 250; i++) {
      feeConfigCache.delete(entries[i][0]);
    }
  }
  feeConfigCache.set(creatorId, { config, timestamp: Date.now() });
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Determine whether a categories array marks a creator as "adult".
 * Checks for the literal string "adult" (case-insensitive).
 */
export function isAdultCreator(categories: string[]): boolean {
  return categories.some(
    (cat) => cat.toLowerCase() === "adult",
  );
}

/**
 * Return the fee configuration for a boolean adult flag.
 * Pure function, no DB access.
 */
export function getFeeConfigForType(isAdult: boolean): FeeConfig {
  if (isAdult) {
    return {
      feeRate: ADULT_FEE_RATE,
      shareRate: ADULT_SHARE_RATE,
      feePercent: ADULT_FEE_PERCENT,
      isAdult: true,
    };
  }
  return {
    feeRate: STANDARD_FEE_RATE,
    shareRate: STANDARD_SHARE_RATE,
    feePercent: STANDARD_FEE_PERCENT,
    isAdult: false,
  };
}

/**
 * Look up a creator's fee configuration from the database.
 * Checks the `categories` column on `creator_profiles` for 'adult'.
 * Results are cached for 30 seconds to avoid repeated DB hits within
 * the same request or closely-spaced requests.
 *
 * @param creatorId - The user ID of the creator
 * @returns Fee configuration including rates and adult status
 * @throws Error if the creator profile is not found
 */
export async function getCreatorFeeConfig(creatorId: string): Promise<FeeConfig> {
  // Check cache first
  const cached = getCachedConfig(creatorId);
  if (cached) return cached;

  // Use raw SQL to include is_founder + fee_override (not in Drizzle schema)
  const rows = await db.execute(
    sql`SELECT categories, COALESCE(is_founder, false) AS is_founder, fee_override
        FROM creator_profiles
        WHERE user_id = ${creatorId}
        LIMIT 1`,
  );

  if (rows.length === 0) {
    return getFeeConfigForType(false);
  }

  const row = rows[0] as { categories: string[] | null; is_founder: boolean; fee_override: number | null };
  const isFounder = row.is_founder === true;

  // Custom fee_override takes priority (e.g., 0% for special partners)
  if (row.fee_override !== null && row.fee_override !== undefined) {
    const overrideRate = row.fee_override / 100;
    const config: FeeConfig = {
      feeRate: overrideRate,
      shareRate: 1 - overrideRate,
      feePercent: row.fee_override,
      isAdult: isAdultCreator(row.categories ?? []),
    };
    setCachedConfig(creatorId, config);
    return config;
  }

  // Founders always get the standard 5% fee, even for adult content
  if (isFounder) {
    const config: FeeConfig = {
      feeRate: STANDARD_FEE_RATE,
      shareRate: STANDARD_SHARE_RATE,
      feePercent: STANDARD_FEE_PERCENT,
      isAdult: isAdultCreator(row.categories ?? []),
    };
    setCachedConfig(creatorId, config);
    return config;
  }

  const categories = row.categories ?? [];
  const adult = isAdultCreator(categories);
  const config = getFeeConfigForType(adult);

  setCachedConfig(creatorId, config);
  return config;
}

/**
 * Calculate the platform fee and creator share for a given gross amount.
 * Uses integer math (floor for fee, remainder for creator) to avoid
 * floating-point drift.
 *
 * @param grossCents - Gross payment amount in USDC cents
 * @param feePercent - Fee percentage as integer (5 or 10)
 * @returns Object with platformFee and creatorAmount in cents
 */
export function calculateFeeSplit(
  grossCents: number,
  feePercent: number,
): { platformFee: number; creatorAmount: number } {
  const platformFee = Math.round((grossCents * feePercent) / 100);
  const creatorAmount = grossCents - platformFee;
  return { platformFee, creatorAmount };
}
