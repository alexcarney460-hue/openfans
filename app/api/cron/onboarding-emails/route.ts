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
// Stage definitions
// ---------------------------------------------------------------------------

/**
 * Each onboarding stage defines:
 *  - step: the onboarding_step value the creator must be at to receive this email
 *  - daysAgo: how many days after signup this email fires
 *  - query: raw SQL to find eligible creators
 *  - template: function that builds the email from the creator's display name
 */
interface OnboardingStage {
  readonly name: string;
  readonly step: number;
  readonly template: (name: string) => EmailTemplate;
  readonly query: string;
}

/**
 * Build a date range for "created exactly N days ago" (within a 24-hour window).
 * Returns [startOfDay, endOfDay] in ISO strings for use in SQL.
 */
function dayAgoBounds(daysAgo: number): { start: string; end: string } {
  const now = new Date();
  const target = new Date(now);
  target.setDate(target.getDate() - daysAgo);
  const startOfDay = new Date(target);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(target);
  endOfDay.setHours(23, 59, 59, 999);
  return { start: startOfDay.toISOString(), end: endOfDay.toISOString() };
}

function buildStages(): readonly OnboardingStage[] {
  const day0 = dayAgoBounds(0);
  const day1 = dayAgoBounds(1);
  const day3 = dayAgoBounds(3);
  const day5 = dayAgoBounds(5);
  const day7 = dayAgoBounds(7);

  return [
    {
      name: "welcome",
      step: 0,
      template: welcomeCreatorEmail,
      query: `
        SELECT u.id AS user_id, u.email, u.display_name
        FROM users_table u
        JOIN creator_profiles cp ON cp.user_id = u.id
        WHERE u.role = 'creator'
          AND u.created_at >= '${day0.start}'
          AND u.created_at <= '${day0.end}'
          AND COALESCE(cp.onboarding_step, 0) = 0
      `,
    },
    {
      name: "profile_reminder",
      step: 1,
      template: profileReminderEmail,
      query: `
        SELECT u.id AS user_id, u.email, u.display_name
        FROM users_table u
        JOIN creator_profiles cp ON cp.user_id = u.id
        WHERE u.role = 'creator'
          AND u.created_at >= '${day1.start}'
          AND u.created_at <= '${day1.end}'
          AND COALESCE(cp.onboarding_step, 0) = 1
          AND (
            u.avatar_url IS NULL
            OR u.bio IS NULL OR u.bio = ''
            OR cp.subscription_price_usdc = 0
          )
      `,
    },
    {
      name: "first_post_nudge",
      step: 2,
      template: firstPostNudgeEmail,
      query: `
        SELECT u.id AS user_id, u.email, u.display_name
        FROM users_table u
        JOIN creator_profiles cp ON cp.user_id = u.id
        WHERE u.role = 'creator'
          AND u.created_at >= '${day3.start}'
          AND u.created_at <= '${day3.end}'
          AND COALESCE(cp.onboarding_step, 0) = 2
          AND (
            SELECT COUNT(*) FROM posts WHERE posts.creator_id = u.id
          ) = 0
      `,
    },
    {
      name: "wallet_setup",
      step: 3,
      template: walletSetupEmail,
      query: `
        SELECT u.id AS user_id, u.email, u.display_name
        FROM users_table u
        JOIN creator_profiles cp ON cp.user_id = u.id
        WHERE u.role = 'creator'
          AND u.created_at >= '${day5.start}'
          AND u.created_at <= '${day5.end}'
          AND COALESCE(cp.onboarding_step, 0) = 3
          AND u.wallet_address IS NULL
      `,
    },
    {
      name: "verification_reminder",
      step: 4,
      template: verificationReminderEmail,
      query: `
        SELECT u.id AS user_id, u.email, u.display_name
        FROM users_table u
        JOIN creator_profiles cp ON cp.user_id = u.id
        WHERE u.role = 'creator'
          AND u.created_at >= '${day7.start}'
          AND u.created_at <= '${day7.end}'
          AND COALESCE(cp.onboarding_step, 0) = 4
          AND u.is_verified = false
      `,
    },
  ] as const;
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
 * creator_profiles (added via raw SQL -- no schema change needed).
 *
 * Protected by CRON_SECRET bearer token.
 */
export async function GET(request: NextRequest) {
  try {
    // ---- Auth ----
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
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
    const stages = buildStages();
    const results: StageResult[] = [];

    for (const stage of stages) {
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
// Stage processor
// ---------------------------------------------------------------------------

async function processStage(stage: OnboardingStage): Promise<StageResult> {
  const result: { stage: string; found: number; sent: number; failed: number } = {
    stage: stage.name,
    found: 0,
    sent: 0,
    failed: 0,
  };

  try {
    const rows = await db.execute(sql.raw(stage.query)) as unknown as CreatorRow[];
    result.found = rows.length;

    for (const row of rows) {
      const { subject, html } = stage.template(row.display_name);
      const sent = await sendRawEmail(row.email, subject, html);

      if (sent) {
        // Advance onboarding_step so this creator won't be picked up again
        await db.execute(sql`
          UPDATE creator_profiles
          SET onboarding_step = ${stage.step + 1}
          WHERE user_id = ${row.user_id}
            AND COALESCE(onboarding_step, 0) = ${stage.step}
        `);
        result.sent++;
      } else {
        // sendRawEmail returns false on missing API key or error;
        // still advance the step to avoid retrying endlessly
        await db.execute(sql`
          UPDATE creator_profiles
          SET onboarding_step = ${stage.step + 1}
          WHERE user_id = ${row.user_id}
            AND COALESCE(onboarding_step, 0) = ${stage.step}
        `);
        result.failed++;
      }
    }
  } catch (error) {
    console.error(`[onboarding-emails] Error in stage "${stage.name}":`, error);
  }

  return result;
}
