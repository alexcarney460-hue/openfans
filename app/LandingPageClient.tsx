"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { HomepageCreators } from "@/components/HomepageCreators";
import {
  DollarSign,
  Zap,
  Shield,
  Wallet,
  Heart,
  CreditCard,
  MessageSquare,
  BarChart3,
  Users,
  ShieldCheck,
  UserCheck,
  Lock,
  ChevronDown,
  Check,
  X,
  Rocket,
} from "lucide-react";
import { useLanguage } from "@/utils/i18n/context";
import { useTrack } from "@/hooks/useTrack";
import type { TranslationKey } from "@/utils/i18n/translations";

// -------------------------------------------------------------------
// Value props -- icon + translation keys
// -------------------------------------------------------------------
type ValueProp = {
  readonly icon: typeof DollarSign;
  readonly titleKey: TranslationKey;
  readonly descKey: TranslationKey;
};

const VALUE_PROPS: readonly ValueProp[] = [
  {
    icon: DollarSign,
    titleKey: "value.keep95.title",
    descKey: "value.keep95.desc",
  },
  {
    icon: Zap,
    titleKey: "value.instant.title",
    descKey: "value.instant.desc",
  },
  {
    icon: Shield,
    titleKey: "value.noRestrictions.title",
    descKey: "value.noRestrictions.desc",
  },
] as const;

// -------------------------------------------------------------------
// How it works steps
// -------------------------------------------------------------------
type HowItWorksStep = {
  readonly icon: typeof DollarSign;
  readonly titleKey: TranslationKey;
  readonly descKey: TranslationKey;
};

const CREATOR_STEPS: readonly HowItWorksStep[] = [
  {
    icon: UserCheck,
    titleKey: "howItWorks.creator.step1.title",
    descKey: "howItWorks.creator.step1.desc",
  },
  {
    icon: CreditCard,
    titleKey: "howItWorks.creator.step2.title",
    descKey: "howItWorks.creator.step2.desc",
  },
  {
    icon: Wallet,
    titleKey: "howItWorks.creator.step3.title",
    descKey: "howItWorks.creator.step3.desc",
  },
] as const;

const FAN_STEPS: readonly HowItWorksStep[] = [
  {
    icon: Wallet,
    titleKey: "howItWorks.fan.step1.title",
    descKey: "howItWorks.fan.step1.desc",
  },
  {
    icon: Heart,
    titleKey: "howItWorks.fan.step2.title",
    descKey: "howItWorks.fan.step2.desc",
  },
  {
    icon: Lock,
    titleKey: "howItWorks.fan.step3.title",
    descKey: "howItWorks.fan.step3.desc",
  },
] as const;

// -------------------------------------------------------------------
// Feature highlights
// -------------------------------------------------------------------
type Feature = {
  readonly icon: typeof DollarSign;
  readonly titleKey: TranslationKey;
  readonly descKey: TranslationKey;
};

const FEATURES: readonly Feature[] = [
  {
    icon: Wallet,
    titleKey: "features.usdc.title",
    descKey: "features.usdc.desc",
  },
  {
    icon: DollarSign,
    titleKey: "features.lowFees.title",
    descKey: "features.lowFees.desc",
  },
  {
    icon: MessageSquare,
    titleKey: "features.messaging.title",
    descKey: "features.messaging.desc",
  },
  {
    icon: BarChart3,
    titleKey: "features.analytics.title",
    descKey: "features.analytics.desc",
  },
  {
    icon: Users,
    titleKey: "features.referral.title",
    descKey: "features.referral.desc",
  },
  {
    icon: ShieldCheck,
    titleKey: "features.kyc.title",
    descKey: "features.kyc.desc",
  },
] as const;

// -------------------------------------------------------------------
// Placeholder avatar gradients for the mosaic
// -------------------------------------------------------------------
const AVATAR_GRADIENTS = [
  "from-sky-400 to-blue-600",
  "from-rose-400 to-pink-600",
  "from-amber-300 to-orange-500",
  "from-emerald-400 to-teal-600",
  "from-violet-400 to-purple-600",
  "from-cyan-300 to-sky-500",
  "from-fuchsia-400 to-pink-500",
  "from-lime-300 to-green-500",
  "from-red-400 to-rose-600",
  "from-indigo-400 to-blue-600",
  "from-yellow-300 to-amber-500",
  "from-teal-300 to-cyan-600",
] as const;

// -------------------------------------------------------------------
// Comparison table data
// -------------------------------------------------------------------
type ComparisonRow = {
  readonly label: string;
  readonly openfans: string;
  readonly onlyfans: string;
  readonly patreon: string;
  readonly highlight?: boolean;
};

const COMPARISON_ROWS: readonly ComparisonRow[] = [
  {
    label: "Creator Payout",
    openfans: "95%",
    onlyfans: "80%",
    patreon: "88–95%",
    highlight: true,
  },
  {
    label: "Payout Speed",
    openfans: "Instant",
    onlyfans: "7–21 days",
    patreon: "Monthly",
    highlight: true,
  },
  {
    label: "Crypto Native",
    openfans: "Yes",
    onlyfans: "No",
    patreon: "No",
  },
  {
    label: "Global Access",
    openfans: "Yes",
    onlyfans: "Restricted",
    patreon: "Yes",
  },
] as const;

// -------------------------------------------------------------------
// FAQ data
// -------------------------------------------------------------------
type FaqItem = {
  readonly question: string;
  readonly answer: string;
};

const FAQ_ITEMS: readonly FaqItem[] = [
  {
    question: "How do I get paid?",
    answer:
      "You get paid in USDC (a stablecoin pegged 1:1 to the US dollar) directly to your Solana wallet. Payouts are instant — no waiting days or weeks for bank transfers.",
  },
  {
    question: "What are the fees?",
    answer:
      "OpenFans charges a flat 5% platform fee on subscriptions and tips. That means you keep 95% of everything you earn. There are no hidden fees, no payout fees, and no currency conversion charges.",
  },
  {
    question: "Do I need crypto experience?",
    answer:
      "Not at all. We guide you through setting up a Solana wallet in under two minutes. Once set up, everything works automatically — you earn in USDC and can convert to your local currency anytime.",
  },
  {
    question: "How do subscriptions work?",
    answer:
      "You set your own monthly subscription price. Fans pay in USDC and get instant access to your exclusive content. You can also offer tiered pricing, pay-per-view posts, and accept tips.",
  },
  {
    question: "Is my content protected?",
    answer:
      "Yes. All content is behind a paywall and only accessible to paying subscribers. We use watermarking, DRM protection, and DMCA enforcement to protect your work from unauthorized sharing.",
  },
  {
    question: "Can I migrate from another platform?",
    answer:
      "Absolutely. You can import your content and start earning on OpenFans right away. Many creators run both platforms simultaneously during their transition.",
  },
] as const;

// -------------------------------------------------------------------
// Page Component
// -------------------------------------------------------------------
export default function LandingPageClient() {
  const { t } = useLanguage();
  const track = useTrack();
  const [activeTab, setActiveTab] = useState<"creators" | "fans">("creators");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    track("page_view", "home");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden bg-white">
      <SiteHeader />

      <main className="flex-1">
        {/* ==================== HERO ==================== */}
        <section className="relative overflow-hidden pt-24 pb-14 sm:pt-32 sm:pb-20 lg:pt-44 lg:pb-28">
          {/* Subtle top glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-32 left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full opacity-10 blur-3xl"
            style={{
              background:
                "radial-gradient(ellipse, #00AFF0 0%, transparent 70%)",
            }}
          />

          <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              {/* Tagline badge */}
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#00AFF0]/20 bg-[#00AFF0]/5 px-4 py-1.5 text-xs font-medium tracking-wide text-[#00AFF0] sm:text-sm">
                <Zap className="h-3.5 w-3.5" />
                {t("hero.tagline")}
              </div>

              <h1 className="font-display text-3xl font-extrabold leading-[1.1] tracking-tight text-gray-900 sm:text-5xl md:text-6xl lg:text-7xl">
                {t("hero.title.line1")}{" "}
                <span className="text-accent-blue">{t("hero.title.accent")}</span>
              </h1>

              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-gray-500 sm:mt-6 sm:text-xl">
                {t("hero.subtitle")}
              </p>

              <div className="mt-8 flex items-center justify-center gap-3 sm:mt-10 sm:gap-4">
                <Link href="/signup" className="flex-1 sm:flex-none">
                  <Button
                    size="lg"
                    className="h-11 w-full border-0 bg-[#00AFF0] px-6 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition-all hover:bg-[#009ad6] hover:shadow-sky-500/30 sm:h-12 sm:w-auto sm:px-8 sm:text-base"
                  >
                    {t("hero.cta.earn")}
                  </Button>
                </Link>
                <Link href="/explore" className="flex-1 sm:flex-none">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-11 w-full border-[#00AFF0]/30 px-6 text-sm font-semibold text-[#00AFF0] transition-all hover:border-[#00AFF0] hover:bg-[#00AFF0]/5 sm:h-12 sm:w-auto sm:px-8 sm:text-base"
                  >
                    {t("hero.cta.browse")}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Creator avatar mosaic */}
            <div className="mx-auto mt-10 flex max-w-md flex-wrap items-center justify-center gap-2 sm:mt-14 sm:gap-3">
              {AVATAR_GRADIENTS.map((gradient, i) => (
                <div
                  key={i}
                  className={`h-9 w-9 rounded-full bg-gradient-to-br sm:h-11 sm:w-11 ${gradient} opacity-80 transition-opacity hover:opacity-100`}
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>
        </section>

        {/* ==================== SOCIAL PROOF ==================== */}
        <section className="border-y border-gray-200 bg-gray-50 py-4 sm:py-6">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 text-xs sm:gap-x-8 sm:text-sm text-gray-400">
            <span className="text-center">
              <strong className="text-gray-600">10,000+</strong> {t("social.creators")}
            </span>
            <span className="hidden text-gray-300 sm:inline">|</span>
            <span className="text-center">
              <strong className="text-gray-600">$2.4M+</strong> {t("social.earned")}
            </span>
            <span className="hidden text-gray-300 sm:inline">|</span>
            <span className="text-center">
              <strong className="text-gray-600">500K+</strong> {t("social.subscribers")}
            </span>
            <span className="hidden text-gray-300 sm:inline">|</span>
            <span className="text-center">
              <strong className="text-[#00AFF0]">{t("social.fees")}</strong>
            </span>
            <span className="hidden text-gray-300 sm:inline">|</span>
            <span className="text-center">
              <strong className="text-[#00AFF0]">{t("social.payouts")}</strong>
            </span>
          </div>
        </section>

        {/* ==================== VALUE PROPS ==================== */}
        <section className="py-14 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 sm:gap-6">
              {VALUE_PROPS.map((prop) => {
                const Icon = prop.icon;
                return (
                  <div
                    key={prop.titleKey}
                    className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:block sm:p-6 sm:text-center transition-all hover:border-[#00AFF0]/30 hover:bg-[#00AFF0]/[0.02] hover:shadow-sm"
                  >
                    <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00AFF0]/10 text-[#00AFF0] sm:mx-auto sm:mb-4 sm:h-11 sm:w-11">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-gray-900 sm:text-lg">
                        {t(prop.titleKey)}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-gray-500 sm:mt-1.5">
                        {t(prop.descKey)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==================== HOW IT WORKS ==================== */}
        <section className="border-y border-gray-200 bg-gray-50 py-14 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 text-center sm:mb-14">
              <h2 className="font-display text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl md:text-4xl">
                {t("howItWorks.title")}
              </h2>
            </div>

            {/* Tab switcher */}
            <div className="mx-auto mb-10 flex max-w-xs overflow-hidden rounded-full border border-gray-200 bg-white p-1 sm:mb-14">
              <button
                type="button"
                onClick={() => setActiveTab("creators")}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  activeTab === "creators"
                    ? "bg-[#00AFF0] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t("howItWorks.creators")}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("fans")}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  activeTab === "fans"
                    ? "bg-[#00AFF0] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t("howItWorks.fans")}
              </button>
            </div>

            {/* Steps */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 sm:gap-8">
              {(activeTab === "creators" ? CREATOR_STEPS : FAN_STEPS).map(
                (step, index) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={step.titleKey}
                      className="relative flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 sm:block sm:p-6 sm:text-center transition-all hover:border-[#00AFF0]/30 hover:shadow-sm"
                    >
                      {/* Step number */}
                      <div className="absolute -top-3 left-5 sm:left-1/2 sm:-translate-x-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-[#00AFF0] text-xs font-bold text-white">
                        {index + 1}
                      </div>
                      <div className="mt-2 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00AFF0]/10 text-[#00AFF0] sm:mx-auto sm:mb-4 sm:mt-0 sm:h-12 sm:w-12">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="mt-2 min-w-0 sm:mt-0">
                        <h3 className="text-base font-bold text-gray-900">
                          {t(step.titleKey)}
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-gray-500">
                          {t(step.descKey)}
                        </p>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </section>

        {/* ==================== FEATURE HIGHLIGHTS ==================== */}
        <section className="py-14 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 text-center sm:mb-12">
              <h2 className="font-display text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl md:text-4xl">
                {t("features.title")}
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-sm text-gray-500 sm:mt-3 sm:text-base">
                {t("features.subtitle")}
              </p>
            </div>

            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 sm:gap-5">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.titleKey}
                    className="group flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-[#00AFF0]/30 hover:bg-[#00AFF0]/[0.02] hover:shadow-sm sm:p-5"
                  >
                    <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#00AFF0]/10 text-[#00AFF0] transition-colors group-hover:bg-[#00AFF0]/15">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-gray-900 sm:text-base">
                        {t(feature.titleKey)}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-gray-500">
                        {t(feature.descKey)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==================== CREATOR SHOWCASE ==================== */}
        <section className="border-t border-gray-200 py-14 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 text-center sm:mb-10">
              <h2 className="font-display text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl md:text-4xl">
                {t("showcase.title")}
              </h2>
              <p className="mt-2 text-sm text-gray-500 sm:mt-3 sm:text-base">
                {t("showcase.subtitle")}
              </p>
            </div>

            <HomepageCreators />

            <div className="mt-8 text-center sm:mt-10">
              <Link href="/explore">
                <Button
                  className="border-0 bg-[#00AFF0] text-white shadow-sm transition-all hover:bg-[#009ad6]"
                >
                  {t("showcase.seeAll")}
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ==================== BOTTOM CTA ==================== */}
        <section className="border-t border-gray-200 bg-gradient-to-b from-gray-50 to-white py-14 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 sm:gap-8">
              {/* Creator CTA */}
              <div className="relative overflow-hidden rounded-2xl border border-[#00AFF0]/20 bg-[#00AFF0]/[0.03] p-6 text-center sm:p-8">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#00AFF0]/10 blur-2xl"
                />
                <h3 className="relative font-display text-xl font-bold text-gray-900 sm:text-2xl">
                  {t("cta.creators.title")}
                </h3>
                <p className="relative mt-2 text-sm text-gray-500 sm:text-base">
                  {t("cta.subtitle")}
                </p>
                <div className="relative mt-6">
                  <Link href="/signup">
                    <Button
                      size="lg"
                      className="h-11 border-0 bg-[#00AFF0] px-6 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition-all hover:bg-[#009ad6] hover:shadow-sky-500/30 sm:h-12 sm:px-8 sm:text-base"
                    >
                      {t("cta.creators.button")}
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Fan CTA */}
              <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 text-center sm:p-8">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gray-100 blur-2xl"
                />
                <h3 className="relative font-display text-xl font-bold text-gray-900 sm:text-2xl">
                  {t("cta.fans.title")}
                </h3>
                <p className="relative mt-2 text-sm text-gray-500 sm:text-base">
                  {t("showcase.subtitle")}
                </p>
                <div className="relative mt-6">
                  <Link href="/explore">
                    <Button
                      size="lg"
                      variant="outline"
                      className="h-11 border-[#00AFF0]/30 px-6 text-sm font-semibold text-[#00AFF0] transition-all hover:border-[#00AFF0] hover:bg-[#00AFF0]/5 sm:h-12 sm:px-8 sm:text-base"
                    >
                      {t("cta.fans.button")}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== COMPARISON TABLE ==================== */}
        <section className="border-t border-gray-200 bg-gray-50 py-14 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 text-center sm:mb-12">
              <h2 className="font-display text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl md:text-4xl">
                See How We Compare
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-sm text-gray-500 sm:mt-3 sm:text-base">
                More money in your pocket, faster payouts, zero restrictions.
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
              {/* Table header */}
              <div className="grid grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,1fr))] border-b border-gray-200 bg-gray-50 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-500 sm:grid-cols-4 sm:text-sm">
                <div className="px-2 py-3 text-left sm:px-6 sm:py-4" />
                <div className="flex items-center justify-center gap-1 px-1.5 py-3 text-[#00AFF0] sm:gap-1.5 sm:px-6 sm:py-4">
                  <Rocket className="h-3 w-3 shrink-0 sm:h-4 sm:w-4" />
                  <span className="truncate">OpenFans</span>
                </div>
                <div className="px-1.5 py-3 sm:px-6 sm:py-4">OnlyFans</div>
                <div className="px-1.5 py-3 sm:px-6 sm:py-4">Patreon</div>
              </div>

              {/* Table rows */}
              {COMPARISON_ROWS.map((row, index) => (
                <div
                  key={row.label}
                  className={`grid grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,1fr))] text-center text-xs sm:grid-cols-4 sm:text-base ${
                    index < COMPARISON_ROWS.length - 1
                      ? "border-b border-gray-100"
                      : ""
                  }`}
                >
                  <div className="flex items-center px-2 py-3 text-left text-[11px] font-medium leading-tight text-gray-700 sm:px-6 sm:py-4 sm:text-sm">
                    {row.label}
                  </div>
                  <div className="flex items-center justify-center px-1.5 py-3 sm:px-6 sm:py-4">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold sm:text-sm ${
                        row.highlight ? "text-[#00AFF0]" : "text-gray-900"
                      }`}
                    >
                      {row.openfans === "Yes" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500 sm:h-4 sm:w-4" />
                      ) : null}
                      {row.openfans}
                    </span>
                  </div>
                  <div className="flex items-center justify-center px-1.5 py-3 text-[11px] text-gray-500 sm:px-6 sm:py-4 sm:text-sm">
                    {row.onlyfans === "No" ? (
                      <X className="h-3.5 w-3.5 text-gray-300 sm:h-4 sm:w-4" />
                    ) : (
                      row.onlyfans
                    )}
                  </div>
                  <div className="flex items-center justify-center px-1.5 py-3 text-[11px] text-gray-500 sm:px-6 sm:py-4 sm:text-sm">
                    {row.patreon === "No" ? (
                      <X className="h-3.5 w-3.5 text-gray-300 sm:h-4 sm:w-4" />
                    ) : (
                      row.patreon
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== FAQ ==================== */}
        <section className="py-14 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 text-center sm:mb-12">
              <h2 className="font-display text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl md:text-4xl">
                Frequently Asked Questions
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-sm text-gray-500 sm:mt-3 sm:text-base">
                Everything you need to know to get started.
              </p>
            </div>

            <div className="space-y-3">
              {FAQ_ITEMS.map((item, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={item.question}
                    className="overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:border-[#00AFF0]/30"
                  >
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() =>
                        setOpenFaq(isOpen ? null : index)
                      }
                      className="flex w-full items-center justify-between px-5 py-4 text-left sm:px-6 sm:py-5"
                    >
                      <span className="text-sm font-semibold text-gray-900 sm:text-base">
                        {item.question}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    <div
                      aria-hidden={!isOpen}
                      className={`overflow-hidden transition-all duration-200 ${
                        isOpen ? "max-h-96" : "max-h-0"
                      }`}
                    >
                      <p className="px-5 pb-4 text-sm leading-relaxed text-gray-500 sm:px-6 sm:pb-5 sm:text-base">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==================== FINAL CTA BANNER ==================== */}
        <section className="border-t border-gray-200">
          <div className="relative overflow-hidden bg-gradient-to-r from-[#00AFF0] to-[#0090c8] py-14 sm:py-20 lg:py-24">
            {/* Decorative glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-white/10 blur-3xl"
            />

            <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
              <h2 className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl md:text-4xl lg:text-5xl">
                Your Audience Is Waiting.
                <br className="hidden sm:block" />{" "}
                Start Earning Today.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/80 sm:mt-6 sm:text-lg">
                Join thousands of creators already keeping 95% of their
                earnings. Set up your page in under 5 minutes.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row sm:gap-4">
                <Link href="/signup" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="h-12 w-full border-0 bg-white px-8 text-sm font-semibold text-[#00AFF0] shadow-lg shadow-black/10 transition-all hover:bg-gray-100 sm:h-13 sm:w-auto sm:px-10 sm:text-base"
                  >
                    Create Your Page
                  </Button>
                </Link>
                <Link href="/explore" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 w-full border-white/30 px-8 text-sm font-semibold text-white transition-all hover:border-white hover:bg-white/10 sm:h-13 sm:w-auto sm:px-10 sm:text-base"
                  >
                    Explore Creators
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
