import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CreatorCard } from "@/components/CreatorCard";
import { getAllCreators } from "@/lib/mock-data";
import { DollarSign, Zap, Shield } from "lucide-react";

// -------------------------------------------------------------------
// Value props — short, punchy, no jargon
// -------------------------------------------------------------------
const VALUE_PROPS = [
  {
    icon: DollarSign,
    title: "Keep 95%",
    description: "The lowest fees in the industry. Your earnings stay yours.",
  },
  {
    icon: Zap,
    title: "Get paid instantly",
    description: "No 7-day holds. Withdraw whenever you want.",
  },
  {
    icon: Shield,
    title: "No restrictions",
    description: "Your content, your rules. We don't police creators.",
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
export default function LandingPage() {
  const creators = getAllCreators();

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <SiteHeader />

      <main className="flex-1">
        {/* ==================== HERO ==================== */}
        <section className="relative overflow-hidden pt-32 pb-20 lg:pt-44 lg:pb-28">
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
              <h1 className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-gray-900 sm:text-5xl md:text-6xl lg:text-7xl">
                The creator platform{" "}
                <span className="text-accent-blue">that pays more.</span>
              </h1>

              <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-gray-500 sm:text-xl">
                Share exclusive content, build real community, and keep more of
                what you earn. Fans subscribe. You get paid. Simple.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="h-12 border-0 bg-[#00AFF0] px-8 text-base font-semibold text-white shadow-lg shadow-sky-500/20 transition-all hover:bg-[#009ad6] hover:shadow-sky-500/30"
                  >
                    Start Earning Today
                  </Button>
                </Link>
                <Link href="/explore">
                  <Button
                    size="lg"
                    className="h-12 border-0 bg-[#00AFF0] px-8 text-base font-semibold text-white shadow-lg shadow-sky-500/20 transition-all hover:bg-[#009ad6] hover:shadow-sky-500/30"
                  >
                    Browse Creators
                  </Button>
                </Link>
              </div>
            </div>

            {/* Creator avatar mosaic */}
            <div className="mx-auto mt-14 flex max-w-md flex-wrap items-center justify-center gap-3">
              {AVATAR_GRADIENTS.map((gradient, i) => (
                <div
                  key={i}
                  className={`h-11 w-11 rounded-full bg-gradient-to-br ${gradient} opacity-80 transition-opacity hover:opacity-100`}
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>
        </section>

        {/* ==================== SOCIAL PROOF ==================== */}
        <section className="border-y border-gray-200 bg-gray-50 py-6">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-10 gap-y-2 px-4 text-sm text-gray-400">
            <span>
              <strong className="text-gray-600">10,000+</strong> creators
            </span>
            <span className="hidden text-gray-300 sm:inline">|</span>
            <span>
              <strong className="text-gray-600">$2.4M+</strong> earned this
              month
            </span>
            <span className="hidden text-gray-300 sm:inline">|</span>
            <span>
              <strong className="text-gray-600">500K+</strong> subscribers
            </span>
          </div>
        </section>

        {/* ==================== VALUE PROPS ==================== */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 sm:grid-cols-3">
              {VALUE_PROPS.map((prop) => {
                const Icon = prop.icon;
                return (
                  <div
                    key={prop.title}
                    className="rounded-xl border border-gray-200 bg-white p-6 text-center transition-colors hover:border-gray-300 hover:bg-gray-50"
                  >
                    <div className="mx-auto mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#00AFF0]/10 text-[#00AFF0]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {prop.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
                      {prop.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==================== CREATOR SHOWCASE ==================== */}
        <section className="border-t border-gray-200 py-20 lg:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 text-center">
              <h2 className="font-display text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Discover creators you will love
              </h2>
              <p className="mt-3 text-base text-gray-500">
                Fitness coaches, artists, chefs, analysts, and more.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {creators.map((creator) => (
                <CreatorCard key={creator.username} creator={creator} />
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link href="/explore">
                <Button
                  className="border-0 bg-[#00AFF0] text-white shadow-sm transition-all hover:bg-[#009ad6]"
                >
                  See all creators
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ==================== BOTTOM CTA ==================== */}
        <section className="border-t border-gray-200 py-20 lg:py-28">
          <div className="mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="font-display text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Ready to earn on your terms?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-500">
              Join thousands of creators who chose a platform that respects
              their work and their wallet.
            </p>
            <div className="mt-8">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="h-12 border-0 bg-[#00AFF0] px-8 text-base font-semibold text-white shadow-lg shadow-sky-500/20 transition-all hover:bg-[#009ad6] hover:shadow-sky-500/30"
                >
                  Start Earning Today
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
