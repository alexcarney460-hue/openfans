"use client";

import { useState, useEffect, useMemo, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import {
  Users,
  DollarSign,
  Zap,
  Shield,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ClaimData {
  readonly id: string;
  readonly platform: string;
  readonly platform_username: string;
  readonly creator_name: string;
  readonly status: string;
  readonly waitlist_count: number;
  readonly created_at: string;
}

// ---------------------------------------------------------------------------
// Earnings Calculator Component
// ---------------------------------------------------------------------------

function EarningsCalculator() {
  const [monthlyEarnings, setMonthlyEarnings] = useState(5000);

  const comparison = useMemo(() => {
    const ofFee = 0.2;
    const openFansFee = 0.05;
    const ofKeep = monthlyEarnings * (1 - ofFee);
    const openFansKeep = monthlyEarnings * (1 - openFansFee);
    const moreMoney = openFansKeep - ofKeep;
    const morePerYear = moreMoney * 12;
    return { ofKeep, openFansKeep, moreMoney, morePerYear };
  }, [monthlyEarnings]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-8">
      <h3 className="mb-1 text-center text-lg font-bold text-gray-900 sm:text-xl">
        See How Much More You&apos;d Earn
      </h3>
      <p className="mb-6 text-center text-sm text-gray-400">
        Compare your take-home on OnlyFans vs OpenFans
      </p>

      {/* Slider */}
      <div className="mb-6">
        <label className="mb-2 block text-center text-sm text-gray-500">
          Your monthly earnings
        </label>
        <div className="mb-2 text-center text-3xl font-extrabold text-gray-900">
          ${monthlyEarnings.toLocaleString()}
          <span className="text-base font-normal text-gray-400">/mo</span>
        </div>
        <input
          type="range"
          min={500}
          max={100000}
          step={500}
          value={monthlyEarnings}
          onChange={(e) => setMonthlyEarnings(Number(e.target.value))}
          className="w-full accent-[#00AFF0]"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>$500</span>
          <span>$100K</span>
        </div>
      </div>

      {/* Comparison bars */}
      <div className="space-y-4">
        {/* OnlyFans */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">OnlyFans (80%)</span>
            <span className="text-sm font-bold text-gray-500">
              ${comparison.ofKeep.toLocaleString()}/mo
            </span>
          </div>
          <div className="h-4 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gray-300 transition-all duration-500"
              style={{ width: "80%" }}
            />
          </div>
        </div>

        {/* OpenFans */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-semibold text-[#00AFF0]">
              OpenFans (95%)
            </span>
            <span className="text-sm font-bold text-[#00AFF0]">
              ${comparison.openFansKeep.toLocaleString()}/mo
            </span>
          </div>
          <div className="h-4 w-full overflow-hidden rounded-full bg-[#00AFF0]/10">
            <div
              className="h-full rounded-full bg-[#00AFF0] transition-all duration-500"
              style={{ width: "95%" }}
            />
          </div>
        </div>
      </div>

      {/* Savings highlight */}
      <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-center">
        <p className="text-sm text-emerald-600">
          You&apos;d keep an extra
        </p>
        <p className="text-2xl font-extrabold text-emerald-600">
          ${comparison.moreMoney.toLocaleString()}/mo
        </p>
        <p className="mt-1 text-xs text-emerald-500">
          That&apos;s{" "}
          <strong>${comparison.morePerYear.toLocaleString()}</strong> more per
          year
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ClaimPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();

  const [claimData, setClaimData] = useState<ClaimData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  // Check auth
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/me");
        setIsLoggedIn(res.ok);
      } catch {
        setIsLoggedIn(false);
      }
    }
    checkAuth();
  }, []);

  // Validate token
  useEffect(() => {
    async function validateToken() {
      try {
        const res = await fetch(`/api/creator-claims?token=${token}`);
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          setError(json.error ?? "Invalid claim link");
          return;
        }
        const json = await res.json();
        setClaimData(json.data);
      } catch {
        setError("Failed to validate claim link");
      } finally {
        setLoading(false);
      }
    }
    validateToken();
  }, [token]);

  // Claim handler
  const handleClaim = async () => {
    if (!isLoggedIn) {
      // Redirect to signup, then back here
      router.push(`/signup?redirect=/claim/${token}`);
      return;
    }

    setClaiming(true);
    setClaimError(null);

    try {
      const res = await fetch("/api/creator-claims/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim_token: token }),
      });

      const json = await res.json();

      if (!res.ok) {
        setClaimError(json.error ?? "Failed to claim page");
        return;
      }

      setClaimed(true);
      setTimeout(() => {
        router.push("/dashboard/settings");
      }, 3000);
    } catch {
      setClaimError("Network error. Please try again.");
    } finally {
      setClaiming(false);
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center pt-14">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#00AFF0]" />
            <p className="mt-4 text-sm text-gray-400">Validating your claim link...</p>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  // Error / invalid token
  if (error || !claimData) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center px-4 pt-14">
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              {claimData?.status === "claimed"
                ? "Already Claimed"
                : "Invalid Claim Link"}
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              {error ?? "This claim link is invalid or has expired."}
            </p>
            <Link href="/" className="mt-6 inline-block">
              <Button className="border-0 bg-[#00AFF0] text-white hover:bg-[#009ad6]">
                Go to Homepage
              </Button>
            </Link>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  // Already claimed
  if (claimData.status === "claimed") {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center px-4 pt-14">
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
              <CheckCircle2 className="h-8 w-8 text-amber-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              This Page Has Been Claimed
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              @{claimData.platform_username} has already been claimed by another creator.
            </p>
            <Link href="/explore" className="mt-6 inline-block">
              <Button className="border-0 bg-[#00AFF0] text-white hover:bg-[#009ad6]">
                Explore Creators
              </Button>
            </Link>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  // Success state after claiming
  if (claimed) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center px-4 pt-14">
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Your Page is Ready!
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Redirecting you to complete your profile...
            </p>
            <div className="mt-4">
              <div className="mx-auto h-1 w-32 overflow-hidden rounded-full bg-gray-200">
                <div className="h-full animate-[progress_3s_ease-in-out] rounded-full bg-[#00AFF0]" />
              </div>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  // Main claim page
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader />

      <main className="flex-1 pt-14">
        {/* Hero */}
        <section className="relative overflow-hidden pb-6 pt-12 sm:pb-10 sm:pt-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full opacity-[0.08] blur-3xl"
            style={{
              background: "radial-gradient(ellipse, #00AFF0 0%, transparent 70%)",
            }}
          />

          <div className="relative mx-auto max-w-2xl px-4 text-center sm:px-6">
            {/* Waitlist badge */}
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#00AFF0]/20 bg-[#00AFF0]/5 px-5 py-2 text-sm font-semibold text-[#00AFF0]">
              <Users className="h-4 w-4" />
              {claimData.waitlist_count} fan{claimData.waitlist_count !== 1 ? "s" : ""}{" "}
              waiting for you
            </div>

            <h1 className="font-display text-2xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-4xl md:text-5xl">
              {claimData.waitlist_count} Fans Are{" "}
              <span className="text-[#00AFF0]">Waiting for You</span>
              <br />
              on OpenFans
            </h1>

            <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-gray-500 sm:text-base">
              Your fans requested you on OpenFans. Claim your page, keep{" "}
              <strong className="text-gray-900">95% of your earnings</strong>,
              and get paid instantly.
            </p>
          </div>
        </section>

        {/* Value props */}
        <section className="pb-8 sm:pb-12">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  icon: DollarSign,
                  title: "Keep 95%",
                  desc: "Only 5% platform fee vs 20% on OnlyFans",
                },
                {
                  icon: Zap,
                  title: "Instant Payouts",
                  desc: "Get paid in USDC directly to your wallet",
                },
                {
                  icon: Shield,
                  title: "No Restrictions",
                  desc: "Full creative control over your content",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-[#00AFF0]/30"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#00AFF0]/10 text-[#00AFF0]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{item.title}</h3>
                      <p className="mt-0.5 text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Earnings Calculator */}
        <section className="pb-8 sm:pb-12">
          <div className="mx-auto max-w-xl px-4 sm:px-6">
            <EarningsCalculator />
          </div>
        </section>

        {/* CTA */}
        <section className="pb-12 sm:pb-20">
          <div className="mx-auto max-w-xl px-4 text-center sm:px-6">
            {claimError && (
              <p className="mb-4 text-sm text-red-500">{claimError}</p>
            )}

            <button
              onClick={handleClaim}
              disabled={claiming}
              className="inline-flex h-14 w-full max-w-sm items-center justify-center gap-2 rounded-2xl bg-[#00AFF0] text-base font-bold text-white shadow-lg shadow-sky-500/25 transition-all hover:bg-[#009ad6] hover:shadow-sky-500/35 disabled:opacity-50 sm:text-lg"
            >
              {claiming ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isLoggedIn ? (
                <>
                  Claim Your Page
                  <ArrowRight className="h-5 w-5" />
                </>
              ) : (
                <>
                  Sign Up & Claim Your Page
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>

            <p className="mt-3 text-xs text-gray-400">
              Free to join. No credit card required. Set up in under 5 minutes.
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
