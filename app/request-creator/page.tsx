"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  Search,
  Users,
  Heart,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  ArrowRight,
  Loader2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RequestedCreator {
  readonly platform: string;
  readonly platform_username: string;
  readonly creator_name: string;
  readonly waitlist_count: number | string;
  readonly claim_status: string;
  readonly last_requested_at: string;
}

interface PaginationData {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly pages: number;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function RequestCreatorPage() {
  // Search / submit state
  const [username, setUsername] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState(0);
  const [alreadyRequested, setAlreadyRequested] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Leaderboard state
  const [topCreators, setTopCreators] = useState<readonly RequestedCreator[]>([]);
  const [loadingTop, setLoadingTop] = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);

  // Check auth on mount
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

  // Fetch leaderboard
  const fetchLeaderboard = useCallback(async () => {
    setLoadingTop(true);
    try {
      const res = await fetch("/api/creator-requests?limit=20&page=1");
      if (res.ok) {
        const json = await res.json();
        setTopCreators(json.data ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoadingTop(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Submit request
  const handleSubmit = async () => {
    const cleanUsername = username.trim().replace(/^@/, "").toLowerCase();
    if (!cleanUsername) return;

    // If not logged in and no email, show email field
    if (isLoggedIn === false && !email.trim()) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/creator-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creator_name: creatorName.trim() || cleanUsername,
          platform_username: cleanUsername,
          platform: "onlyfans",
          email: isLoggedIn ? undefined : email.trim(),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setSubmitError(json.error ?? "Something went wrong");
        return;
      }

      setSubmitted(true);
      setWaitlistCount(json.data?.waitlist_count ?? 1);
      setAlreadyRequested(json.data?.already_requested ?? false);
      fetchLeaderboard();
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // "I want them too!" handler for leaderboard items
  const handleVote = async (creator: RequestedCreator) => {
    if (isLoggedIn === false && !email.trim()) {
      // Scroll to top and focus the input
      window.scrollTo({ top: 0, behavior: "smooth" });
      setUsername(creator.platform_username);
      setCreatorName(creator.creator_name);
      inputRef.current?.focus();
      return;
    }

    try {
      const res = await fetch("/api/creator-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creator_name: creator.creator_name,
          platform_username: creator.platform_username,
          platform: creator.platform,
          email: isLoggedIn ? undefined : email.trim(),
        }),
      });

      if (res.ok) {
        fetchLeaderboard();
      }
    } catch {
      // silent
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setUsername("");
    setCreatorName("");
    setWaitlistCount(0);
    setAlreadyRequested(false);
    setSubmitError(null);
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader />

      <main className="flex-1 pt-14">
        {/* ==================== HERO ==================== */}
        <section className="relative overflow-hidden pb-8 pt-12 sm:pb-12 sm:pt-20">
          {/* Background glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full opacity-[0.08] blur-3xl"
            style={{
              background: "radial-gradient(ellipse, #00AFF0 0%, transparent 70%)",
            }}
          />

          <div className="relative mx-auto max-w-2xl px-4 text-center sm:px-6">
            {/* Badge */}
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#00AFF0]/20 bg-[#00AFF0]/5 px-4 py-1.5 text-xs font-medium tracking-wide text-[#00AFF0] sm:text-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Fan-Powered Demand
            </div>

            <h1 className="font-display text-2xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-4xl md:text-5xl">
              Bring Your Favorite Creator{" "}
              <span className="text-[#00AFF0]">to OpenFans</span>
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-gray-500 sm:mt-4 sm:text-base">
              Request the creators you want to see on OpenFans. When enough fans
              ask, we reach out and show them how many people are waiting.
            </p>
          </div>
        </section>

        {/* ==================== SEARCH / SUBMIT ==================== */}
        <section className="pb-10 sm:pb-16">
          <div className="mx-auto max-w-xl px-4 sm:px-6">
            {!submitted ? (
              <div className="space-y-4">
                {/* Username input */}
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <span className="text-lg font-semibold text-gray-300">@</span>
                  </div>
                  <input
                    ref={inputRef}
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter their OnlyFans username"
                    className="h-14 w-full rounded-2xl border border-gray-200 bg-white pl-10 pr-4 text-base font-medium text-gray-900 placeholder:text-gray-300 shadow-sm transition-all focus:border-[#00AFF0] focus:outline-none focus:ring-2 focus:ring-[#00AFF0]/20 sm:text-lg"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSubmit();
                    }}
                  />
                </div>

                {/* Creator name (optional) */}
                <input
                  type="text"
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  placeholder="Their display name (optional)"
                  className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-300 shadow-sm transition-all focus:border-[#00AFF0] focus:outline-none focus:ring-2 focus:ring-[#00AFF0]/20"
                />

                {/* Email for anon users */}
                {isLoggedIn === false && (
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email (so we can notify you)"
                    className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-300 shadow-sm transition-all focus:border-[#00AFF0] focus:outline-none focus:ring-2 focus:ring-[#00AFF0]/20"
                  />
                )}

                {submitError && (
                  <p className="text-center text-sm text-red-500">{submitError}</p>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={
                    submitting ||
                    !username.trim() ||
                    (isLoggedIn === false && !email.trim())
                  }
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#00AFF0] text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition-all hover:bg-[#009ad6] hover:shadow-sky-500/30 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Heart className="h-4 w-4" />
                      Request This Creator
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* Success state */
              <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm sm:p-8">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>

                {alreadyRequested ? (
                  <p className="text-sm text-gray-500">
                    You already requested this creator.
                  </p>
                ) : (
                  <p className="text-sm font-medium text-emerald-600">
                    Request submitted!
                  </p>
                )}

                <div className="mt-4">
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#00AFF0]/10 px-5 py-2.5">
                    <Users className="h-5 w-5 text-[#00AFF0]" />
                    <span className="text-lg font-bold text-gray-900">
                      {waitlistCount}
                    </span>
                    <span className="text-sm text-gray-500">
                      fan{waitlistCount !== 1 ? "s" : ""} have requested
                    </span>
                  </div>
                </div>

                <p className="mt-2 text-lg font-bold text-gray-900">
                  @{username.replace(/^@/, "").toLowerCase()}
                </p>

                <p className="mx-auto mt-3 max-w-sm text-sm text-gray-400">
                  We&apos;ll reach out to them and show them how many fans are
                  waiting. The more requests, the more likely they&apos;ll join!
                </p>

                <button
                  onClick={resetForm}
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-[#00AFF0] transition-colors hover:text-[#009ad6]"
                >
                  Request another creator
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ==================== LEADERBOARD ==================== */}
        <section className="border-t border-gray-200 bg-gray-50 py-10 sm:py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="mb-6 flex items-center gap-2 sm:mb-8">
              <div className="flex items-center gap-2 rounded-full bg-[#00AFF0]/10 px-3 py-1.5">
                <TrendingUp className="h-4 w-4 text-[#00AFF0]" />
                <span className="text-sm font-semibold text-[#00AFF0]">
                  Most Requested
                </span>
              </div>
              <span className="text-sm text-gray-400">
                Top creators fans want to see
              </span>
            </div>

            {loadingTop ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#00AFF0]" />
              </div>
            ) : topCreators.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
                <Users className="mx-auto h-10 w-10 text-gray-200" />
                <p className="mt-3 text-sm text-gray-400">
                  No requests yet. Be the first to request a creator!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {topCreators.map((creator, i) => {
                  const count = Number(creator.waitlist_count);
                  return (
                    <div
                      key={`${creator.platform}-${creator.platform_username}`}
                      className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 transition-all hover:border-[#00AFF0]/30 hover:shadow-sm sm:gap-4 sm:p-4"
                    >
                      {/* Rank */}
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-sm font-bold text-gray-400 sm:h-10 sm:w-10">
                        {i + 1}
                      </div>

                      {/* Avatar placeholder */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#00AFF0]/20 to-[#00AFF0]/5 text-sm font-bold text-[#00AFF0] sm:h-12 sm:w-12">
                        {(creator.creator_name ?? creator.platform_username)
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900 sm:text-base">
                          {creator.creator_name}
                        </p>
                        <p className="text-xs text-gray-400">
                          @{creator.platform_username}
                          <span className="mx-1.5 text-gray-200">|</span>
                          <span className="capitalize">{creator.platform}</span>
                          {creator.claim_status === "claimed" && (
                            <>
                              <span className="mx-1.5 text-gray-200">|</span>
                              <span className="font-medium text-emerald-500">Claimed</span>
                            </>
                          )}
                        </p>
                      </div>

                      {/* Waitlist count */}
                      <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#00AFF0]/10 px-3 py-1.5">
                        <Users className="h-3.5 w-3.5 text-[#00AFF0]" />
                        <span className="text-sm font-bold text-gray-900">
                          {count}
                        </span>
                      </div>

                      {/* Vote button */}
                      {creator.claim_status !== "claimed" && (
                        <button
                          onClick={() => handleVote(creator as RequestedCreator)}
                          className="shrink-0 rounded-lg border border-[#00AFF0]/30 px-3 py-1.5 text-xs font-medium text-[#00AFF0] transition-all hover:bg-[#00AFF0] hover:text-white sm:px-4 sm:py-2 sm:text-sm"
                        >
                          <span className="hidden sm:inline">I want them too!</span>
                          <Heart className="h-3.5 w-3.5 sm:hidden" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ==================== HOW IT WORKS ==================== */}
        <section className="py-10 sm:py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="mb-8 text-center text-xl font-bold text-gray-900 sm:text-2xl">
              How It Works
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  step: "1",
                  title: "Request",
                  desc: "Tell us which creator you want to see on OpenFans.",
                  icon: Search,
                },
                {
                  step: "2",
                  title: "We Reach Out",
                  desc: 'When enough fans request a creator, we contact them with "X fans are waiting."',
                  icon: Users,
                },
                {
                  step: "3",
                  title: "They Join",
                  desc: "The creator claims their page and starts earning 95% of their revenue.",
                  icon: Sparkles,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.step}
                    className="relative rounded-xl border border-gray-200 bg-white p-5 text-center transition-all hover:border-[#00AFF0]/30 hover:shadow-sm"
                  >
                    <div className="absolute -top-3 left-1/2 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full bg-[#00AFF0] text-xs font-bold text-white">
                      {item.step}
                    </div>
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#00AFF0]/10 text-[#00AFF0]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
