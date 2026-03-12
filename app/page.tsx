import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  Wallet,
  Percent,
  ShieldCheck,
  Zap,
  MessageCircle,
  Film,
} from "lucide-react";

// -------------------------------------------------------------------
// Feature card data
// -------------------------------------------------------------------
const FEATURES = [
  {
    icon: Wallet,
    title: "Crypto Payments",
    description:
      "Accept USDC & SOL. Instant settlement. No chargebacks.",
  },
  {
    icon: Percent,
    title: "5% Platform Fee",
    description:
      "OnlyFans takes 20%. We take 5%. You keep more.",
  },
  {
    icon: ShieldCheck,
    title: "Uncensorable",
    description:
      "No payment processor can shut you down. Your content, your rules.",
  },
  {
    icon: Zap,
    title: "Instant Payouts",
    description:
      "No 7-day holds. Withdraw to your wallet anytime.",
  },
  {
    icon: MessageCircle,
    title: "Built-in Messaging",
    description:
      "DM your fans directly. Offer paid messages.",
  },
  {
    icon: Film,
    title: "Multi-Format Content",
    description:
      "Photos, videos, live streams, text posts. All gated by subscription tier.",
  },
] as const;

// -------------------------------------------------------------------
// How-it-works steps
// -------------------------------------------------------------------
const STEPS = [
  {
    number: "01",
    title: "Create your profile",
    description:
      "Sign up, connect your Solana wallet, and set up your creator page in minutes.",
  },
  {
    number: "02",
    title: "Set your subscription tiers",
    description:
      "Define tiers priced in USDC. Offer free previews, standard access, and VIP perks.",
  },
  {
    number: "03",
    title: "Start earning",
    description:
      "Fans pay with crypto or card. You receive funds directly -- no waiting, no middlemen.",
  },
] as const;

// -------------------------------------------------------------------
// Page Component
// -------------------------------------------------------------------
export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* ==================== HERO ==================== */}
        <section className="mesh-gradient relative overflow-hidden pt-32 pb-20 lg:pt-44 lg:pb-32">
          {/* Decorative gradient orb */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
            style={{
              background:
                "radial-gradient(ellipse, #8b5cf6 0%, #ec4899 50%, transparent 70%)",
            }}
          />

          <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h1 className="font-[var(--font-jakarta)] text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              <span className="gradient-text">Own Your Content.</span>
              <br />
              <span className="text-white">Own Your Money.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/60 sm:text-xl">
              The first creator platform with crypto-native payments. No banks.
              No gatekeepers. Just you and your fans.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="gradient-bg h-12 border-0 px-8 text-base font-semibold text-white shadow-lg shadow-purple-500/20 transition-all hover:opacity-90 hover:shadow-purple-500/30"
                >
                  Start Creating
                </Button>
              </Link>
              <Link href="#features">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 border-white/15 bg-transparent px-8 text-base font-semibold text-white hover:bg-white/5"
                >
                  Browse Creators
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ==================== FEATURES ==================== */}
        <section id="features" className="border-t border-white/5 py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-[var(--font-jakarta)] text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Everything creators need
              </h2>
              <p className="mt-4 text-lg text-white/50">
                Built from the ground up for the creator economy -- powered by
                blockchain, designed for humans.
              </p>
            </div>

            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="group relative rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-colors hover:border-white/10 hover:bg-white/[0.04]"
                  >
                    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg gradient-bg text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/50">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==================== HOW IT WORKS ==================== */}
        <section
          id="how-it-works"
          className="border-t border-white/5 bg-white/[0.01] py-20 lg:py-28"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-[var(--font-jakarta)] text-3xl font-bold tracking-tight text-white sm:text-4xl">
                How it works
              </h2>
              <p className="mt-4 text-lg text-white/50">
                Go from zero to earning in three simple steps.
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {STEPS.map((step) => (
                <div key={step.number} className="relative text-center md:text-left">
                  <span className="gradient-text text-5xl font-extrabold opacity-30">
                    {step.number}
                  </span>
                  <h3 className="mt-2 text-xl font-semibold text-white">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/50">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== FOR CREATORS ==================== */}
        <section
          id="creators"
          className="border-t border-white/5 py-20 lg:py-28"
        >
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="font-[var(--font-jakarta)] text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Built for every kind of creator
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-white/50">
              Whether you are a fitness coach, adult entertainer, trading
              analyst, or podcaster -- OpenFans gives you the freedom to
              monetize without middlemen. Set your own terms, keep 95% of your
              revenue, and get paid instantly to your wallet.
            </p>
            <div className="mt-10">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="gradient-bg h-12 border-0 px-8 text-base font-semibold text-white shadow-lg shadow-purple-500/20 transition-all hover:opacity-90 hover:shadow-purple-500/30"
                >
                  Start Creating Today
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
