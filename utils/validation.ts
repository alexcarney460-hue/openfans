/**
 * Shared input validation utilities for API route handlers.
 */

/**
 * Validates that a URL is a trusted storage URL (Supabase or Google avatar).
 * Rejects arbitrary URLs to prevent SSRF and stored XSS via javascript: URIs.
 */
export function isValidStorageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      (parsed.hostname.endsWith(".supabase.co") ||
        parsed.hostname === "lh3.googleusercontent.com")
    );
  } catch {
    return false;
  }
}

/**
 * Validates that a monetary amount (in cents) is a safe positive integer
 * within a reasonable maximum ($10,000).
 */
export function isValidAmount(amount: number): boolean {
  return Number.isInteger(amount) && amount > 0 && amount <= 10_000_00;
}

/**
 * Validates a Solana wallet address (base58-encoded, 32-44 characters).
 */
export function isValidSolanaAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

/**
 * Validates that the first bytes of a file buffer match the expected MIME type.
 * Prevents uploading disguised files (e.g., an executable renamed to .jpg).
 */
export function validateMagicBytes(
  buffer: ArrayBuffer,
  mimeType: string,
): boolean {
  const bytes = new Uint8Array(buffer);

  // Each MIME type maps to one or more valid magic byte signatures.
  // For video/mp4 and video/quicktime, the `ftyp` marker starts at offset 4.
  const signatures: Record<
    string,
    { offset: number; bytes: number[] }[]
  > = {
    "image/jpeg": [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }],
    "image/png": [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47] }],
    "image/gif": [{ offset: 0, bytes: [0x47, 0x49, 0x46, 0x38] }],
    "image/webp": [{ offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }],
    "video/mp4": [{ offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] }],
    "video/quicktime": [{ offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] }],
  };

  const validSigs = signatures[mimeType];
  if (!validSigs) return false;

  for (const sig of validSigs) {
    let matches = true;
    for (let i = 0; i < sig.bytes.length; i++) {
      if (bytes[sig.offset + i] !== sig.bytes[i]) {
        matches = false;
        break;
      }
    }
    if (matches) return true;
  }

  return false;
}
