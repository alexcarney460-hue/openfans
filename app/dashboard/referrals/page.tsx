"use client";

import { useState, useEffect } from "react";
import {
  Users,
  DollarSign,
  Link2,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  Share2,
  Gift,
  Star,
  Heart,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ---- Types ----------------------------------------------------------------

interface AffiliateData {
  readonly referral_code: string;
  readonly referral_link: string;
  readonly commission_rate: number;
  readonly total_referrals: number;
  readonly total_earnings_usdc: number;
  readonly pending_earnings_usdc: number;
  readonly is_active: boolean;
  readonly creator_referrals: number;
  readonly fan_referrals: number;
}

interface Referral {
  readonly id: number;
  readonly username: string;
  readonly display_name: string;
  readonly role: "creator" | "subscriber" | "admin";
  readonly status: "pending" | "active" | "expired";
  readonly created_at: string;
  readonly converted_at: string | null;
  readonly total_commission_usdc: number;
}

// ---- Helpers ---------------------------------------------------------------

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

function getRoleLabel(role: string): string {
  if (role === "creator") return "Creator";
  return "Fan";
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#00AFF0]" />
    </div>
  );
}

// ---- Copy Button -----------------------------------------------------------

function CopyButton({
  text,
  label,
}: {
  readonly text: string;
  readonly label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 rounded-lg bg-[#00AFF0] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#009ad6]"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          {label ?? "Copy"}
        </>
      )}
    </button>
  );
}

// ---- Page ------------------------------------------------------------------

export default function ReferralsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);

  useEffect(() => {
    fetch("/api/affiliates")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((json) => {
        if (json.data) {
          setAffiliate(json.data.affiliate);
          setReferrals(json.data.referrals ?? []);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load referral data. Please try again.");
        setLoading(false);
      });
  }, []);

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Referrals
          </h1>
          <p className="mt-1 text-sm text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  const commissionRate = affiliate?.commission_rate ?? 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Referral Program
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Share your link with creators and fans. Earn {commissionRate}%
          commission on referred creators' revenue.
        </p>
      </div>

      {/* Referral Code & Link */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Referral Code */}
        <Card className="border-gray-200 bg-white">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00AFF0]/10">
                <Gift className="h-5 w-5 text-[#00AFF0]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-400">
                  Your Referral Code
                </p>
                <p className="truncate text-lg font-bold text-gray-900">
                  {affiliate?.referral_code ?? "---"}
                </p>
              </div>
            </div>
            <div className="mt-3">
              <CopyButton
                text={affiliate?.referral_code ?? ""}
                label="Copy Code"
              />
            </div>
          </CardContent>
        </Card>

        {/* Referral Link */}
        <Card className="border-gray-200 bg-white">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00AFF0]/10">
                <Link2 className="h-5 w-5 text-[#00AFF0]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-400">
                  Your Referral Link
                </p>
                <code className="block truncate text-sm text-gray-700">
                  {affiliate?.referral_link ?? "---"}
                </code>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <CopyButton
                text={affiliate?.referral_link ?? ""}
                label="Copy Link"
              />
              <button
                onClick={() =>
                  window.open(
                    `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Join OpenFans and keep 95% of your earnings! ${affiliate?.referral_link ?? ""}`)}`,
                    "_blank",
                  )
                }
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
              >
                <Share2 className="h-3.5 w-3.5" />
                Share
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Referrals */}
        <Card className="border-gray-200 bg-white">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400">
                  Total Referrals
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {affiliate?.total_referrals ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Creator Referrals */}
        <Card className="border-gray-200 bg-white">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Star className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400">
                  Creator Referrals
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {affiliate?.creator_referrals ?? 0}
                </p>
                <p className="text-xs text-gray-400">Earning commission</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fan Referrals */}
        <Card className="border-gray-200 bg-white">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-500/10">
                <Heart className="h-5 w-5 text-pink-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400">
                  Fan Referrals
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {affiliate?.fan_referrals ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Earnings */}
        <Card className="border-gray-200 bg-white">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400">
                  Total Earned
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatUsdc(affiliate?.total_earnings_usdc ?? 0)}
                </p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1">
              <Clock className="h-3 w-3 text-amber-500" />
              <span className="text-xs text-gray-400">
                Pending: {formatUsdc(affiliate?.pending_earnings_usdc ?? 0)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* How It Works */}
      <Card className="border-[#00AFF0]/20 bg-[#00AFF0]/5">
        <CardContent className="p-5">
          <h3 className="text-sm font-bold text-gray-900">How it works</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#00AFF0] text-xs font-bold text-white">
                1
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Share your referral link
                </p>
                <p className="text-xs text-gray-500">
                  Share with creators and fans alike
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#00AFF0] text-xs font-bold text-white">
                2
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  They sign up with your code
                </p>
                <p className="text-xs text-gray-500">
                  Fans are directed to your profile. Creators join the platform.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#00AFF0] text-xs font-bold text-white">
                3
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Earn {commissionRate}% on creator revenue
                </p>
                <p className="text-xs text-gray-500">
                  When referred creators earn, you get commission automatically
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral List */}
      <Card className="border-gray-200 bg-white">
        <CardHeader className="border-b border-gray-200 pb-3">
          <CardTitle className="text-base font-semibold">
            Your Referrals
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Table header */}
          <div className="hidden border-b border-gray-200 px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-400 md:grid md:grid-cols-12 md:gap-4">
            <div className="col-span-3">User</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-3">Date Joined</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2 text-right">Commission</div>
          </div>

          {/* Table rows */}
          <div className="divide-y divide-gray-100">
            {referrals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Users className="mb-3 h-10 w-10 opacity-40" />
                <p className="text-sm">No referrals yet</p>
                <p className="mt-1 text-xs">
                  Share your referral link to start earning
                </p>
              </div>
            ) : (
              referrals.map((ref) => (
                <div
                  key={ref.id}
                  className="flex flex-col gap-2 px-6 py-4 transition-colors hover:bg-gray-50 md:grid md:grid-cols-12 md:items-center md:gap-4"
                >
                  {/* User */}
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#00AFF0] to-[#0077B6] text-xs font-bold text-white">
                      {(ref.display_name ?? ref.username)
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {ref.display_name}
                      </p>
                      <p className="text-xs text-gray-400">@{ref.username}</p>
                    </div>
                  </div>

                  {/* Role */}
                  <div className="col-span-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        ref.role === "creator"
                          ? "bg-amber-500/10 text-amber-600"
                          : "bg-pink-500/10 text-pink-600"
                      }`}
                    >
                      {ref.role === "creator" ? (
                        <Star className="h-3 w-3" />
                      ) : (
                        <Heart className="h-3 w-3" />
                      )}
                      {getRoleLabel(ref.role)}
                    </span>
                  </div>

                  {/* Date Joined */}
                  <div className="col-span-3">
                    <span className="text-sm text-gray-500">
                      {formatDate(ref.created_at)}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
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
                  </div>

                  {/* Commission Earned */}
                  <div className="col-span-2 text-right">
                    {ref.role === "creator" ? (
                      <>
                        <span className="text-sm font-semibold text-green-600">
                          {ref.total_commission_usdc > 0
                            ? `+${formatUsdc(ref.total_commission_usdc)}`
                            : formatUsdc(0)}
                        </span>
                        <span className="ml-1 text-xs text-gray-400">USDC</span>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">--</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
