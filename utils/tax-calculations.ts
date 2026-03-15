/**
 * Tax calculation utilities for 1099 reporting.
 *
 * All monetary values are in USDC cents (integer).
 *
 * Platform fees are differentiated by content type:
 *   - Adult creators: 10% fee, 90% creator share
 *   - Non-adult creators: 5% fee, 95% creator share
 *
 * Legacy constants (PLATFORM_FEE_RATE, CREATOR_SHARE_RATE) are kept
 * for backward compatibility but callers should prefer
 * getCreatorFeeRate() for accurate per-creator rates.
 */

import {
  STANDARD_FEE_RATE,
  STANDARD_SHARE_RATE,
  ADULT_FEE_RATE,
  ADULT_SHARE_RATE,
} from "@/utils/fees";

/** @deprecated Use getCreatorFeeRate(isAdult) instead. Default (non-adult) fee. */
export const PLATFORM_FEE_RATE = STANDARD_FEE_RATE;

/** @deprecated Use getCreatorFeeRate(isAdult) instead. Default (non-adult) share. */
export const CREATOR_SHARE_RATE = STANDARD_SHARE_RATE;

/** Default IRS 1099-NEC reporting threshold: $600.00 expressed in cents. */
export const DEFAULT_1099_THRESHOLD = 60000;

/**
 * Return the fee and share rates based on whether the creator
 * publishes adult content.
 *
 * @param isAdult - true if the creator's categories include 'adult'
 * @returns { feeRate, shareRate } as decimals
 */
export function getCreatorFeeRate(isAdult: boolean): {
  feeRate: number;
  shareRate: number;
} {
  if (isAdult) {
    return { feeRate: ADULT_FEE_RATE, shareRate: ADULT_SHARE_RATE };
  }
  return { feeRate: STANDARD_FEE_RATE, shareRate: STANDARD_SHARE_RATE };
}

/**
 * Calculate the creator's share after the platform fee.
 * Uses integer math (floor) to avoid floating-point drift.
 *
 * @param grossCents - Gross earnings in USDC cents
 * @param shareRate  - Creator share as a decimal (default 0.95 for non-adult)
 * @returns Net earnings in USDC cents (integer)
 */
export function calculateCreatorShare(
  grossCents: number,
  shareRate: number = STANDARD_SHARE_RATE,
): number {
  return Math.floor(grossCents * shareRate);
}

/**
 * Check whether a creator's net earnings meet or exceed the 1099 threshold.
 *
 * @param netCents       - Net (after-fee) earnings in USDC cents
 * @param thresholdCents - Reporting threshold in cents (default $600)
 */
export function isAboveThreshold(
  netCents: number,
  thresholdCents: number = DEFAULT_1099_THRESHOLD,
): boolean {
  return netCents >= thresholdCents;
}

/**
 * Return the UTC date range for a given tax year (Jan 1 00:00:00 to Dec 31 23:59:59.999).
 *
 * @param year - Four-digit calendar year
 * @returns Object with `start` and `end` Date instances (UTC)
 */
export function formatTaxYear(year: number): { start: Date; end: Date } {
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new Error(`Invalid tax year: ${year}`);
  }

  return {
    start: new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0)),
    end: new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)),
  };
}
