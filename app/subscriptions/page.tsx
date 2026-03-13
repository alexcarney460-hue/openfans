"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, Star, Zap, LogIn } from "lucide-react";

interface ApiSubscription {
  readonly id: number;
  readonly creator_id: string;
  readonly tier: string;
  readonly price_usdc: number;
  readonly status: string;
  readonly started_at: string;
  readonly expires_at: string;
  readonly created_at: string;
  readonly creator_username: string;
  readonly creator_display_name: string;
  readonly creator_avatar_url: string | null;
}

function tierIcon(tier: string) {
  switch (tier) {
    case "vip":
      return Crown;
    case "premium":
      return Star;
    default:
      return Zap;
  }
}

function statusColor(status: string) {
  switch (status) {
    case "active":
      return "bg-emerald-500";
    case "expired":
      return "bg-red-500";
    case "cancelled":
      return "bg-gray-500";
    default:
      return "bg-gray-500";
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "active":
      return "Active";
    case "expired":
      return "Expired";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<ApiSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [notLoggedIn, setNotLoggedIn] = useState(false);

  useEffect(() => {
    async function fetchSubscriptions() {
      try {
        const res = await fetch("/api/subscriptions");
        if (res.status === 401) {
          setNotLoggedIn(true);
          return;
        }
        if (!res.ok) return;
        const json = await res.json();
        setSubscriptions(json.data ?? []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchSubscriptions();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <SiteHeader />
        <main className="flex-1 pt-14">
          <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
            <p className="text-gray-400">Loading subscriptions...</p>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (notLoggedIn) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <SiteHeader />
        <main className="flex-1 pt-14">
          <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
                <LogIn className="h-8 w-8 text-gray-300" />
              </div>
              <p className="text-lg font-medium text-gray-500">
                Log in to view your subscriptions
              </p>
              <p className="mt-1 text-sm text-gray-400">
                You need to be signed in to manage your subscriptions.
              </p>
              <Button asChild className="mt-6 bg-[#00AFF0] hover:bg-[#009dd8]">
                <Link href="/login">Log In</Link>
              </Button>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const isEmpty = subscriptions.length === 0;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <SiteHeader />

      <main className="flex-1 pt-14">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              My Subscriptions
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your active subscriptions and renewals.
            </p>
          </div>

          {isEmpty ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
                <Star className="h-8 w-8 text-gray-300" />
              </div>
              <p className="text-lg font-medium text-gray-500">
                You haven&apos;t subscribed to any creators yet
              </p>
              <p className="mt-1 text-sm text-gray-400">
                Discover amazing creators and support their work.
              </p>
              <Button asChild className="mt-6 bg-[#00AFF0] hover:bg-[#009dd8]">
                <Link href="/explore">Explore Creators</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {subscriptions.map((sub) => {
                const TierIcon = tierIcon(sub.tier);
                const priceFormatted = `$${((sub.price_usdc ?? 0) / 100).toFixed(2)}`;
                const expiresDate = sub.expires_at
                  ? new Date(sub.expires_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "";
                return (
                  <Card key={sub.id} className="border-gray-200 bg-white">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#00AFF0] text-lg font-bold text-white overflow-hidden">
                          {sub.creator_avatar_url ? (
                            <img
                              src={sub.creator_avatar_url}
                              alt={sub.creator_display_name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            sub.creator_display_name?.charAt(0) ?? "?"
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                              {sub.creator_display_name}
                            </h3>
                            <Badge className="shrink-0 bg-[#00AFF0]/15 text-[#00AFF0] text-[10px] border-0">
                              <TierIcon className="mr-1 h-3 w-3" />
                              {sub.tier}
                            </Badge>
                          </div>

                          <div className="mt-2 flex items-center gap-2">
                            <span className={`inline-block h-2 w-2 rounded-full ${statusColor(sub.status)}`} />
                            <span className="text-xs text-gray-500">
                              {statusLabel(sub.status)}
                            </span>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <div>
                              <p className="text-lg font-bold text-gray-900">{priceFormatted}</p>
                              <p className="text-[10px] text-gray-400">
                                {sub.status === "expired"
                                  ? `Expired ${expiresDate}`
                                  : `Renews ${expiresDate}`}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-gray-200 text-xs"
                            >
                              Manage
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
