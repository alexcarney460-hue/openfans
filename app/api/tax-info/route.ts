export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/utils/api/auth";
import { db } from "@/utils/db/db";
import { usersTable } from "@/utils/db/schema";
import { eq, sql } from "drizzle-orm";
import { createCipheriv, randomBytes } from "crypto";

// ---------------------------------------------------------------------------
// Encryption helpers (AES-256-GCM)
// ---------------------------------------------------------------------------

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.TAX_ENCRYPTION_KEY;
  if (!key) {
    throw new Error("TAX_ENCRYPTION_KEY environment variable is not set");
  }
  // Key must be exactly 64 hex characters (32 bytes / 256 bits)
  if (key.length !== 64 || !/^[0-9a-fA-F]+$/.test(key)) {
    throw new Error("TAX_ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)");
  }
  return Buffer.from(key, "hex");
}

function encryptTaxId(plaintext: string): { encrypted: Buffer; iv: Buffer } {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
    cipher.getAuthTag(),
  ]);
  return { encrypted, iv };
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

const BUSINESS_TYPES = [
  "individual",
  "sole_proprietor",
  "llc",
  "corporation",
  "partnership",
] as const;

type BusinessType = (typeof BUSINESS_TYPES)[number];

/** Matches SSN (XXX-XX-XXXX) or EIN (XX-XXXXXXX) */
function isValidTaxId(value: string): boolean {
  const ssnPattern = /^\d{3}-\d{2}-\d{4}$/;
  const einPattern = /^\d{2}-\d{7}$/;
  return ssnPattern.test(value) || einPattern.test(value);
}

function extractLast4(taxId: string): string {
  const digits = taxId.replace(/-/g, "");
  return digits.slice(-4);
}

function validateString(val: unknown, fieldName: string, maxLen = 255): string | null {
  if (typeof val !== "string" || val.trim().length === 0) {
    return `${fieldName} is required`;
  }
  if (val.trim().length > maxLen) {
    return `${fieldName} must be ${maxLen} characters or fewer`;
  }
  return null;
}

function validateZip(val: unknown): string | null {
  if (typeof val !== "string" || val.trim().length === 0) {
    return "ZIP code is required";
  }
  // US zip: 5 digits or 5+4
  if (!/^\d{5}(-\d{4})?$/.test(val.trim())) {
    return "Invalid ZIP code format (expected XXXXX or XXXXX-XXXX)";
  }
  return null;
}

function validateState(val: unknown): string | null {
  if (typeof val !== "string" || val.trim().length === 0) {
    return "State is required";
  }
  if (val.trim().length !== 2) {
    return "State must be a 2-letter code (e.g. CA)";
  }
  return null;
}

// ---------------------------------------------------------------------------
// GET /api/tax-info
// Return creator's saved tax info with masked tax ID (last 4 only).
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const { user, error } = await getAuthenticatedUser();
    if (error) return error;

    // Verify user is a creator
    const dbUser = await db
      .select({ role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .limit(1);

    if (dbUser.length === 0 || (dbUser[0].role !== "creator" && dbUser[0].role !== "admin")) {
      return NextResponse.json(
        { error: "Only creators can access tax information", code: "FORBIDDEN" },
        { status: 403 },
      );
    }

    const rows = await db.execute(sql`
      SELECT
        id,
        user_id,
        legal_name,
        business_type,
        tax_id_last4,
        address_line1,
        address_line2,
        city,
        state,
        zip_code,
        country,
        created_at,
        updated_at
      FROM creator_tax_info
      WHERE user_id = ${user.id}
      LIMIT 1
    `);

    if (rows.length === 0) {
      return NextResponse.json({ data: null });
    }

    return NextResponse.json({ data: rows[0] });
  } catch (err) {
    console.error("GET /api/tax-info error:", err instanceof Error ? err.message : "Unknown error");
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PUT /api/tax-info
// Save or update creator's tax information.
// ---------------------------------------------------------------------------

export async function PUT(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError) return authError;

    // Verify user is a creator
    const dbUser = await db
      .select({ role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .limit(1);

    if (dbUser.length === 0 || (dbUser[0].role !== "creator" && dbUser[0].role !== "admin")) {
      return NextResponse.json(
        { error: "Only creators can submit tax information", code: "FORBIDDEN" },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body", code: "INVALID_BODY" },
        { status: 400 },
      );
    }

    const {
      legal_name,
      business_type,
      tax_id,
      address_line1,
      address_line2,
      city,
      state,
      zip_code,
      country,
    } = body;

    // --- Validation ---
    const errors: string[] = [];

    const nameErr = validateString(legal_name, "Legal name");
    if (nameErr) errors.push(nameErr);

    if (!BUSINESS_TYPES.includes(business_type as BusinessType)) {
      errors.push(
        `Business type must be one of: ${BUSINESS_TYPES.join(", ")}`,
      );
    }

    if (typeof tax_id !== "string" || !isValidTaxId(tax_id)) {
      errors.push(
        "Tax ID must be a valid SSN (XXX-XX-XXXX) or EIN (XX-XXXXXXX)",
      );
    }

    const addr1Err = validateString(address_line1, "Address line 1");
    if (addr1Err) errors.push(addr1Err);

    // address_line2 is optional
    if (address_line2 !== undefined && address_line2 !== null && address_line2 !== "") {
      if (typeof address_line2 !== "string" || address_line2.length > 255) {
        errors.push("Address line 2 must be 255 characters or fewer");
      }
    }

    const cityErr = validateString(city, "City");
    if (cityErr) errors.push(cityErr);

    const stateErr = validateState(state);
    if (stateErr) errors.push(stateErr);

    const zipErr = validateZip(zip_code);
    if (zipErr) errors.push(zipErr);

    // Country defaults to US, but validate if provided
    const resolvedCountry =
      typeof country === "string" && country.trim().length > 0
        ? country.trim().toUpperCase()
        : "US";

    if (errors.length > 0) {
      return NextResponse.json(
        { error: errors.join("; "), code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }

    // --- Encrypt tax ID ---
    const { encrypted, iv } = encryptTaxId(tax_id);
    const last4 = extractLast4(tax_id);

    // Upsert: insert or update on conflict (user_id is unique)
    await db.execute(sql`
      INSERT INTO creator_tax_info (
        user_id,
        legal_name,
        business_type,
        tax_id_encrypted,
        tax_id_iv,
        tax_id_last4,
        address_line1,
        address_line2,
        city,
        state,
        zip_code,
        country,
        created_at,
        updated_at
      ) VALUES (
        ${user.id},
        ${(legal_name as string).trim()},
        ${business_type},
        ${encrypted},
        ${iv},
        ${last4},
        ${(address_line1 as string).trim()},
        ${address_line2 ? (address_line2 as string).trim() : null},
        ${(city as string).trim()},
        ${(state as string).trim().toUpperCase()},
        ${(zip_code as string).trim()},
        ${resolvedCountry},
        NOW(),
        NOW()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        legal_name = EXCLUDED.legal_name,
        business_type = EXCLUDED.business_type,
        tax_id_encrypted = EXCLUDED.tax_id_encrypted,
        tax_id_iv = EXCLUDED.tax_id_iv,
        tax_id_last4 = EXCLUDED.tax_id_last4,
        address_line1 = EXCLUDED.address_line1,
        address_line2 = EXCLUDED.address_line2,
        city = EXCLUDED.city,
        state = EXCLUDED.state,
        zip_code = EXCLUDED.zip_code,
        country = EXCLUDED.country,
        updated_at = NOW()
    `);

    return NextResponse.json({
      data: {
        legal_name: (legal_name as string).trim(),
        business_type,
        tax_id_last4: last4,
        address_line1: (address_line1 as string).trim(),
        address_line2: address_line2 ? (address_line2 as string).trim() : null,
        city: (city as string).trim(),
        state: (state as string).trim().toUpperCase(),
        zip_code: (zip_code as string).trim(),
        country: resolvedCountry,
      },
      message: "Tax information saved successfully",
    });
  } catch (err) {
    console.error("PUT /api/tax-info error:", err instanceof Error ? err.message : "Unknown error");
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
