/**
 * Sanitize a redirect path to prevent open redirect attacks.
 * Only allows relative paths starting with / and blocks protocol-relative URLs,
 * backslash injection, and protocol indicators.
 */
export function sanitizeRedirectPath(path: string): string {
  if (
    !path.startsWith('/') ||
    path.startsWith('//') ||
    path.includes('\\') ||
    path.includes(':')
  ) {
    return '/'
  }
  return path
}
