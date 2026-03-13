import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { contactMessagesTable } from "@/utils/db/schema";
import { checkRateLimit, getRateLimitKey } from "@/utils/rate-limit";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE_LENGTH = 5000;
const MAX_FIELD_LENGTH = 200;

/**
 * POST /api/contact
 * Stores a contact form submission.
 *
 * Body:
 *   - name: string (required)
 *   - email: string (required, valid email)
 *   - subject: string (optional)
 *   - message: string (required)
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 requests per minute per IP (unauthenticated endpoint)
    const rateLimitKey = getRateLimitKey(request);
    const rateLimited = checkRateLimit(request, rateLimitKey, "contact", 5, 60_000);
    if (rateLimited) return rateLimited;
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body", code: "INVALID_BODY" },
        { status: 400 },
      );
    }

    const { name, email, subject, message } = body;

    // Honeypot anti-spam check: the "website" field is hidden via CSS,
    // so real users will never fill it in. Bots get a fake success response.
    if (body.website) {
      return NextResponse.json({ data: { success: true } });
    }

    // Validate required fields
    if (typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Name is required", code: "INVALID_NAME" },
        { status: 400 },
      );
    }

    if (name.trim().length > MAX_FIELD_LENGTH) {
      return NextResponse.json(
        { error: `Name must be under ${MAX_FIELD_LENGTH} characters`, code: "NAME_TOO_LONG" },
        { status: 400 },
      );
    }

    if (typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json(
        { error: "A valid email address is required", code: "INVALID_EMAIL" },
        { status: 400 },
      );
    }

    if (typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required", code: "INVALID_MESSAGE" },
        { status: 400 },
      );
    }

    if (message.trim().length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message must be under ${MAX_MESSAGE_LENGTH} characters`, code: "MESSAGE_TOO_LONG" },
        { status: 400 },
      );
    }

    const inserted = await db
      .insert(contactMessagesTable)
      .values({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: typeof subject === "string" && subject.trim() ? subject.trim() : null,
        message: message.trim(),
      })
      .returning({ id: contactMessagesTable.id });

    return NextResponse.json(
      { data: { id: inserted[0].id }, message: "Message sent successfully" },
      { status: 201 },
    );
  } catch (err) {
    console.error("POST /api/contact error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
