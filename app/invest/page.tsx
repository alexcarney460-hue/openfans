import type { Metadata } from "next";
import Link from "next/link";
import {
  TrendingUp,
  Shield,
  Zap,
  Globe,
  Users,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Smartphone,
  BarChart3,
  FileText,
  Download,
  MessageSquare,
  Bell,
  Eye,
  Languages,
  UserCheck,
  Lock,
  Database,
  Server,
  Code2,
  Wallet,
  Search,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Invest in OpenFans — Pre-Seed Round Open",
  description:
    "OpenFans is raising $750K at a $5M cap. Join the creator economy revolution. 95% payouts, instant Solana settlement, $7.2B proven market.",
};

/* ─── data ─── */

const ONLYFANS_STATS = [
  { value: "$7.2B", label: "OnlyFans GMV (2024)", color: "text-white" },
  { value: "4.6M", label: "Active Creators", color: "text-cyan-400" },
  { value: "377M", label: "Registered Users", color: "text-white" },
  { value: "$1.4B", label: "Platform Revenue", color: "text-amber-400" },
];

const ROUND_TERMS = [
  { term: "Round", value: "Pre-Seed" },
  { term: "Instrument", value: "SAFE (YC Post-Money)" },
  { term: "Target Raise", value: "$750,000", highlight: true },
  { term: "Valuation Cap", value: "$5,000,000", highlight: true },
  { term: "Discount", value: "20% to next priced round" },
  { term: "Minimum Check", value: "$25,000 (standard)" },
  { term: "Friends & Family", value: "$5,000 minimum", highlight: true },
  { term: "Pro-Rata Rights", value: "Yes ($50K+ investors)" },
  { term: "MFN Clause", value: "Best terms auto-upgrade" },
  { term: "Info Rights", value: "Quarterly updates" },
  { term: "Window", value: "March \u2013 June 2026" },
];

const OWNERSHIP_TABLE = [
  { invest: "$5,000", pct: "0.10%", tag: "Friends & Family" },
  { invest: "$10,000", pct: "0.20%", tag: "Friends & Family" },
  { invest: "$25,000", pct: "0.50%" },
  { invest: "$50,000", pct: "0.99%" },
  { invest: "$100,000", pct: "1.96%" },
  { invest: "$250,000", pct: "4.76%" },
  { invest: "$750,000", pct: "13.04%", highlight: true },
];

const USE_OF_FUNDS = [
  { category: "Creator Acquisition", amount: "$225K", pct: 30, color: "bg-cyan-500" },
  { category: "Marketing & Growth", amount: "$175K", pct: 23, color: "bg-sky-400" },
  { category: "Engineering", amount: "$150K", pct: 20, color: "bg-amber-500" },
  { category: "Legal & Compliance", amount: "$100K", pct: 13, color: "bg-violet-500" },
  { category: "Ops & Hiring", amount: "$75K", pct: 10, color: "bg-slate-500" },
  { category: "Reserve", amount: "$25K", pct: 4, color: "bg-slate-300" },
];

const COMPARISON = [
  { feature: "Creator Payout", of: "80%", us: "95%", win: true },
  { feature: "Platform Fee", of: "20%", us: "5%", win: true },
  { feature: "Payout Speed", of: "7\u201321 days", us: "Instant", win: true },
  { feature: "Payout Method", of: "Bank (limited)", us: "USDC (global)", win: true },
  { feature: "Transaction Cost", of: "High (cards)", us: "<$0.01", win: true },
  { feature: "Chargebacks", of: "Creator\u2019s loss", us: "None (crypto)", win: true },
  { feature: "Deplatforming Risk", of: "Bank-dependent", us: "None (on-chain)", win: true },
  { feature: "Geo Access", of: "Restricted", us: "Global (borderless)", win: true },
  { feature: "Creator Referrals", of: "None", us: "1% lifetime commission", win: true },
  { feature: "KYC/Age Verification", of: "Basic", us: "ID + selfie (built-in)", win: true },
];

const BUILT_FEATURES = [
  { icon: Wallet, title: "Solana USDC Payments", desc: "Subscriptions, tips, and pay-per-view content. All settled on Solana mainnet via Helius RPC." },
  { icon: DollarSign, title: "5% Platform Fee Model", desc: "Payments route through platform hot wallet. Creators withdraw to their own Solana wallets." },
  { icon: UserCheck, title: "Creator KYC / Age Verification", desc: "Government ID + selfie upload with admin review queue. Required before monetization." },
  { icon: BarChart3, title: "Admin Dashboard", desc: "Real-time analytics, revenue charts, creator management, and payout processing tools." },
  { icon: TrendingUp, title: "Creator Analytics", desc: "Earnings dashboard, subscriber counts, withdrawal requests, and referral program tracking." },
  { icon: MessageSquare, title: "Direct Messaging", desc: "Split-pane inbox with real-time polling. Full creator-to-subscriber communication." },
  { icon: Users, title: "Social Features", desc: "Like and comment system on all posts. Post view counts and engagement metrics." },
  { icon: Bell, title: "Notification System", desc: "Bell dropdown, full notification page, and transactional email notifications via Resend." },
  { icon: Eye, title: "Event Tracking", desc: "12 event types tracked for engagement analytics. Click-through and conversion data." },
  { icon: Shield, title: "Security Hardened", desc: "Deposit double-spend prevention, atomic payouts, rate limiting (Upstash Redis), CSP, HSTS." },
  { icon: Search, title: "SEO & Social Sharing", desc: "OpenGraph meta tags, dynamic social cards, search-optimized creator pages." },
  { icon: Languages, title: "Multi-Language Support", desc: "10 languages supported. Global-ready from day one." },
];

const PLATFORM_NUMBERS = [
  { value: "16", label: "Database Tables" },
  { value: "17+", label: "API Endpoints" },
  { value: "12", label: "Tracked Event Types" },
  { value: "10", label: "Languages Supported" },
];

const TECH_STACK = [
  { category: "Frontend", items: "Next.js 14 (App Router), TypeScript, Tailwind CSS" },
  { category: "Backend", items: "Supabase (Postgres + Auth + Storage), Drizzle ORM" },
  { category: "Payments", items: "Solana blockchain, USDC, @solana/web3.js, @solana/spl-token" },
  { category: "Infrastructure", items: "Vercel (hosting + serverless), Helius RPC (Solana mainnet)" },
  { category: "Services", items: "Upstash Redis (rate limiting), Resend (email)" },
];

const MILESTONES = [
  {
    phase: "Phase 1",
    months: "Months 1\u20133",
    title: "Prove the Supply",
    items: ["100+ creators onboarded", "Founder Program live", "Payments operational", "Legal entity complete"],
  },
  {
    phase: "Phase 2",
    months: "Months 4\u20138",
    title: "Prove the Demand",
    items: ["500+ active creators", "2,000+ paying subscribers", "$25K+ monthly GMV", "iOS beta launch"],
  },
  {
    phase: "Phase 3",
    months: "Months 9\u201314",
    title: "Prove the Economics",
    items: ["2,000+ creators", "10,000+ subscribers", "$100K+ monthly GMV", "Series A ready"],
  },
];

const RETURN_SCENARIOS = [
  {
    label: "Series A",
    valuation: "$50M",
    desc: "Demonstrated GMV growth trajectory",
    returns: [
      { invest: "$5K", value: "$50K", multiple: "10x" },
      { invest: "$25K", value: "$250K", multiple: "10x" },
      { invest: "$100K", value: "$1M", multiple: "10x" },
    ],
  },
  {
    label: "Series B",
    valuation: "$200M",
    desc: "5% of OnlyFans GMV captured",
    returns: [
      { invest: "$5K", value: "$200K", multiple: "40x" },
      { invest: "$25K", value: "$1M", multiple: "40x" },
      { invest: "$100K", value: "$4M", multiple: "40x" },
    ],
  },
  {
    label: "Breakout",
    valuation: "$500M+",
    desc: "#2 creator subscription platform",
    returns: [
      { invest: "$5K", value: "$500K", multiple: "100x" },
      { invest: "$25K", value: "$2.5M", multiple: "100x" },
      { invest: "$100K", value: "$10M", multiple: "100x" },
    ],
  },
];

const RISKS = [
  {
    severity: "Critical",
    title: "Marketplace cold-start",
    mitigation: "Founder Program incentives, 1% lifetime affiliate referrals, direct outreach to mid-tier OF creators.",
    color: "bg-red-100 text-red-700",
  },
  {
    severity: "High",
    title: "5% take rate sustainability",
    mitigation: "Volume thesis \u2014 at $100M GMV, 5% = $5M revenue. Adult content at 10% drives higher margin.",
    color: "bg-orange-100 text-orange-700",
  },
  {
    severity: "High",
    title: "Payment & banking risk",
    mitigation: "Crypto-native from day one. USDC on Solana eliminates traditional processor dependency.",
    color: "bg-orange-100 text-orange-700",
  },
  {
    severity: "Medium",
    title: "OnlyFans retaliates on pricing",
    mitigation: "OF structurally can\u2019t cut to 5% \u2014 $684M profit and $497M dividends depend on 20%.",
    color: "bg-yellow-100 text-yellow-700",
  },
  {
    severity: "Medium",
    title: "Solo founder risk",
    mitigation: "First hire (growth/community lead) is immediate priority with funding.",
    color: "bg-yellow-100 text-yellow-700",
  },
];

const SCALING_MATH = [
  { share: "0.1%", gmv: "$7.2M", revenue: "$360K", valuation: "$5\u201310M" },
  { share: "1%", gmv: "$72M", revenue: "$3.6M", valuation: "$30\u201350M" },
  { share: "5%", gmv: "$360M", revenue: "$18M", valuation: "$150\u2013250M" },
  { share: "10%", gmv: "$720M", revenue: "$36M", valuation: "$300\u2013500M+", highlight: true },
];

const STEPS = [
  { num: 1, text: "Express interest ($5K F&F / $25K standard)" },
  { num: 2, text: "Review SAFE (YC standard)" },
  { num: 3, text: "Wire or USDC transfer" },
  { num: 4, text: "Executed SAFE in 48 hours" },
];

/* ─── component ─── */

export default function InvestPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-[#0A1628] text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-[#00AFF0]/30 blur-[120px]" />
          <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-[#F5A623]/20 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-5xl px-6 pb-20 pt-16">
          <Link href="/" className="mb-10 inline-flex items-center gap-2 text-sm text-white/50 transition hover:text-white/80">
            <ArrowRight className="h-3 w-3 rotate-180" /> Back to OpenFans
          </Link>

          <div className="mb-3 inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-widest text-white/40">
            Confidential
          </div>

          <h1 className="mb-4 font-[family-name:var(--font-jakarta)] text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Invest in Open<span className="text-[#00AFF0]">Fans</span>
          </h1>
          <p className="mb-10 max-w-2xl text-lg leading-relaxed text-white/60 sm:text-xl">
            The creator platform that gives back. OnlyFans takes 20%. We take 5%.
            A $7.2 billion market with one dominant player charging creators 4x too much.
          </p>

          <div className="mb-12 flex flex-wrap gap-6 sm:gap-10">
            {[
              { val: "$750K", lbl: "Target Raise" },
              { val: "$5M", lbl: "Valuation Cap" },
              { val: "SAFE", lbl: "Instrument" },
              { val: "20%", lbl: "Discount" },
            ].map((t) => (
              <div key={t.lbl}>
                <div className="text-3xl font-extrabold text-[#00AFF0] sm:text-4xl">{t.val}</div>
                <div className="mt-1 text-xs uppercase tracking-widest text-white/40">{t.lbl}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-4">
            <a
              href="#terms"
              className="inline-flex items-center gap-2 rounded-lg bg-[#00AFF0] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#00AFF0]/90"
            >
              View Terms <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="/OPENFANS-SEED-ROUND.pdf"
              download
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <Download className="h-4 w-4" /> Download PDF
            </a>
          </div>
        </div>
      </section>

      {/* ── MARKET STATS ── */}
      <section className="border-b border-gray-100 bg-gray-50 py-10">
        <div className="mx-auto max-w-5xl px-6">
          <p className="mb-6 text-center text-xs uppercase tracking-widest text-gray-400">The market we&apos;re entering</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {ONLYFANS_STATS.map((s) => (
              <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm">
                <div className="text-2xl font-extrabold text-[#0A1628] sm:text-3xl">{s.value}</div>
                <div className="mt-1 text-xs text-gray-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARISON ── */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-[#00AFF0]">
            <BarChart3 className="h-4 w-4" /> Why Creators Switch
          </div>
          <h2 className="mb-8 font-[family-name:var(--font-jakarta)] text-3xl font-bold text-[#0A1628]">
            Better Economics. Everywhere.
          </h2>

          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0A1628] text-white">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider">Feature</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">OnlyFans</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#00AFF0]">OpenFans</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={row.feature} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-5 py-3 font-medium text-gray-900">{row.feature}</td>
                    <td className="px-5 py-3 text-gray-400">{row.of}</td>
                    <td className="px-5 py-3 font-semibold text-emerald-600">{row.us}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 rounded-xl border-l-4 border-[#00AFF0] bg-sky-50 p-5">
            <p className="text-sm text-gray-700">
              A creator earning <strong className="text-[#0A1628]">$10,000/mo</strong> on OnlyFans keeps $8,000.
              On OpenFans they keep <strong className="text-2xl text-[#0A1628]">$9,500</strong>.
            </p>
            <p className="mt-1 text-sm font-semibold text-[#0A1628]">
              That&apos;s $18,000 more per year &mdash; per creator.
            </p>
          </div>
        </div>
      </section>

      {/* ── ROUND TERMS ── */}
      <section id="terms" className="scroll-mt-8 border-y border-gray-100 bg-gray-50 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-[#00AFF0]">
            <FileText className="h-4 w-4" /> Investment Terms
          </div>
          <h2 className="mb-8 font-[family-name:var(--font-jakarta)] text-3xl font-bold text-[#0A1628]">
            Round Structure
          </h2>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Terms table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <tbody>
                  {ROUND_TERMS.map((r, i) => (
                    <tr key={r.term} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-5 py-3 text-gray-500">{r.term}</td>
                      <td className={`px-5 py-3 text-right font-semibold ${r.highlight ? "text-[#00AFF0]" : "text-[#0A1628]"}`}>
                        {r.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Ownership table */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-900">Ownership at $5M Cap</h3>
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#0A1628] text-white">
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider">Investment</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider">Ownership</th>
                    </tr>
                  </thead>
                  <tbody>
                    {OWNERSHIP_TABLE.map((row, i) => (
                      <tr key={row.invest} className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50"} ${row.highlight ? "font-bold" : ""}`}>
                        <td className="px-5 py-3 text-gray-700">
                          {row.invest}
                          {"tag" in row && row.tag && (
                            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                              {row.tag}
                            </span>
                          )}
                        </td>
                        <td className={`px-5 py-3 text-right ${row.highlight ? "text-[#00AFF0] font-bold" : "text-gray-900 font-semibold"}`}>
                          {row.pct}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── USE OF FUNDS ── */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-[#00AFF0]">
            <DollarSign className="h-4 w-4" /> Capital Allocation
          </div>
          <h2 className="mb-2 font-[family-name:var(--font-jakarta)] text-3xl font-bold text-[#0A1628]">
            Use of Funds
          </h2>
          <p className="mb-8 text-sm text-gray-500">14&ndash;17 months runway at $45&ndash;55K/month burn rate.</p>

          <div className="space-y-3">
            {USE_OF_FUNDS.map((f) => (
              <div key={f.category} className="flex items-center gap-4">
                <div className="w-36 shrink-0 text-sm font-medium text-gray-700">{f.category}</div>
                <div className="flex-1">
                  <div className="h-7 w-full overflow-hidden rounded-md bg-gray-100">
                    <div
                      className={`flex h-full items-center justify-end rounded-md pr-2 text-xs font-semibold text-white ${f.color}`}
                      style={{ width: `${f.pct}%` }}
                    >
                      {f.pct >= 13 ? `${f.pct}%` : ""}
                    </div>
                  </div>
                </div>
                <div className="w-16 shrink-0 text-right font-mono text-sm font-semibold text-gray-900">{f.amount}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUCT STATUS ── */}
      <section className="border-y border-gray-100 bg-gray-50 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-[#00AFF0]">
            <Zap className="h-4 w-4" /> Product
          </div>
          <h2 className="mb-2 font-[family-name:var(--font-jakarta)] text-3xl font-bold text-[#0A1628]">
            Not a Pitch Deck. A Live Product.
          </h2>
          <p className="mb-8 text-sm text-gray-500">
            OpenFans is deployed on Vercel and processing real transactions on Solana mainnet today.
          </p>

          {/* Platform numbers */}
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {PLATFORM_NUMBERS.map((n) => (
              <div key={n.label} className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm">
                <div className="text-2xl font-extrabold text-[#0A1628]">{n.value}</div>
                <div className="mt-1 text-xs text-gray-400">{n.label}</div>
              </div>
            ))}
          </div>

          {/* Built features grid */}
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-gray-500">What&apos;s Built and Live</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BUILT_FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <f.icon className="h-5 w-5 text-[#00AFF0]" />
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
                <h3 className="mb-1 text-sm font-bold text-gray-900">{f.title}</h3>
                <p className="text-xs leading-relaxed text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Revenue model callout */}
          <div className="mt-8 rounded-xl border-l-4 border-emerald-500 bg-emerald-50 p-5">
            <h4 className="mb-1 text-sm font-bold text-gray-900">Revenue Model</h4>
            <p className="text-sm text-gray-700">
              5% platform fee on every transaction (subscriptions, tips, PPV). Payments flow through a platform hot wallet
              on Solana mainnet. Creators withdraw their earnings to personal Solana wallets at any time.
              No banks, no payment processors, no chargebacks.
            </p>
          </div>

          {/* Funded by round (upcoming) */}
          <h3 className="mb-4 mt-8 text-sm font-semibold uppercase tracking-widest text-gray-500">Funded by This Round</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: Smartphone, title: "Mobile Apps", desc: "iOS & Android native apps" },
              { icon: Globe, title: "Video CDN", desc: "Streaming infrastructure for video content" },
              { icon: Shield, title: "Content Moderation", desc: "AI + manual moderation tooling" },
            ].map((f) => (
              <div key={f.title} className="rounded-xl border border-dashed border-gray-300 bg-white/50 p-5">
                <f.icon className="mb-3 h-5 w-5 text-amber-500" />
                <h3 className="mb-1 text-sm font-bold text-gray-900">{f.title}</h3>
                <p className="text-xs text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TECH STACK ── */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-[#00AFF0]">
            <Code2 className="h-4 w-4" /> Technology
          </div>
          <h2 className="mb-2 font-[family-name:var(--font-jakarta)] text-3xl font-bold text-[#0A1628]">
            Tech Stack
          </h2>
          <p className="mb-8 text-sm text-gray-500">
            Production-grade infrastructure. No prototypes, no mocks.
          </p>

          <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0A1628] text-white">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider">Layer</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider">Technologies</th>
                </tr>
              </thead>
              <tbody>
                {TECH_STACK.map((row, i) => (
                  <tr key={row.category} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-5 py-3 font-medium text-gray-900">{row.category}</td>
                    <td className="px-5 py-3 text-gray-600">{row.items}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <Database className="mb-2 h-5 w-5 text-[#00AFF0]" />
              <div className="text-xl font-bold text-[#0A1628]">16 Tables</div>
              <div className="text-xs text-gray-400">Normalized Postgres schema with Drizzle ORM</div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <Server className="mb-2 h-5 w-5 text-[#00AFF0]" />
              <div className="text-xl font-bold text-[#0A1628]">17+ Endpoints</div>
              <div className="text-xs text-gray-400">RESTful API on Vercel serverless functions</div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <Lock className="mb-2 h-5 w-5 text-[#00AFF0]" />
              <div className="text-xl font-bold text-[#0A1628]">Rate Limited</div>
              <div className="text-xs text-gray-400">Upstash Redis with per-endpoint throttling</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MILESTONES ── */}
      <section className="border-y border-gray-100 bg-gray-50 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-[#00AFF0]">
            <Clock className="h-4 w-4" /> Roadmap
          </div>
          <h2 className="mb-8 font-[family-name:var(--font-jakarta)] text-3xl font-bold text-[#0A1628]">
            Milestone Roadmap
          </h2>

          <div className="grid gap-6 sm:grid-cols-3">
            {MILESTONES.map((m, i) => (
              <div key={m.phase} className="relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00AFF0] text-xs font-bold text-white">
                    {i + 1}
                  </div>
                  <span className="text-xs text-gray-400">{m.months}</span>
                </div>
                <h3 className="mb-3 text-base font-bold text-[#0A1628]">{m.title}</h3>
                <ul className="space-y-1.5">
                  {m.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-gray-600">
                      <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-center">
            <p className="text-sm font-semibold text-amber-800">
              Series A Target: Month 14&ndash;18 &mdash; $3&ndash;5M raise at $25&ndash;40M valuation
            </p>
          </div>
        </div>
      </section>

      {/* ── RETURN SCENARIOS ── */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-[#00AFF0]">
            <TrendingUp className="h-4 w-4" /> Returns
          </div>
          <h2 className="mb-2 font-[family-name:var(--font-jakarta)] text-3xl font-bold text-[#0A1628]">
            Return Scenarios
          </h2>
          <p className="mb-8 text-xs text-gray-400">
            Hypothetical illustrations at $5M cap. Not guaranteed. Subject to dilution.
          </p>

          <div className="grid gap-6 sm:grid-cols-3">
            {RETURN_SCENARIOS.map((s, i) => (
              <div
                key={s.label}
                className={`overflow-hidden rounded-xl border shadow-sm ${
                  i === 2 ? "border-amber-300 bg-amber-50/50" : "border-gray-200 bg-white"
                }`}
              >
                <div className={`px-5 py-4 ${i === 2 ? "bg-amber-100/50" : "bg-gray-50"}`}>
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">{s.label}</div>
                  <div className="text-2xl font-extrabold text-[#0A1628]">{s.valuation}</div>
                  <div className="text-xs text-gray-400">{s.desc}</div>
                </div>
                <div className="divide-y divide-gray-100 px-5 py-2">
                  {s.returns.map((r) => (
                    <div key={r.invest} className="flex items-center justify-between py-3">
                      <div className="text-xs text-gray-400">{r.invest} in</div>
                      <div className="text-right">
                        <span className="text-base font-bold text-emerald-600">{r.value}</span>
                        <span className="ml-2 rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-[#00AFF0]">
                          {r.multiple}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SCALING MATH ── */}
      <section className="border-y border-gray-100 bg-gray-50 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-[#00AFF0]">
            <TrendingUp className="h-4 w-4" /> The Bull Case
          </div>
          <h2 className="mb-3 font-[family-name:var(--font-jakarta)] text-3xl font-bold text-[#0A1628]">
            Why This Could Be Big
          </h2>

          <div className="mb-8 rounded-xl border-l-4 border-amber-500 bg-amber-50 p-5">
            <p className="text-sm text-gray-700">
              OnlyFans takes 20% &mdash; that&apos;s <strong>$1.44 billion/year</strong> extracted from creators.
              OpenFans at 5% returns <strong>$1.08 billion</strong> of that back to creators.
            </p>
            <p className="mt-2 text-lg font-bold text-[#0A1628]">
              A $1 billion annual value proposition.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0A1628] text-white">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider">OF Market Share</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider">Annual GMV</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider">Net Revenue (5%)</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider">Est. Valuation</th>
                </tr>
              </thead>
              <tbody>
                {SCALING_MATH.map((row, i) => (
                  <tr key={row.share} className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50"} ${row.highlight ? "font-bold" : ""}`}>
                    <td className="px-5 py-3 text-gray-700">{row.share}</td>
                    <td className="px-5 py-3 text-gray-700">{row.gmv}</td>
                    <td className="px-5 py-3 font-semibold text-emerald-600">{row.revenue}</td>
                    <td className={`px-5 py-3 font-semibold ${row.highlight ? "text-[#00AFF0]" : "text-gray-900"}`}>
                      {row.valuation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-sm text-gray-500">
            The TAM isn&apos;t speculative. OnlyFans proved it. The question is whether OpenFans can capture even a small slice with fundamentally better economics.
          </p>
        </div>
      </section>

      {/* ── RISKS ── */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-[#00AFF0]">
            <AlertTriangle className="h-4 w-4" /> Transparency
          </div>
          <h2 className="mb-8 font-[family-name:var(--font-jakarta)] text-3xl font-bold text-[#0A1628]">
            Risk Factors
          </h2>

          <div className="space-y-4">
            {RISKS.map((r) => (
              <div key={r.title} className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <span className={`shrink-0 rounded px-2.5 py-1 text-[10px] font-bold uppercase ${r.color}`}>
                  {r.severity}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{r.title}</h3>
                  <p className="mt-1 text-xs text-gray-500">{r.mitigation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-[#0A1628] py-20 text-white">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="mb-4 font-[family-name:var(--font-jakarta)] text-3xl font-bold sm:text-4xl">
            How to Participate
          </h2>
          <p className="mb-10 text-white/60">
            Join the pre-seed round and help build the creator platform that puts creators first.
          </p>

          <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.num} className="rounded-xl bg-white/5 p-5">
                <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#00AFF0] text-sm font-bold">
                  {s.num}
                </div>
                <p className="text-xs text-white/60">{s.text}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="mailto:invest@openfans.online"
              className="inline-flex items-center gap-2 rounded-lg bg-[#00AFF0] px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-[#00AFF0]/90"
            >
              Express Interest <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="/OPENFANS-SEED-ROUND.pdf"
              download
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <Download className="h-4 w-4" /> Download Full Deck
            </a>
          </div>

          <p className="mt-8 text-xs text-white/30">
            openfans.online &bull; @openfans.online
          </p>
        </div>
      </section>

      {/* ── DISCLAIMER ── */}
      <section className="border-t border-gray-100 bg-white py-8">
        <div className="mx-auto max-w-5xl px-6">
          <p className="text-[10px] leading-relaxed text-gray-300">
            This page is for informational purposes only and does not constitute an offer to sell or a solicitation of an offer to buy securities.
            Investment in early-stage companies involves significant risk, including the potential loss of your entire investment.
            Past performance of comparable companies is not indicative of future results. Return scenarios are hypothetical illustrations only and are not guaranteed.
            Prospective investors should conduct their own due diligence and consult with legal and financial advisors before making any investment decisions.
          </p>
        </div>
      </section>
    </div>
  );
}
