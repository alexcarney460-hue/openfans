/**
 * Shared admin email configuration.
 *
 * Reads from the ADMIN_EMAILS environment variable (comma-separated list).
 * Falls back to the original hardcoded email when the env var is not set.
 */

const FALLBACK_ADMIN_EMAILS = ["gardenablaze@gmail.com"]

export function getAdminEmails(): string[] {
  const envValue = process.env.ADMIN_EMAILS
  if (!envValue) {
    return FALLBACK_ADMIN_EMAILS
  }
  return envValue
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0)
}

export function isAdminEmail(email: string): boolean {
  return getAdminEmails().includes(email.toLowerCase())
}
