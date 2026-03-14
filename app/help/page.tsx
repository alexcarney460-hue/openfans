"use client";

import { useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ChevronDown, Mail, Wallet, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: "1",
    category: "Getting Started",
    question: "What is OpenFans?",
    answer:
      "OpenFans is a decentralized content subscription platform built on Solana. Creators can monetize their content through subscriptions, tips, and premium content sales, with all payments processed in USDC on-chain.",
  },
  {
    id: "2",
    category: "Getting Started",
    question: "How do I create a creator account?",
    answer:
      "Sign up with your email, connect your Solana wallet (Phantom or Solflare), and complete your profile. Once verified, you can start posting content and setting up subscription tiers from your dashboard.",
  },
  {
    id: "3",
    category: "Payments",
    question: "What payment methods are supported?",
    answer:
      "All payments are processed in USDC on the Solana blockchain. You will need a compatible wallet like Phantom or Solflare to make payments. We do not currently support credit card payments.",
  },
  {
    id: "4",
    category: "Payments",
    question: "How do creator payouts work?",
    answer:
      "Earnings are deposited directly to your connected Solana wallet in USDC. There is no minimum payout threshold. Platform fees are deducted automatically at the time of each transaction.",
  },
  {
    id: "5",
    category: "Subscriptions",
    question: "Can I cancel my subscription at any time?",
    answer:
      "Yes, you can cancel any subscription at any time from your Subscriptions page. You will continue to have access until the end of your current billing period. No partial refunds are issued for unused time.",
  },
  {
    id: "6",
    category: "Subscriptions",
    question: "What happens if my subscription payment fails?",
    answer:
      "If a payment fails due to insufficient USDC balance, we will retry the transaction once after 24 hours. If it fails again, your subscription will be paused and you will lose access to premium content until payment is resolved.",
  },
  {
    id: "7",
    category: "Content",
    question: "What types of content can I post?",
    answer:
      "Creators can post images, videos, text updates, and downloadable files. All content must comply with our Content Policy. Illegal content, harassment, and copyright infringement are strictly prohibited.",
  },
  {
    id: "8",
    category: "Content",
    question: "Can I set different prices for different content?",
    answer:
      "Yes. You can create multiple subscription tiers with different pricing and access levels. You can also sell individual posts as pay-per-view content and accept tips from your subscribers.",
  },
  {
    id: "9",
    category: "Account",
    question: "How do I delete my account?",
    answer:
      "You can delete your account from Dashboard > Settings > Danger Zone. Account deletion is permanent and will remove all your content, subscriber data, and earnings history. Any pending payouts will be processed before deletion.",
  },
  {
    id: "10",
    category: "Account",
    question: "Is my personal information shared with subscribers?",
    answer:
      "Only your public profile information (display name, avatar, bio) is visible to subscribers. Your email address, wallet address, and other personal details are never shared. You can control your privacy settings in the dashboard.",
  },
];

const CATEGORIES = ["All", "Getting Started", "Payments", "Subscriptions", "Content", "Account"];

export default function HelpPage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered =
    activeCategory === "All"
      ? FAQ_ITEMS
      : FAQ_ITEMS.filter((item) => item.category === activeCategory);

  function toggleItem(id: string) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <SiteHeader />

      <main className="flex-1 pt-14">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Help &amp; FAQ
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Find answers to common questions about OpenFans.
            </p>
          </div>

          {/* Wallet setup guide link */}
          <Link
            href="/help/wallet-setup"
            className="mb-8 flex items-center justify-between rounded-xl border border-[#00AFF0]/20 bg-gradient-to-r from-[#00AFF0]/5 via-white to-white p-5 transition-colors hover:border-[#00AFF0]/40"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00AFF0]/10">
                <Wallet className="h-5 w-5 text-[#00AFF0]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Wallet Setup Guide</p>
                <p className="text-xs text-gray-500">Learn how to set up Phantom wallet and connect it to OpenFans</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" />
          </Link>

          {/* Category filter */}
          <div className="mb-8 flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setActiveCategory(cat);
                  setOpenId(null);
                }}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-[#00AFF0]/15 text-[#00AFF0]"
                    : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* FAQ accordion */}
          <div className="space-y-2">
            {filtered.map((item) => {
              const isOpen = openId === item.id;
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-gray-200 bg-white overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="pr-4 text-sm font-medium text-gray-900">
                      {item.question}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-gray-400 transition-transform",
                        isOpen && "rotate-180"
                      )}
                    />
                  </button>
                  {isOpen && (
                    <div className="border-t border-gray-100 px-5 py-4">
                      <p className="text-sm leading-relaxed text-gray-600">
                        {item.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Contact section */}
          <div className="mt-12 rounded-xl border border-gray-200 bg-white p-8 text-center">
            <Mail className="mx-auto h-8 w-8 text-[#00AFF0] mb-3" />
            <h2 className="text-lg font-semibold text-gray-900">
              Still need help?
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Can&apos;t find what you&apos;re looking for? Reach out to our support team.
            </p>
            <a
              href="mailto:support@openfans.online"
              className="mt-4 inline-block rounded-full bg-[#00AFF0] px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Contact Support
            </a>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
