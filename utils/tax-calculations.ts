/**
 * Tax calculation utilities for 1099 reporting.
 *
 * All monetary values are in USDC cents (integer).
 * The platform takes a 5% fee; creators receive 95%.
 */

/** Platform fee as a decimal (5%). */
export const PLATFORM_FEE_RATE = 0.05;

/** Creator share as a decimal (95%). */
export const CREATOR_SHARE_RATE = 0.95;

/** Default IRS 1099-NEC reporting threshold: $600.00 expressed in cents. */
export const DEFAULT_1099_THRESHOLD = 60000;

/**
 * Calculate the creator's share after the platform fee.
 * Uses integer math (floor) to avoid floating-point drift.
 *
 * @param grossCents - Gross earnings in USDC cents
 * @returns Net earnings in USDC cents (integer)
 */
export function calculateCreatorShare(grossCents: number): number {
  return Math.floor(grossCents * CREATOR_SHARE_RATE);
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
