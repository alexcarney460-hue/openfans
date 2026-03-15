export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db/db";
import { sql } from "drizzle-orm";
import { sendRawEmail } from "@/utils/email";
import {
  welcomeCreatorEmail,
  profileReminderEmail,
  firstPostNudgeEmail,
  walletSetupEmail,
  verificationReminderEmail,
} from "@/utils/email-templates";
import type { EmailTemplate } from "@/utils/email-templates";
import { timingSafeEqual } from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CreatorRow {
  readonly user_id: string;
  readonly email: string;
  readonly display_name: string;
}

interface StageResult {
  readonly stage: string;
  readonly found: number;
  readonly sent: number;
  readonly failed: number;
}

// ---------------------------------------------------------------------------
// HTML escaping for display names in email templates
// ---------------------------------------------------------------------------

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ---------------------------------------------------------------------------
// Stage definitions
// ---------------------------------------------------------------------------

interface OnboardingStage {
  readonly name: string;
  readonly step: number;
  readonly template: (name: string) => EmailTemplate;
  readonly daysAgo: number;
  readonly extraCondition?: string;
}

const STAGES: readonly OnboardingStage[] = [
  {
    name: "welcome",
    step: 0,
    daysAgo: 0,
    template: welcomeCreatorEmail,
  },
  {
    name: "profile_reminder",
    step: 1,
    daysAgo: 1,
    template: profileReminderEmail,
    extraCondition: `AND (
      u.avatar_url IS NULL
      OR u.bio IS NULL OR u.bio = ''
      OR cp.subscription_price_usdc = 0
    )`,
  },
  {
    name: "first_post_nudge",
    step: 2,
    daysAgo: 3,
    template: firstPostNudgeEmail,
    extraCondition: `AND (SELECT COUNT(*) FROM posts WHERE posts.creator_id = u.id) = 0`,
  },
  {
    name: "wallet_setup",
    step: 3,
    daysAgo: 5,
    template: walletSetupEmail,
    extraCondition: `AND u.wallet_address IS NULL`,
  },
  {
    name: "verification_reminder",
    step: 4,
    daysAgo: 7,
    template: verificationReminderEmail,
    extraCondition: `AND u.is_verified = false`,
  },
];

/**
 * Build UTC date bounds for "created exactly N days ago" (24-hour window).
 */
function dayAgoBounds(daysAgo: number): { start: Date; end: Date } {
  const now = new Date();
  const target = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysAgo,
    0, 0, 0, 0,
  ));
  const endOfDay = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysAgo,
    23, 59, 59, 999,
  ));
  return { start: target, end: endOfDay };
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

/**
 * GET /api/cron/onboarding-emails
 *
 * Processes the creator onboarding email sequence. Each stage targets
 * creators at a specific day after signup who haven't yet completed the
 * relevant action. Progress is tracked via `onboarding_step` on
 * creator_profiles.
 *
 * Protected by CRON_SECRET bearer token.
 */
export async function GET(request: NextRequest) {
  try {
    // ---- Auth (timing-safe comparison) ----
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || !authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const expectedToken = `Bearer ${cronSecret}`;
    if (!isTimingSafeEqual(authHeader, expectedToken)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ---- Ensure onboarding_step column exists (idempotent) ----
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'creator_profiles' AND column_name = 'onboarding_step'
        ) THEN
          ALTER TABLE creator_profiles ADD COLUMN onboarding_step integer NOT NULL DEFAULT 0;
        END IF;
      END $$;
    `);

    // ---- Process each stage ----
    const results: StageResult[] = [];

    for (const stage of STAGES) {
      const stageResult = await processStage(stage);
      results.push(stageResult);
    }

    const totalSent = results.reduce((sum, r) => sum + r.sent, 0);
    const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);

    return NextResponse.json({
      success: true,
      summary: { total_sent: totalSent, total_failed: totalFailed },
      stages: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron onboarding-emails error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// Stage processor — uses parameterized queries instead of string interpolation
// ---------------------------------------------------------------------------

async function processStage(stage: OnboardingStage): Promise<StageResult> {
  const result: { stage: string; found: number; sent: number; failed: number } = {
    stage: stage.name,
    found: 0,
    sent: 0,
    failed: 0,
  };

  try {
    const bounds = dayAgoBounds(stage.daysAgo);

    // Build parameterized query for this stage
    const queryResult = await db.execute(sql`
      SELECT u.id AS user_id, u.email, u.display_name
      FROM users_table u
      JOIN creator_profiles cp ON cp.user_id = u.id
      WHERE u.role = 'creator'
        AND u.is_suspended = false
        AND u.created_at >= ${bounds.start}
        AND u.created_at <= ${bounds.end}
        AND COALESCE(cp.onboarding_step, 0) = ${stage.step}
    `);

    // db.execute returns rows directly as an array-like object
    const rows = [...queryResult] as unknown as CreatorRow[];

    // If the stage has extra conditions, we filter in SQL above for the base case.
    // For stages with extra conditions, we need to run stage-specific queries.
    let eligibleRows: CreatorRow[];

    if (stage.extraCondition) {
      // Re-query with the extra condition using parameterized base + raw condition
      // The extra conditions only reference table columns, not user input, so sql.raw is safe here
      const filteredResult = await db.execute(sql.join([
        sql`
          SELECT u.id AS user_id, u.email, u.display_name
          FROM users_table u
          JOIN creator_profiles cp ON cp.user_id = u.id
          WHERE u.role = 'creator'
            AND u.is_suspended = false
            AND u.created_at >= ${bounds.start}
            AND u.created_at <= ${bounds.end}
            AND COALESCE(cp.onboarding_step, 0) = ${stage.step}
        `,
        sql.raw(stage.extraCondition),
      ], sql` `));
      eligibleRows = [...filteredResult] as unknown as CreatorRow[];
    } else {
      eligibleRows = rows;
    }

    result.found = eligibleRows.length;

    for (const row of eligibleRows) {
      // Escape display name to prevent XSS in email HTML
      const safeName = escapeHtml(row.display_name || "Creator");
      const { subject, html } = stage.template(safeName);
      const sent = await sendRawEmail(row.email, subject, html);

      // Advance onboarding_step regardless of send success to avoid retry loops
      await db.execute(sql`
        UPDATE creator_profiles
        SET onboarding_step = ${stage.step + 1}
        WHERE user_id = ${row.user_id}
          AND COALESCE(onboarding_step, 0) = ${stage.step}
      `);

      if (sent) {
        result.sent++;
      } else {
        result.failed++;
      }
    }
  } catch (error) {
    console.error(`[onboarding-emails] Error in stage "${stage.name}":`, error);
  }

  return result;
}

function isTimingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf-8");
  const bufB = Buffer.from(b, "utf-8");

  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufA, bufA);
    return false;
  }

  return timingSafeEqual(bufA, bufB);
}
