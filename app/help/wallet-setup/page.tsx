import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  ArrowLeft,
  Download,
  Shield,
  Wallet,
  CheckCircle,
  Smartphone,
  Monitor,
  KeyRound,
  Link2,
  DollarSign,
  HelpCircle,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Step data
// ---------------------------------------------------------------------------

interface Step {
  readonly number: number;
  readonly title: string;
  readonly description: string;
  readonly important?: boolean;
}

const DESKTOP_STEPS: readonly Step[] = [
  {
    number: 1,
    title: "Go to phantom.app",
    description:
      "Open your browser and visit phantom.app. This is the official Phantom website where you can download the extension.",
  },
  {
    number: 2,
    title: 'Click "Download" and select your browser',
    description:
      "Phantom works with Chrome, Firefox, Brave, and Edge. Click the download button and choose the version for your browser.",
  },
  {
    number: 3,
    title: "Add the extension",
    description:
      'Your browser will ask you to confirm the installation. Click "Add Extension" and Phantom will appear as a small icon in your browser toolbar.',
  },
];

const MOBILE_STEPS: readonly Step[] = [
  {
    number: 1,
    title: 'Search "Phantom" in your app store',
    description:
      "Open the App Store (iPhone) or Google Play (Android) and search for Phantom. Look for the purple ghost icon.",
  },
  {
    number: 2,
    title: "Download and open the app",
    description:
      "Tap Install and wait for it to download. Once installed, open the app to get started.",
  },
];

const CREATE_WALLET_STEPS: readonly Step[] = [
  {
    number: 1,
    title: 'Open Phantom and click "Create New Wallet"',
    description:
      "When you open Phantom for the first time, you will see an option to create a new wallet. Tap or click it to get started.",
  },
  {
    number: 2,
    title: "Write down your recovery phrase",
    description:
      "Phantom will show you a set of 12 words. Write these down on paper and store them in a safe place. This is the only way to recover your wallet if you lose access. Never share these words with anyone.",
    important: true,
  },
  {
    number: 3,
    title: "Set a password",
    description:
      "Choose a strong password that you will use to unlock Phantom on this device. This is different from your recovery phrase.",
  },
  {
    number: 4,
    title: "You are done!",
    description:
      "Your wallet is now set up and ready to use. You will see your wallet address at the top of the Phantom window.",
  },
];

const CONNECT_STEPS: readonly Step[] = [
  {
    number: 1,
    title: "Log in to OpenFans",
    description:
      "Go to openfans.online and sign in to your account. If you do not have an account yet, sign up first.",
  },
  {
    number: 2,
    title: "Go to Settings",
    description:
      'From your dashboard, click on "Settings" in the sidebar or navigation menu.',
  },
  {
    number: 3,
    title: 'Click "Connect Wallet"',
    description:
      'Scroll down to the "Connected Wallet" section and click the "Connect Wallet" button.',
  },
  {
    number: 4,
    title: "Approve the connection in Phantom",
    description:
      "A Phantom popup will appear asking you to approve the connection to OpenFans. Click Approve to continue.",
  },
  {
    number: 5,
    title: "Your wallet is now linked",
    description:
      "That is it! Your Phantom wallet is now connected to your OpenFans account. If you are a creator, you will receive payments directly to this wallet.",
  },
];

interface FaqItem {
  readonly question: string;
  readonly answer: string;
}

const FAQ_ITEMS: readonly FaqItem[] = [
  {
    question: "Is it safe?",
    answer:
      "Yes. Phantom is the most popular Solana wallet with millions of users worldwide. It has been audited by multiple security firms and is trusted by the Solana ecosystem.",
  },
  {
    question: "What if I lose my phone?",
    answer:
      "Your recovery phrase lets you restore your wallet on any device. As long as you have those 12 words written down safely, you can always get your wallet back.",
  },
  {
    question: "Do I need SOL?",
    answer:
      "A tiny amount of SOL is needed for transaction fees on the Solana network. The good news is that fees are usually less than $0.01 per transaction. You can buy a small amount of SOL through Phantom or any crypto exchange.",
  },
  {
    question: "Can I use a different wallet?",
    answer:
      "Yes! OpenFans also supports Solflare and other Solana-compatible wallets. The setup process is similar for all of them.",
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionHeading({
  icon: Icon,
  number,
  title,
  subtitle,
}: {
  readonly icon: React.ElementType;
  readonly number: number;
  readonly title: string;
  readonly subtitle: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#00AFF0]/10">
        <Icon className="h-6 w-6 text-[#00AFF0]" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#00AFF0]">
          Step {number}
        </p>
        <h2 className="mt-0.5 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
          {title}
        </h2>
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

function StepCard({
  step,
}: {
  readonly step: Step;
}) {
  return (
    <div
      className={`flex items-start gap-4 rounded-xl border p-4 transition-colors ${
        step.important
          ? "border-amber-200 bg-amber-50/50"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
          step.important
            ? "bg-amber-100 text-amber-700"
            : "bg-[#00AFF0]/10 text-[#00AFF0]"
        }`}
      >
        {step.number}
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-gray-900">{step.title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-gray-500">
          {step.description}
        </p>
        {step.important && (
          <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-amber-700">
            <Shield className="h-3.5 w-3.5" />
            Never share your recovery phrase with anyone
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function WalletSetupPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <SiteHeader />

      <main className="flex-1 pt-14">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Back link */}
          <Link
            href="/help"
            className="mb-8 inline-flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-gray-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Help
          </Link>

          {/* Page title */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Phantom Wallet Setup Guide
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Everything you need to get started with crypto payments on
              OpenFans. No experience required.
            </p>
          </div>

          <div className="space-y-12">
            {/* -------------------------------------------------- */}
            {/* Section 1: What is a Crypto Wallet? */}
            {/* -------------------------------------------------- */}
            <section>
              <div className="rounded-xl border border-[#00AFF0]/20 bg-gradient-to-r from-[#00AFF0]/5 via-white to-white p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#00AFF0]/10">
                    <Wallet className="h-6 w-6 text-[#00AFF0]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-gray-900">
                      What is a Crypto Wallet?
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-gray-500">
                      Think of a crypto wallet as a digital bank account. It is
                      where you receive payments, store your funds, and send
                      money to others. On OpenFans, your wallet is how you get
                      paid as a creator or pay for subscriptions as a fan.
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-gray-500">
                      We recommend{" "}
                      <span className="font-semibold text-gray-700">
                        Phantom
                      </span>{" "}
                      because it is free, easy to use, and trusted by millions
                      of people. Setting it up takes about 2 minutes.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* -------------------------------------------------- */}
            {/* Section 2: Download Phantom */}
            {/* -------------------------------------------------- */}
            <section className="space-y-6">
              <SectionHeading
                icon={Download}
                number={1}
                title="Download Phantom"
                subtitle="Available as a browser extension and mobile app."
              />

              {/* Desktop */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-700">
                    Desktop (Browser Extension)
                  </h3>
                </div>
                <div className="space-y-3">
                  {DESKTOP_STEPS.map((step) => (
                    <StepCard key={step.number} step={step} />
                  ))}
                </div>
              </div>

              {/* Mobile */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-700">
                    Mobile (iOS / Android)
                  </h3>
                </div>
                <div className="space-y-3">
                  {MOBILE_STEPS.map((step) => (
                    <StepCard key={step.number} step={step} />
                  ))}
                </div>
              </div>

              {/* Download link */}
              <a
                href="https://phantom.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#00AFF0] px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Download Phantom
                <ExternalLink className="h-4 w-4" />
              </a>
            </section>

            {/* -------------------------------------------------- */}
            {/* Section 3: Create Your Wallet */}
            {/* -------------------------------------------------- */}
            <section className="space-y-4">
              <SectionHeading
                icon={KeyRound}
                number={2}
                title="Create Your Wallet"
                subtitle="Set up your wallet in under a minute."
              />
              <div className="space-y-3">
                {CREATE_WALLET_STEPS.map((step) => (
                  <StepCard key={step.number} step={step} />
                ))}
              </div>
            </section>

            {/* -------------------------------------------------- */}
            {/* Section 4: Connect to OpenFans */}
            {/* -------------------------------------------------- */}
            <section className="space-y-4">
              <SectionHeading
                icon={Link2}
                number={3}
                title="Connect to OpenFans"
                subtitle="Link your wallet to start receiving or making payments."
              />
              <div className="space-y-3">
                {CONNECT_STEPS.map((step) => (
                  <StepCard key={step.number} step={step} />
                ))}
              </div>
            </section>

            {/* -------------------------------------------------- */}
            {/* Section 5: Getting USDC */}
            {/* -------------------------------------------------- */}
            <section className="space-y-4">
              <SectionHeading
                icon={DollarSign}
                number={4}
                title="Getting USDC"
                subtitle="USDC is the digital dollar used for all payments on OpenFans."
              />
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <p className="text-sm leading-relaxed text-gray-500">
                  All payments on OpenFans use{" "}
                  <span className="font-semibold text-gray-700">USDC</span>, a
                  digital dollar that is always worth $1.00 USD. To subscribe to
                  creators or make purchases, you will need USDC in your Phantom
                  wallet.
                </p>
                <div className="mt-4 space-y-3">
                  <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#00AFF0]" />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">
                        Buy directly in Phantom
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Phantom has a built-in purchase feature. Tap the Buy
                        button in your wallet and follow the instructions to
                        purchase USDC with a debit card or bank transfer.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#00AFF0]" />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">
                        Transfer from an exchange
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        If you already have an account on Coinbase, Binance, or
                        another exchange, you can buy USDC there and send it to
                        your Phantom wallet address. Make sure to select the
                        Solana network when transferring.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* -------------------------------------------------- */}
            {/* Section 6: FAQ */}
            {/* -------------------------------------------------- */}
            <section className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#00AFF0]/10">
                  <HelpCircle className="h-6 w-6 text-[#00AFF0]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                    Frequently Asked Questions
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Common questions about wallets and payments.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {FAQ_ITEMS.map((item) => (
                  <div
                    key={item.question}
                    className="rounded-xl border border-gray-200 bg-white p-5"
                  >
                    <h3 className="text-sm font-semibold text-gray-900">
                      {item.question}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-500">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* -------------------------------------------------- */}
            {/* CTA */}
            {/* -------------------------------------------------- */}
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
              <CheckCircle className="mx-auto h-8 w-8 text-[#00AFF0] mb-3" />
              <h2 className="text-lg font-semibold text-gray-900">
                Ready to get started?
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Once your wallet is set up, create your OpenFans account and
                connect it.
              </p>
              <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/signup"
                  className="inline-block rounded-full bg-[#00AFF0] px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Create Account
                </Link>
                <Link
                  href="/help"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-700"
                >
                  More Help Topics
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
