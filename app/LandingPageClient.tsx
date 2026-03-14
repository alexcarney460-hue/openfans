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
// Page Component
// -------------------------------------------------------------------
export default function LandingPageClient() {
  const { t } = useLanguage();
  const track = useTrack();
  const [activeTab, setActiveTab] = useState<"creators" | "fans">("creators");

  useEffect(() => {
    track("page_view", "home");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex min-h-dvh flex-col bg-white">
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
      </main>

      <SiteFooter />
    </div>
  );
}
