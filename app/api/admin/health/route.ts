import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/utils/api/auth";
import { db } from "@/utils/db/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ServiceCheck {
  status: "healthy" | "degraded" | "down";
  latency_ms: number;
  error?: string;
}

interface HealthMetrics {
  pending_payouts: number;
  unverified_creators: number;
  recent_signups: number;
  total_users: number;
}

interface HealthResponse {
  timestamp: string;
  services: {
    database: ServiceCheck;
    solana_rpc: ServiceCheck;
  };
  metrics: HealthMetrics;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

async function checkDatabase(): Promise<ServiceCheck> {
  const start = performance.now();
  try {
    await withTimeout(db.execute(sql`SELECT 1`), 5000);
    const latency = Math.round(performance.now() - start);
    return {
      status: latency > 2000 ? "degraded" : "healthy",
      latency_ms: latency,
    };
  } catch (err) {
    return {
      status: "down",
      latency_ms: Math.round(performance.now() - start),
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

async function checkSolanaRpc(): Promise<ServiceCheck> {
  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
  if (!rpcUrl) {
    return { status: "down", latency_ms: 0, error: "NEXT_PUBLIC_SOLANA_RPC_URL not configured" };
  }

  const start = performance.now();
  try {
    const response = await withTimeout(
      fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getLatestBlockhash",
          params: [{ commitment: "finalized" }],
        }),
      }),
      5000,
    );

    const latency = Math.round(performance.now() - start);

    if (!response.ok) {
      return { status: "down", latency_ms: latency, error: `HTTP ${response.status}` };
    }

    const json = await response.json();
    if (json.error) {
      return { status: "degraded", latency_ms: latency, error: json.error.message };
    }

    return {
      status: latency > 3000 ? "degraded" : "healthy",
      latency_ms: latency,
    };
  } catch (err) {
    return {
      status: "down",
      latency_ms: Math.round(performance.now() - start),
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

async function fetchMetrics(): Promise<HealthMetrics> {
  const [pendingResult, unverifiedResult, signupsResult, totalResult] =
    await Promise.allSettled([
      withTimeout(
        db.execute(
          sql`SELECT COUNT(*)::int AS count FROM payouts WHERE status = 'pending'`,
        ),
        5000,
      ),
      withTimeout(
        db.execute(
          sql`SELECT COUNT(*)::int AS count FROM users_table WHERE role = 'creator' AND is_verified = false`,
        ),
        5000,
      ),
      withTimeout(
        db.execute(
          sql`SELECT COUNT(*)::int AS count FROM users_table WHERE created_at > NOW() - INTERVAL '24 hours'`,
        ),
        5000,
      ),
      withTimeout(
        db.execute(sql`SELECT COUNT(*)::int AS count FROM users_table`),
        5000,
      ),
    ]);

  const extractCount = (
    result: PromiseSettledResult<unknown>,
  ): number => {
    if (result.status === "fulfilled") {
      const value = result.value;
      // drizzle execute() returns an array-like result directly
      const rows = Array.isArray(value)
        ? value
        : (value as Record<string, unknown>)?.rows;
      if (Array.isArray(rows) && rows.length > 0) {
        return Number((rows[0] as Record<string, unknown>).count) || 0;
      }
    }
    return 0;
  };

  return {
    pending_payouts: extractCount(pendingResult),
    unverified_creators: extractCount(unverifiedResult),
    recent_signups: extractCount(signupsResult),
    total_users: extractCount(totalResult),
  };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET() {
  const { error } = await getAuthenticatedAdmin();
  if (error) return error;

  const [dbCheck, solanaCheck, metrics] = await Promise.allSettled([
    checkDatabase(),
    checkSolanaRpc(),
    fetchMetrics(),
  ]);

  const response: HealthResponse = {
    timestamp: new Date().toISOString(),
    services: {
      database:
        dbCheck.status === "fulfilled"
          ? dbCheck.value
          : { status: "down", latency_ms: 0, error: "Check failed" },
      solana_rpc:
        solanaCheck.status === "fulfilled"
          ? solanaCheck.value
          : { status: "down", latency_ms: 0, error: "Check failed" },
    },
    metrics:
      metrics.status === "fulfilled"
        ? metrics.value
        : { pending_payouts: 0, unverified_creators: 0, recent_signups: 0, total_users: 0 },
  };

  return NextResponse.json({ data: response });
}
