"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  DollarSign,
  Users,
  Coins,
  PenSquare,
  User,
  Wallet,
  TrendingUp,
  Compass,
  Heart,
  MessageSquare,
  Share2,
  Check,
  Copy,
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GettingStartedGuide } from "@/components/GettingStartedGuide";
import { StoryBar } from "@/components/StoryBar";
import { LiveStreamBanner } from "@/components/LiveStreamBanner";

// -- Types --

interface EarningsSummary {
  total_earnings_usdc: number;
  this_month_earnings_usdc: number;
  pending_payout_usdc: number;
  total_paid_out_usdc: number;
}

interface RecentTransaction {
  id: string | number;
  type: "subscription" | "tip" | "payout";
  from_username: string | null;
  amount_usdc: number;
  tier: string | null;
  created_at: string;
}

// -- Helpers --

function formatUsdc(cents: number): string {
  return `$${(Math.abs(cents) / 100).toFixed(2)}`;
}

function formatTimeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  const hrs = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  if (hrs < 24) return `${hrs} hr ago`;
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function activityBadgeVariant(type: string) {
  switch (type) {
    case "subscription":
      return "default" as const;
    case "tip":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#00AFF0]" />
    </div>
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentTransaction[]>([]);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [username, setUsername] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("subscriber");
  const [displayName, setDisplayName] = useState<string>("");
  const [hasAvatar, setHasAvatar] = useState(false);
  const [hasBanner, setHasBanner] = useState(false);
  const [hasBio, setHasBio] = useState(false);
  const [postCount, setPostCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [liveStream, setLiveStream] = useState<{
    id: string;
    title: string;
    viewer_count: number;
    creator: {
      username: string;
      display_name: string;
      avatar_url: string | null;
    };
  } | null>(null);

  const isCreator = userRole === "creator" || userRole === "admin";

  const handleCopyProfileLink = async () => {
    if (!username) return;
    const profileUrl = `${window.location.origin}/${username}`;
    try {
      await navigator.clipboard.writeText(profileUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = profileUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const meRes = await fetch("/api/me").then((r) => r.json());
        if (meRes.data) {
          setUsername(meRes.data.username ?? null);
          setUserRole(meRes.data.role ?? "subscriber");
          setDisplayName(meRes.data.display_name ?? "");
          setHasAvatar(!!meRes.data.avatar_url);
          setHasBanner(!!meRes.data.banner_url);
          setHasBio(!!meRes.data.bio && meRes.data.bio.trim().length > 0);
        }

        // Fetch live streams from followed creators
        try {
          const streamsRes = await fetch("/api/streams?status=live&limit=1");
          if (streamsRes.ok) {
            const streamsJson = await streamsRes.json();
            const liveStreams = streamsJson.data ?? [];
            if (liveStreams.length > 0) {
              setLiveStream(liveStreams[0]);
            }
          }
        } catch {
          // Non-critical, silently ignore
        }

        const role = meRes.data?.role ?? "subscriber";
        const isCreatorRole = role === "creator" || role === "admin";

        if (isCreatorRole) {
          const [earningsRes, subscribersRes, postsRes, verificationRes] = await Promise.allSettled([
            fetch("/api/earnings").then((r) => r.json()),
            fetch("/api/subscribers").then((r) => r.json()),
            fetch(`/api/posts?creator_id=${meRes.data.id}&limit=1`).then((r) => r.ok ? r.json() : null),
            fetch("/api/verification").then((r) => r.ok ? r.json() : null),
          ]);

          if (earningsRes.status === "fulfilled" && earningsRes.value.data) {
            setSummary(earningsRes.value.data);
            if (earningsRes.value.transactions) {
              setRecentActivity(earningsRes.value.transactions.slice(0, 6));
            }
          }

          if (subscribersRes.status === "fulfilled" && subscribersRes.value.data) {
            setSubscriberCount(subscribersRes.value.data.length);
          }

          if (postsRes.status === "fulfilled" && postsRes.value?.data) {
            setPostCount(postsRes.value.data.length);
          }

          if (verificationRes.status === "fulfilled" && verificationRes.value?.data) {
            setVerificationStatus(verificationRes.value.data.verification_status);
          }
        }
      } catch {
        setError("Failed to load dashboard data. Please try again.");
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  const totalEarnings = summary?.total_earnings_usdc ?? 0;
  const thisMonthEarnings = summary?.this_month_earnings_usdc ?? 0;
  const pendingPayout = summary?.pending_payout_usdc ?? 0;

  const stats = [
    {
      label: "Total Earnings",
      value: formatUsdc(totalEarnings),
      subtext: "USDC",
      icon: DollarSign,
      gradient: "from-[#00AFF0]/20 to-[#00AFF0]/5",
      iconColor: "text-[#00AFF0]",
    },
    {
      label: "Active Subscribers",
      value: subscriberCount.toLocaleString(),
      subtext: "across all tiers",
      icon: Users,
      gradient: "from-[#00AFF0]/20 to-[#00AFF0]/5",
      iconColor: "text-[#00AFF0]",
    },
    {
      label: "This Month",
      value: formatUsdc(thisMonthEarnings),
      subtext: "USDC this month",
      icon: TrendingUp,
      gradient: "from-blue-500/20 to-blue-500/5",
      iconColor: "text-blue-400",
    },
    {
      label: "Pending Payout",
      value: formatUsdc(pendingPayout),
      subtext: "USDC available",
      icon: Coins,
      gradient: "from-amber-500/20 to-amber-500/5",
      iconColor: "text-amber-400",
    },
  ];

  // Fan dashboard
  if (!isCreator) {
    return (
      <div className="space-y-6">
        {/* Stories from subscribed creators */}
        <StoryBar />

        {/* Live stream banner */}
        {liveStream && (
          <LiveStreamBanner stream={liveStream} />
        )}

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome{displayName ? `, ${displayName}` : ""}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Discover and support your favorite creators.
          </p>
        </div>

        {/* Fan quick actions */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Link href="/explore">
            <Card className="border-gray-200 bg-white transition-colors hover:border-[#00AFF0]/30 hover:shadow-sm cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#00AFF0]/10">
                  <Compass className="h-6 w-6 text-[#00AFF0]" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Explore Creators</h3>
                <p className="mt-1 text-xs text-muted-foreground">Find new creators to follow</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/messages">
            <Card className="border-gray-200 bg-white transition-colors hover:border-[#00AFF0]/30 hover:shadow-sm cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#00AFF0]/10">
                  <MessageSquare className="h-6 w-6 text-[#00AFF0]" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Messages</h3>
                <p className="mt-1 text-xs text-muted-foreground">Chat with your favorite creators</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/wallet">
            <Card className="border-gray-200 bg-white transition-colors hover:border-[#00AFF0]/30 hover:shadow-sm cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#00AFF0]/10">
                  <Wallet className="h-6 w-6 text-[#00AFF0]" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Wallet</h3>
                <p className="mt-1 text-xs text-muted-foreground">Manage your connected wallet</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Become a creator CTA */}
        <Card className="border-[#00AFF0]/20 bg-gradient-to-r from-[#00AFF0]/5 to-transparent">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <h3 className="text-lg font-bold text-foreground">Want to start creating?</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Keep up to 95% of your earnings. Set up your creator profile in under 2 minutes.
              </p>
            </div>
            <Button asChild className="bg-[#00AFF0] hover:bg-[#009dd8] shrink-0">
              <Link href="/onboarding">
                Become a Creator
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Creator dashboard
  return (
    <div className="space-y-6">
      {/* Story bar for creators */}
      <StoryBar />

      {/* Live stream banner */}
      {liveStream && (
        <LiveStreamBanner stream={liveStream} />
      )}

      {/* Getting Started Guide for new creators */}
      <GettingStartedGuide
        hasAvatar={hasAvatar}
        hasBanner={hasBanner}
        hasBio={hasBio}
        postCount={postCount}
        username={username}
      />

      {/* Verification banner */}
      {verificationStatus && verificationStatus !== "verified" && (
        <Card className={`border ${
          verificationStatus === "rejected"
            ? "border-red-200 bg-red-50"
            : verificationStatus === "pending"
              ? "border-amber-200 bg-amber-50"
              : "border-[#00AFF0]/20 bg-[#00AFF0]/5"
        }`}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              {verificationStatus === "rejected" ? (
                <ShieldAlert className="h-5 w-5 text-red-500 shrink-0" />
              ) : verificationStatus === "pending" ? (
                <ShieldCheck className="h-5 w-5 text-amber-500 shrink-0" />
              ) : (
                <ShieldAlert className="h-5 w-5 text-[#00AFF0] shrink-0" />
              )}
              <div>
                <p className={`text-sm font-medium ${
                  verificationStatus === "rejected"
                    ? "text-red-700"
                    : verificationStatus === "pending"
                      ? "text-amber-700"
                      : "text-foreground"
                }`}>
                  {verificationStatus === "rejected"
                    ? "Verification rejected -- please resubmit"
                    : verificationStatus === "pending"
                      ? "Verification under review"
                      : "Complete identity verification to start posting"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {verificationStatus === "pending"
                    ? "Your documents are being reviewed. This usually takes 24-48 hours."
                    : "You must verify your identity before you can publish content or receive payments."}
                </p>
              </div>
            </div>
            {verificationStatus !== "pending" && (
              <Button asChild size="sm" className="bg-[#00AFF0] hover:bg-[#009dd8] shrink-0">
                <Link href="/dashboard/verification">
                  Verify Now
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back. Here is an overview of your creator stats.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-gray-200 bg-white">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${stat.gradient}`}
                  >
                    <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {stat.subtext}
                  </p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stat.label}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Button asChild className="bg-[#00AFF0] hover:bg-[#009dd8]">
          <Link href="/dashboard/posts/new">
            <PenSquare className="mr-2 h-4 w-4" />
            New Post
          </Link>
        </Button>
        <Button asChild variant="outline" className="border-gray-200">
          <Link href={username ? `/${username}` : "/dashboard"}>
            <User className="mr-2 h-4 w-4" />
            View Profile
          </Link>
        </Button>
        <Button asChild variant="outline" className="border-gray-200">
          <Link href="/dashboard/earnings">
            <Wallet className="mr-2 h-4 w-4" />
            Withdraw Funds
          </Link>
        </Button>
        {username && (
          <Button
            variant="outline"
            className="border-gray-200"
            onClick={handleCopyProfileLink}
          >
            {linkCopied ? (
              <>
                <Check className="mr-2 h-4 w-4 text-emerald-500" />
                Copied!
              </>
            ) : (
              <>
                <Share2 className="mr-2 h-4 w-4" />
                Copy Profile Link
              </>
            )}
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Earnings chart placeholder */}
        <Card className="border-gray-200 bg-white lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Earnings Overview
              </CardTitle>
              {thisMonthEarnings > 0 && (
                <div className="flex items-center gap-1 text-xs text-emerald-400">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {formatUsdc(thisMonthEarnings)} this month
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Chart placeholder */}
            <div className="flex h-64 items-end gap-2 rounded-lg border border-dashed border-gray-200 p-4">
              {[40, 55, 35, 70, 50, 80, 65, 90, 60, 75, 85, 95].map(
                (height, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-sm bg-[#00AFF0]/50 transition-all hover:bg-[#00AFF0]/70"
                    style={{ height: `${height}%` }}
                  />
                )
              )}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
              <span>Jul</span>
              <span>Aug</span>
              <span>Sep</span>
              <span>Oct</span>
              <span>Nov</span>
              <span>Dec</span>
            </div>
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card className="border-gray-200 bg-white lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <DollarSign className="mb-2 h-8 w-8 opacity-40" />
                <p className="text-sm">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((item) => {
                  const detail =
                    item.type === "payout"
                      ? "Withdrawal to wallet"
                      : item.type === "tip"
                        ? "tipped on your content"
                        : `subscribed${item.tier ? ` to ${item.tier} tier` : ""}`;

                  return (
                    <div
                      key={`${item.type}-${item.id}`}
                      className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50"
                    >
                      {/* Avatar placeholder */}
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-muted-foreground">
                        {item.from_username
                          ? item.from_username.charAt(0).toUpperCase()
                          : "$"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-foreground">
                            {item.from_username ?? "System"}
                          </span>
                          <Badge
                            variant={activityBadgeVariant(item.type)}
                            className="shrink-0 text-[10px]"
                          >
                            {item.type}
                          </Badge>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {detail}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>{formatTimeAgo(item.created_at)}</span>
                          {item.amount_usdc && item.type !== "payout" && (
                            <>
                              <span>--</span>
                              <span className="font-medium text-emerald-400">
                                {formatUsdc(item.amount_usdc)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
