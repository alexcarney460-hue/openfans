"use client";

import { useState, useEffect } from "react";
import {
  Users,
  DollarSign,
  Link2,
  Copy,
  CheckCircle2,
  Clock,
  TrendingUp,
  Gift,
  Share2,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface AffiliateData {
  referral_code: string;
  referral_link: string;
  commission_rate: number;
  total_referrals: number;
  total_earnings_usdc: number;
  pending_earnings_usdc: number;
  is_active: boolean;
}

interface Referral {
  id: number;
  username: string;
  display_name: string;
  status: "pending" | "active" | "expired";
  created_at: string;
  converted_at: string | null;
}

interface Commission {
  id: number;
  source_type: "subscription" | "tip";
  source_amount_usdc: number;
  commission_amount_usdc: number;
  status: "pending" | "paid" | "cancelled";
  created_at: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatUsdc(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#00AFF0]" />
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function AffiliatePage() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"referrals" | "commissions">("referrals");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);

  useEffect(() => {
    fetch("/api/affiliate")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((json) => {
        if (json.data) {
          setAffiliate(json.data.affiliate);
          setReferrals(json.data.referrals ?? []);
          setCommissions(json.data.commissions ?? []);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load affiliate data. Please try again.");
        setLoading(false);
      });
  }, []);

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Affiliate Program</h1>
          <p className="mt-1 text-sm text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const commissionRate = affiliate?.commission_rate ?? 10;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Affiliate Program</h1>
        <p className="mt-1 text-sm text-gray-500">
          Earn {commissionRate}% commission on every subscription from people you refer
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00AFF0]/10">
              <Users className="h-5 w-5 text-[#00AFF0]" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400">Total Referrals</p>
              <p className="text-2xl font-bold text-gray-900">
                {affiliate?.total_referrals ?? 0}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400">Total Earned</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatUsdc(affiliate?.total_earnings_usdc ?? 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatUsdc(affiliate?.pending_earnings_usdc ?? 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
              <TrendingUp className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400">Commission Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {commissionRate}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Referral Link */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-3 flex items-center gap-2">
          <Link2 className="h-4 w-4 text-[#00AFF0]" />
          <h3 className="text-sm font-bold text-gray-900">Your Referral Link</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5">
            <code className="text-sm text-gray-700">{affiliate?.referral_link ?? ""}</code>
          </div>
          <button
            onClick={() => handleCopy(affiliate?.referral_link ?? "")}
            className="flex items-center gap-2 rounded-lg bg-[#00AFF0] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#009ad6]"
          >
            {copied ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy
              </>
            )}
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() =>
              window.open(
                `https://wa.me/?text=${encodeURIComponent(`Join me on OpenFans! ${affiliate?.referral_link ?? ""}`)}`,
                "_blank",
              )
            }
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            <Share2 className="h-3 w-3" />
            WhatsApp
          </button>
          <button
            onClick={() =>
              window.open(
                `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out OpenFans — the creator platform that pays more! ${affiliate?.referral_link ?? ""}`)}`,
                "_blank",
              )
            }
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            <Share2 className="h-3 w-3" />
            Twitter
          </button>
          <button
            onClick={() => handleCopy(affiliate?.referral_code ?? "")}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            <Gift className="h-3 w-3" />
            Code: {affiliate?.referral_code ?? ""}
          </button>
        </div>
      </div>

      {/* How It Works */}
      <div className="rounded-xl border border-[#00AFF0]/20 bg-[#00AFF0]/5 p-5">
        <h3 className="text-sm font-bold text-gray-900">How the affiliate program works</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#00AFF0] text-xs font-bold text-white">
              1
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Share your link</p>
              <p className="text-xs text-gray-500">
                Send your unique referral link to friends, followers, or post it on social media
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#00AFF0] text-xs font-bold text-white">
              2
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">They sign up</p>
              <p className="text-xs text-gray-500">
                When someone creates an account through your link, they become your referral
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#00AFF0] text-xs font-bold text-white">
              3
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">You earn commission</p>
              <p className="text-xs text-gray-500">
                Earn {commissionRate}% of every subscription payment your referrals make
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Referrals / Commissions */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center gap-1 border-b border-gray-200 px-4 pt-4">
          {(["referrals", "commissions"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === tab
                  ? "bg-[#00AFF0]/10 text-[#00AFF0]"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab === "referrals" ? "Referrals" : "Commissions"}
            </button>
          ))}
        </div>

        {activeTab === "referrals" ? (
          <div className="divide-y divide-gray-100">
            {referrals.length === 0 ? (
              <div className="py-12 text-center">
                <Users className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2 text-sm text-gray-400">No referrals yet</p>
                <p className="text-xs text-gray-400">Share your link to start earning</p>
              </div>
            ) : (
              referrals.map((ref) => (
                <div
                  key={ref.id}
                  className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-gray-50"
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#00AFF0] to-[#0077B6] text-xs font-bold text-white">
                    {ref.display_name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {ref.display_name}
                    </p>
                    <p className="text-xs text-gray-400">@{ref.username}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        ref.status === "active"
                          ? "bg-green-500/10 text-green-600"
                          : "bg-amber-500/10 text-amber-600"
                      }`}
                    >
                      {ref.status === "active" ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                      {ref.status === "active" ? "Active" : "Pending"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDate(ref.created_at)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {commissions.length === 0 ? (
              <div className="py-12 text-center">
                <DollarSign className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2 text-sm text-gray-400">No commissions yet</p>
              </div>
            ) : (
              commissions.map((comm) => (
                <div
                  key={comm.id}
                  className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-gray-50"
                >
                  <div
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
                      comm.source_type === "subscription"
                        ? "bg-[#00AFF0]/10"
                        : "bg-purple-500/10"
                    }`}
                  >
                    <DollarSign
                      className={`h-4 w-4 ${
                        comm.source_type === "subscription"
                          ? "text-[#00AFF0]"
                          : "text-purple-500"
                      }`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {comm.source_type === "subscription"
                        ? "Subscription Commission"
                        : "Tip Commission"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatUsdc(comm.source_amount_usdc)} payment
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-600">
                      +{formatUsdc(comm.commission_amount_usdc)}
                    </p>
                    <div className="flex items-center justify-end gap-1">
                      <span
                        className={`text-xs ${
                          comm.status === "paid" ? "text-green-500" : "text-amber-500"
                        }`}
                      >
                        {comm.status === "paid" ? "Paid" : "Pending"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(comm.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
