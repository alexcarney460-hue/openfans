"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  MessageSquare,
  Sparkles,
  DollarSign,
  Wallet,
  Check,
  X,
  Crown,
  Flame,
  Bot,
  Wand2,
  Users,
  ArrowRight,
  Zap,
} from "lucide-react";

// -------------------------------------------------------------------
// Value Prop Cards
// -------------------------------------------------------------------
type ValueProp = {
  readonly icon: typeof MessageSquare;
  readonly title: string;
  readonly description: string;
  readonly gradient: string;
};

const VALUE_PROPS: readonly ValueProp[] = [
  {
    icon: MessageSquare,
    title: "AI Chat",
    description:
      "Let fans chat with your AI persona 24/7. Earn per message. Your AI never sleeps, never takes a break.",
    gradient: "from-violet-500/20 to-purple-500/20",
  },
  {
    icon: Wand2,
    title: "AI Studio",
    description:
      "Generate content with built-in AI tools. No external apps needed. Create images, stories, and more.",
    gradient: "from-cyan-500/20 to-blue-500/20",
  },
  {
    icon: DollarSign,
    title: "Lower Fees",
    description:
      "Keep 85% of everything you earn. Fanvue takes 20%. We only take 15%. More money stays with you.",
    gradient: "from-emerald-500/20 to-green-500/20",
  },
  {
    icon: Wallet,
    title: "Crypto Payouts",
    description:
      "Instant USDC payouts to your wallet. No bank required. No delays. Truly global access for every creator.",
    gradient: "from-amber-500/20 to-orange-500/20",
  },
] as const;

// -------------------------------------------------------------------
// Comparison Table Data
// -------------------------------------------------------------------
type ComparisonRow = {
  readonly feature: string;
  readonly openfans: string;
  readonly fanvue: string;
  readonly openfansWins: boolean;
};

const COMPARISON_ROWS: readonly ComparisonRow[] = [
  {
    feature: "Platform Fee",
    openfans: "15%",
    fanvue: "20%",
    openfansWins: true,
  },
  {
    feature: "AI Chat",
    openfans: "Yes",
    fanvue: "Yes",
    openfansWins: false,
  },
  {
    feature: "AI Image Generation",
    openfans: "Built-in",
    fanvue: "No",
    openfansWins: true,
  },
  {
    feature: "Crypto Payouts",
    openfans: "Yes (instant)",
    fanvue: "No",
    openfansWins: true,
  },
  {
    feature: "Content Ownership",
    openfans: "Full",
    fanvue: "Limited",
    openfansWins: true,
  },
  {
    feature: "Global Access",
    openfans: "Yes",
    fanvue: "Limited",
    openfansWins: true,
  },
] as const;

// -------------------------------------------------------------------
// How It Works Steps
// -------------------------------------------------------------------
type Step = {
  readonly icon: typeof Bot;
  readonly title: string;
  readonly description: string;
  readonly step: number;
};

const STEPS: readonly Step[] = [
  {
    icon: Bot,
    title: "Create Your AI Persona",
    description:
      "Set up your AI character with a name, personality traits, avatar, and voice. Make it uniquely yours.",
    step: 1,
  },
  {
    icon: Wand2,
    title: "Set Up AI Chat + Studio",
    description:
      "Configure AI chat pricing per message. Use AI Studio to generate exclusive content for your subscribers.",
    step: 2,
  },
  {
    icon: DollarSign,
    title: "Fans Subscribe & Chat",
    description:
      "Fans pay to subscribe and chat with your AI persona. You earn 24/7, even while you sleep.",
    step: 3,
  },
] as const;

// -------------------------------------------------------------------
// Revenue Calculator Defaults
// -------------------------------------------------------------------
const DEFAULT_FANS = 100;
const DEFAULT_MESSAGES_PER_DAY = 10;
const DEFAULT_PRICE_PER_MESSAGE = 0.25;
const OPENFANS_FEE = 0.15;
const FANVUE_FEE = 0.20;

// -------------------------------------------------------------------
// Page Component
// -------------------------------------------------------------------
export function AICreatorsPageClient() {
  const [fans, setFans] = useState(DEFAULT_FANS);
  const [messagesPerDay, setMessagesPerDay] = useState(DEFAULT_MESSAGES_PER_DAY);
  const [pricePerMessage, setPricePerMessage] = useState(DEFAULT_PRICE_PER_MESSAGE);

  const [founderData, setFounderData] = useState<{
    total_founders: number;
    spots_remaining: number;
    is_active: boolean;
  } | null>(null);

  useEffect(() => {
    fetch("/api/founder-count")
      .then((res) => res.json())
      .then((data) => {
        if (data.total_founders !== undefined) {
          setFounderData(data);
        }
      })
      .catch(() => {
        // Non-critical
      });
  }, []);

  // Revenue calculations (memoized to avoid recalc on every render)
  const revenue = useMemo(() => {
    const dailyGross = fans * messagesPerDay * pricePerMessage;
    const monthlyGross = dailyGross * 30;
    const yearlyGross = dailyGross * 365;

    return {
      dailyGross,
      monthlyGross,
      yearlyGross,
      openfansDaily: dailyGross * (1 - OPENFANS_FEE),
      openfansMonthly: monthlyGross * (1 - OPENFANS_FEE),
      openfansYearly: yearlyGross * (1 - OPENFANS_FEE),
      fanvueDaily: dailyGross * (1 - FANVUE_FEE),
      fanvueMonthly: monthlyGross * (1 - FANVUE_FEE),
      fanvueYearly: yearlyGross * (1 - FANVUE_FEE),
      savedMonthly: monthlyGross * (FANVUE_FEE - OPENFANS_FEE),
      savedYearly: yearlyGross * (FANVUE_FEE - OPENFANS_FEE),
    };
  }, [fans, messagesPerDay, pricePerMessage]);

  const formatCurrency = useCallback((amount: number) => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}k`;
    }
    return `$${amount.toFixed(0)}`;
  }, []);

  const formatCurrencyFull = useCallback((amount: number) => {
    return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }, []);

  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden bg-[#0a0a0f]">
      <SiteHeader />

      <main className="flex-1">
        {/* ==================== HERO ==================== */}
        <section className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-24 lg:pt-44 lg:pb-32">
          {/* Animated gradient background */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 50% 20%, rgba(139,92,246,0.15) 0%, rgba(0,175,240,0.05) 50%, transparent 80%)",
            }}
          />
          {/* Grid overlay for futuristic feel */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(139,92,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.3) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />

          <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              {/* Badge */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-medium tracking-wide text-violet-300 sm:text-sm">
                <Sparkles className="h-3.5 w-3.5" />
                The Future of Creator Economy
              </div>

              <h1 className="font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
                The{" "}
                <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  #1 Platform
                </span>
                <br />
                for AI Creators
              </h1>

              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-gray-400 sm:mt-6 sm:text-lg md:text-xl">
                Build your AI persona. Monetize 24/7. Keep{" "}
                <span className="font-semibold text-white">85%</span> of
                everything.
              </p>

              <div className="mt-8 flex items-center justify-center gap-3 sm:mt-10 sm:gap-4">
                <Link href="/signup" className="flex-1 sm:flex-none">
                  <Button
                    size="lg"
                    className="group h-12 w-full border-0 bg-gradient-to-r from-violet-600 to-purple-600 px-8 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:from-violet-500 hover:to-purple-500 hover:shadow-violet-500/40 sm:h-13 sm:w-auto sm:px-10 sm:text-base"
                  >
                    Start Creating
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </Link>
                <a href="#comparison" className="flex-1 sm:flex-none">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 w-full border-violet-500/30 px-6 text-sm font-semibold text-violet-300 transition-all hover:border-violet-400/50 hover:bg-violet-500/10 sm:h-13 sm:w-auto sm:px-8 sm:text-base"
                  >
                    Compare to Fanvue
                  </Button>
                </a>
              </div>

              {/* Social proof stats */}
              <div className="mt-10 flex items-center justify-center gap-6 text-sm text-gray-500 sm:mt-14 sm:gap-10 sm:text-base">
                <div className="text-center">
                  <div className="font-display text-2xl font-bold text-white sm:text-3xl">
                    85%
                  </div>
                  <div className="mt-0.5 text-xs text-gray-500 sm:text-sm">
                    Creator Payout
                  </div>
                </div>
                <div className="h-8 w-px bg-gray-800" />
                <div className="text-center">
                  <div className="font-display text-2xl font-bold text-white sm:text-3xl">
                    24/7
                  </div>
                  <div className="mt-0.5 text-xs text-gray-500 sm:text-sm">
                    AI Earns for You
                  </div>
                </div>
                <div className="h-8 w-px bg-gray-800" />
                <div className="text-center">
                  <div className="font-display text-2xl font-bold text-white sm:text-3xl">
                    Instant
                  </div>
                  <div className="mt-0.5 text-xs text-gray-500 sm:text-sm">
                    Crypto Payouts
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== WHY OPENFANS FOR AI ==================== */}
        <section className="relative border-t border-white/5 py-16 sm:py-24 lg:py-32">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 text-center sm:mb-14">
              <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
                Why OpenFans for{" "}
                <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                  AI Creators
                </span>
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm text-gray-500 sm:text-base">
                Everything you need to build, launch, and monetize your AI
                persona.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
              {VALUE_PROPS.map((prop) => {
                const Icon = prop.icon;
                return (
                  <div
                    key={prop.title}
                    className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all duration-300 hover:border-violet-500/20 hover:bg-white/[0.04] sm:p-8"
                  >
                    {/* Subtle gradient glow on hover */}
                    <div
                      aria-hidden="true"
                      className={`pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br ${prop.gradient} opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100`}
                    />

                    <div className="relative">
                      <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-bold text-white">
                        {prop.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-gray-400">
                        {prop.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==================== FANVUE COMPARISON ==================== */}
        <section
          id="comparison"
          className="relative border-t border-white/5 py-16 sm:py-24 lg:py-32"
        >
          {/* Background accent */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(139,92,246,0.06) 0%, transparent 70%)",
            }}
          />

          <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 text-center sm:mb-14">
              <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
                OpenFans vs Fanvue
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm text-gray-500 sm:text-base">
                See why AI creators are choosing OpenFans over the competition.
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
              {/* Table header */}
              <div className="grid grid-cols-[1.5fr_1fr_1fr] border-b border-white/[0.06] bg-white/[0.03] text-center text-xs font-semibold uppercase tracking-wider text-gray-500 sm:text-sm">
                <div className="px-4 py-3 text-left sm:px-6 sm:py-4">
                  Feature
                </div>
                <div className="flex items-center justify-center gap-1.5 px-3 py-3 text-violet-400 sm:px-6 sm:py-4">
                  <Sparkles className="h-3.5 w-3.5" />
                  OpenFans
                </div>
                <div className="px-3 py-3 text-gray-500 sm:px-6 sm:py-4">
                  Fanvue
                </div>
              </div>

              {/* Table rows */}
              {COMPARISON_ROWS.map((row, index) => (
                <div
                  key={row.feature}
                  className={`grid grid-cols-[1.5fr_1fr_1fr] text-center text-sm ${
                    index < COMPARISON_ROWS.length - 1
                      ? "border-b border-white/[0.04]"
                      : ""
                  } ${row.openfansWins ? "bg-violet-500/[0.03]" : ""}`}
                >
                  <div className="flex items-center px-4 py-3.5 text-left text-xs font-medium text-gray-300 sm:px-6 sm:py-4 sm:text-sm">
                    {row.feature}
                  </div>
                  <div className="flex items-center justify-center px-3 py-3.5 sm:px-6 sm:py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold sm:text-sm ${
                        row.openfansWins ? "text-violet-300" : "text-gray-300"
                      }`}
                    >
                      {row.openfans === "Yes" ||
                      row.openfans === "Built-in" ||
                      row.openfans === "Yes (instant)" ||
                      row.openfans === "Full" ? (
                        <Check className="h-4 w-4 text-emerald-400" />
                      ) : null}
                      {row.openfans}
                    </span>
                  </div>
                  <div className="flex items-center justify-center px-3 py-3.5 text-xs text-gray-500 sm:px-6 sm:py-4 sm:text-sm">
                    {row.fanvue === "No" || row.fanvue === "Limited" ? (
                      <span className="inline-flex items-center gap-1.5">
                        <X className="h-4 w-4 text-red-400/60" />
                        {row.fanvue}
                      </span>
                    ) : (
                      row.fanvue
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Savings callout */}
            <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center sm:p-5">
              <p className="text-sm font-medium text-emerald-300 sm:text-base">
                Switch to OpenFans and save{" "}
                <span className="font-bold text-emerald-200">
                  5% on every dollar
                </span>{" "}
                compared to Fanvue.
              </p>
            </div>
          </div>
        </section>

        {/* ==================== HOW IT WORKS ==================== */}
        <section className="relative border-t border-white/5 py-16 sm:py-24 lg:py-32">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 text-center sm:mb-14">
              <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
                How It Works
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm text-gray-500 sm:text-base">
                Go from zero to earning in three simple steps.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-3 sm:gap-8">
              {STEPS.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.step}
                    className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-center transition-all duration-300 hover:border-violet-500/20 hover:bg-white/[0.04] sm:p-8"
                  >
                    {/* Step number */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-xs font-bold text-white shadow-lg shadow-violet-500/30">
                        {step.step}
                      </div>
                    </div>

                    <div className="mx-auto mt-2 mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-base font-bold text-white sm:text-lg">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-400">
                      {step.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==================== REVENUE CALCULATOR ==================== */}
        <section className="relative border-t border-white/5 py-16 sm:py-24 lg:py-32">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(0,175,240,0.04) 0%, transparent 70%)",
            }}
          />

          <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 text-center sm:mb-14">
              <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
                Revenue Calculator
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm text-gray-500 sm:text-base">
                See how much your AI persona can earn. Adjust the sliders to
                match your goals.
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
              {/* Sliders */}
              <div className="space-y-6 border-b border-white/[0.06] p-6 sm:space-y-8 sm:p-8">
                {/* Fans slider */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <label
                      htmlFor="fans-slider"
                      className="text-sm font-medium text-gray-300"
                    >
                      <Users className="mr-2 inline h-4 w-4 text-violet-400" />
                      Number of Fans
                    </label>
                    <span className="rounded-lg bg-violet-500/10 px-3 py-1 text-sm font-bold text-violet-300">
                      {fans.toLocaleString()}
                    </span>
                  </div>
                  <input
                    id="fans-slider"
                    type="range"
                    min={10}
                    max={1000}
                    step={10}
                    value={fans}
                    onChange={(e) => setFans(Number(e.target.value))}
                    className="ai-slider w-full"
                  />
                  <div className="mt-1 flex justify-between text-xs text-gray-600">
                    <span>10</span>
                    <span>1,000</span>
                  </div>
                </div>

                {/* Messages per day slider */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <label
                      htmlFor="messages-slider"
                      className="text-sm font-medium text-gray-300"
                    >
                      <MessageSquare className="mr-2 inline h-4 w-4 text-violet-400" />
                      Messages per Fan / Day
                    </label>
                    <span className="rounded-lg bg-violet-500/10 px-3 py-1 text-sm font-bold text-violet-300">
                      {messagesPerDay}
                    </span>
                  </div>
                  <input
                    id="messages-slider"
                    type="range"
                    min={1}
                    max={50}
                    step={1}
                    value={messagesPerDay}
                    onChange={(e) =>
                      setMessagesPerDay(Number(e.target.value))
                    }
                    className="ai-slider w-full"
                  />
                  <div className="mt-1 flex justify-between text-xs text-gray-600">
                    <span>1</span>
                    <span>50</span>
                  </div>
                </div>

                {/* Price per message slider */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <label
                      htmlFor="price-slider"
                      className="text-sm font-medium text-gray-300"
                    >
                      <DollarSign className="mr-2 inline h-4 w-4 text-violet-400" />
                      Price per Message
                    </label>
                    <span className="rounded-lg bg-violet-500/10 px-3 py-1 text-sm font-bold text-violet-300">
                      ${pricePerMessage.toFixed(2)}
                    </span>
                  </div>
                  <input
                    id="price-slider"
                    type="range"
                    min={0.05}
                    max={2.0}
                    step={0.05}
                    value={pricePerMessage}
                    onChange={(e) =>
                      setPricePerMessage(Number(e.target.value))
                    }
                    className="ai-slider w-full"
                  />
                  <div className="mt-1 flex justify-between text-xs text-gray-600">
                    <span>$0.05</span>
                    <span>$2.00</span>
                  </div>
                </div>
              </div>

              {/* Results */}
              <div className="p-6 sm:p-8">
                {/* Revenue cards */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 text-center">
                    <div className="text-xs font-medium uppercase tracking-wider text-gray-500">
                      Daily
                    </div>
                    <div className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">
                      {formatCurrency(revenue.openfansDaily)}
                    </div>
                    <div className="mt-0.5 text-xs text-gray-500">
                      on OpenFans
                    </div>
                  </div>
                  <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 text-center">
                    <div className="text-xs font-medium uppercase tracking-wider text-violet-400">
                      Monthly
                    </div>
                    <div className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">
                      {formatCurrency(revenue.openfansMonthly)}
                    </div>
                    <div className="mt-0.5 text-xs text-violet-400/60">
                      on OpenFans
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 text-center">
                    <div className="text-xs font-medium uppercase tracking-wider text-gray-500">
                      Yearly
                    </div>
                    <div className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">
                      {formatCurrency(revenue.openfansYearly)}
                    </div>
                    <div className="mt-0.5 text-xs text-gray-500">
                      on OpenFans
                    </div>
                  </div>
                </div>

                {/* Platform comparison */}
                <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4 sm:p-5">
                  <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                    <div className="text-center sm:text-left">
                      <p className="text-sm text-gray-400">
                        On Fanvue you&apos;d keep{" "}
                        <span className="font-semibold text-gray-300">
                          {formatCurrencyFull(revenue.fanvueMonthly)}
                        </span>
                        /mo
                      </p>
                      <p className="text-sm text-gray-400">
                        On OpenFans you keep{" "}
                        <span className="font-semibold text-emerald-300">
                          {formatCurrencyFull(revenue.openfansMonthly)}
                        </span>
                        /mo
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-medium uppercase tracking-wider text-emerald-400/70">
                        You Save
                      </div>
                      <div className="font-display text-xl font-bold text-emerald-300 sm:text-2xl">
                        {formatCurrencyFull(revenue.savedYearly)}/yr
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== FOUNDER SPOT CALLOUT ==================== */}
        {founderData && founderData.is_active && (
          <section className="relative border-t border-white/5 py-16 sm:py-24">
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
              <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-6 sm:p-10">
                {/* Decorative glow */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl"
                />

                <div className="relative text-center">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-amber-300">
                    <Crown className="h-3.5 w-3.5" />
                    Founder Exclusive
                  </div>

                  <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
                    First 100 AI Creators Get{" "}
                    <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
                      5% Fee for Life
                    </span>
                  </h2>

                  <p className="mx-auto mt-3 max-w-md text-sm text-gray-400 sm:text-base">
                    Lock in the lowest rate on any AI creator platform. Keep 95%
                    of everything you earn, forever.
                  </p>

                  {/* Progress bar */}
                  <div className="mx-auto mt-6 max-w-sm">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-400">
                        {founderData.total_founders} of 100 claimed
                      </span>
                      <span
                        className={`font-bold ${
                          founderData.spots_remaining <= 10
                            ? "text-red-400"
                            : "text-amber-400"
                        }`}
                      >
                        {founderData.spots_remaining} left
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-1000"
                        style={{
                          width: `${Math.min(100, (founderData.total_founders / 100) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {founderData.spots_remaining <= 20 && (
                    <div className="mt-3 flex items-center justify-center gap-1.5">
                      <Flame
                        className={`h-4 w-4 ${
                          founderData.spots_remaining <= 10
                            ? "text-red-400"
                            : "text-amber-400"
                        }`}
                      />
                      <span
                        className={`text-sm font-semibold ${
                          founderData.spots_remaining <= 10
                            ? "text-red-300"
                            : "text-amber-300"
                        }`}
                      >
                        {founderData.spots_remaining <= 10
                          ? `Only ${founderData.spots_remaining} spots remaining`
                          : `Hurry -- only ${founderData.spots_remaining} left`}
                      </span>
                    </div>
                  )}

                  <div className="mt-6">
                    <Link href="/signup">
                      <Button
                        size="lg"
                        className="h-12 border-0 bg-gradient-to-r from-amber-500 to-orange-500 px-8 text-sm font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:from-amber-400 hover:to-orange-400 hover:shadow-amber-500/40 sm:px-10 sm:text-base"
                      >
                        <Crown className="mr-2 h-4 w-4" />
                        Claim Your Founder Spot
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ==================== FINAL CTA ==================== */}
        <section className="relative border-t border-white/5 py-16 sm:py-24 lg:py-32">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 50% 60%, rgba(139,92,246,0.08) 0%, transparent 70%)",
            }}
          />

          <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
              Your AI.{" "}
              <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Your Audience.
              </span>
              <br />
              Your Money.
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-gray-400 sm:mt-6 sm:text-lg">
              Start building your AI creator persona today. Set up in minutes.
              Earn while you sleep.
            </p>

            <div className="mt-8 sm:mt-10">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="group h-13 border-0 bg-gradient-to-r from-violet-600 to-purple-600 px-10 text-base font-semibold text-white shadow-xl shadow-violet-500/25 transition-all hover:from-violet-500 hover:to-purple-500 hover:shadow-violet-500/40 sm:h-14 sm:px-12 sm:text-lg"
                >
                  Start Creating Now
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            </div>

            <p className="mt-4 text-xs text-gray-600 sm:text-sm">
              Free to sign up. No credit card required.
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />

      {/* Custom slider styles for dark theme */}
      <style jsx>{`
        .ai-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          border-radius: 3px;
          background: rgba(255, 255, 255, 0.06);
          outline: none;
          cursor: pointer;
        }
        .ai-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
          box-shadow: 0 0 12px rgba(139, 92, 246, 0.4);
          cursor: pointer;
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .ai-slider::-webkit-slider-thumb:hover {
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.6);
          transform: scale(1.1);
        }
        .ai-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
          box-shadow: 0 0 12px rgba(139, 92, 246, 0.4);
          cursor: pointer;
          border: none;
        }
        .ai-slider::-moz-range-track {
          height: 6px;
          border-radius: 3px;
          background: rgba(255, 255, 255, 0.06);
        }
      `}</style>
    </div>
  );
}
