"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import {
  Check,
  X,
  Shield,
  Zap,
  Globe,
  ArrowRight,
  Wallet,
} from "lucide-react";

interface PlatformComparison {
  readonly feature: string;
  readonly openfans: string | boolean;
  readonly onlyfans: string | boolean;
  readonly patreon: string | boolean;
  readonly fansly: string | boolean;
}

const COMPARISONS: readonly PlatformComparison[] = [
  {
    feature: "Platform Fee",
    openfans: "5-10%",
    onlyfans: "20%",
    patreon: "5-12%",
    fansly: "20%",
  },
  {
    feature: "Crypto Payments",
    openfans: true,
    onlyfans: false,
    patreon: false,
    fansly: false,
  },
  {
    feature: "Instant Payouts",
    openfans: true,
    onlyfans: false,
    patreon: false,
    fansly: false,
  },
  {
    feature: "No Bank Required",
    openfans: true,
    onlyfans: false,
    patreon: false,
    fansly: false,
  },
  {
    feature: "Global Access",
    openfans: true,
    onlyfans: "Limited",
    patreon: true,
    fansly: "Limited",
  },
  {
    feature: "On-chain Revenue Proof",
    openfans: true,
    onlyfans: false,
    patreon: false,
    fansly: false,
  },
  {
    feature: "Content Ownership",
    openfans: "Full",
    onlyfans: "Limited",
    patreon: "Limited",
    fansly: "Limited",
  },
  {
    feature: "Payment Processing",
    openfans: "0%",
    onlyfans: "~3%",
    patreon: "~3-5%",
    fansly: "~3%",
  },
  {
    feature: "Censorship Risk",
    openfans: "None",
    onlyfans: "High",
    patreon: "High",
    fansly: "Medium",
  },
  {
    feature: "NSFW Allowed",
    openfans: true,
    onlyfans: true,
    patreon: false,
    fansly: true,
  },
] as const;

function CellValue({ value }: { readonly value: string | boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="mx-auto h-5 w-5 text-green-500" />
    ) : (
      <X className="mx-auto h-5 w-5 text-gray-300" />
    );
  }
  return <span>{value}</span>;
}

const BENEFITS = [
  {
    icon: Wallet,
    title: "Keep Up to 95% of Your Earnings",
    description:
      "Just 5% on tips and subscriptions (10% for adult creators). No hidden charges, no payment processor markups. What you earn is what you keep.",
  },
  {
    icon: Zap,
    title: "Instant Crypto Payouts",
    description:
      "Get paid in USDC or SOL directly to your wallet. No waiting 7-21 days for bank transfers. No minimum thresholds.",
  },
  {
    icon: Globe,
    title: "No Banking Barriers",
    description:
      "Accept payments from fans worldwide without a bank account. Crypto-native means no payment processor gatekeeping your income.",
  },
  {
    icon: Shield,
    title: "Censorship Resistant",
    description:
      "Your content, your rules. No sudden policy changes or account deactivations. On-chain revenue proof means full transparency.",
  },
] as const;

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <SiteHeader />

      <main className="flex-1 pt-16">
        {/* Hero */}
        <section className="bg-white relative overflow-hidden border-b border-gray-200 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#00AFF0]/20 bg-[#00AFF0]/10 px-4 py-1.5 text-sm text-[#33C1F5]">
                <Zap className="h-4 w-4" />
                For Creators
              </div>
              <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
                Keep{" "}
                <span className="text-[#00AFF0]">95%</span>{" "}
                of Your Revenue
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-gray-500">
                While other platforms take 20% of your hard-earned income,
                OpenFans charges just 5% on tips and subscriptions. Adult creators pay 10%.
                No payment processors. No bank holdups. Get paid instantly in crypto.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="bg-[#00AFF0] hover:bg-[#009dd8] border-0 px-8 text-base font-semibold text-white transition-opacity"
                  >
                    Start Creating
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/explore">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-gray-200 bg-gray-50 text-gray-900 hover:bg-gray-100"
                  >
                    Browse Creators
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Revenue comparison visual */}
        <section className="border-b border-gray-200 py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-10 text-center text-2xl font-bold text-gray-900 sm:text-3xl">
              You Earn $10,000/month. Here is What You Keep.
            </h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {/* OpenFans */}
              <div className="overflow-hidden rounded-2xl border border-[#00AFF0]/20 bg-white p-6">
                <p className="text-sm font-medium text-[#00AFF0]">OpenFans</p>
                <p className="mt-2 text-4xl font-bold text-gray-900">$9,500</p>
                <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="bg-[#00AFF0] h-full rounded-full"
                    style={{ width: "95%" }}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-400">
                  5% platform fee -- $500
                </p>
              </div>

              {/* OnlyFans */}
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6">
                <p className="text-sm font-medium text-gray-500">OnlyFans</p>
                <p className="mt-2 text-4xl font-bold text-gray-400">$8,000</p>
                <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-gray-300"
                    style={{ width: "80%" }}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-400">
                  20% platform fee -- $2,000
                </p>
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-gray-400">
              That is an extra $18,000 in your pocket every year.
            </p>
            <p className="mt-2 text-center text-xs text-gray-400">
              Standard creators: 5% fee. Adult content creators: 10% fee. Both still far less than competitors.
            </p>
          </div>
        </section>

        {/* Benefits grid */}
        <section className="border-b border-gray-200 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-10 text-center text-2xl font-bold text-gray-900 sm:text-3xl">
              Why Creators Choose OpenFans
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {BENEFITS.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={benefit.title}
                    className="rounded-xl border border-gray-200 bg-white p-6 transition-colors hover:border-gray-300 hover:shadow-sm"
                  >
                    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#00AFF0]/10">
                      <Icon className="h-5 w-5 text-[#00AFF0]" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {benefit.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-500">
                      {benefit.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Comparison table */}
        <section className="border-b border-gray-200 py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-10 text-center text-2xl font-bold text-gray-900 sm:text-3xl">
              Platform Comparison
            </h2>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full min-w-[600px] text-sm" role="table">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-5 py-4 text-left font-medium text-gray-500">
                      Feature
                    </th>
                    <th className="px-5 py-4 text-center font-bold text-[#00AFF0]">
                      OpenFans
                    </th>
                    <th className="px-5 py-4 text-center font-medium text-gray-400">
                      OnlyFans
                    </th>
                    <th className="px-5 py-4 text-center font-medium text-gray-400">
                      Patreon
                    </th>
                    <th className="px-5 py-4 text-center font-medium text-gray-400">
                      Fansly
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISONS.map((row, index) => (
                    <tr
                      key={row.feature}
                      className={
                        index < COMPARISONS.length - 1
                          ? "border-b border-gray-100"
                          : ""
                      }
                    >
                      <td className="px-5 py-3.5 text-gray-600">
                        {row.feature}
                      </td>
                      <td className="px-5 py-3.5 text-center font-medium text-gray-900">
                        <CellValue value={row.openfans} />
                      </td>
                      <td className="px-5 py-3.5 text-center text-gray-400">
                        <CellValue value={row.onlyfans} />
                      </td>
                      <td className="px-5 py-3.5 text-center text-gray-400">
                        <CellValue value={row.patreon} />
                      </td>
                      <td className="px-5 py-3.5 text-center text-gray-400">
                        <CellValue value={row.fansly} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-white py-20">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Ready to Keep More of What You Earn?
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Join OpenFans today. Set up your creator profile in under 2
              minutes. Start earning with crypto -- no bank account needed.
            </p>
            <div className="mt-8">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-[#00AFF0] hover:bg-[#009dd8] border-0 px-10 py-6 text-base font-semibold text-white transition-opacity"
                >
                  Start Creating Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs text-gray-400 sm:px-6 lg:px-8">
          OpenFans -- Own Your Content, Own Your Money.
        </div>
      </footer>
    </div>
  );
}
