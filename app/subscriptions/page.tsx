"use client";

import { useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, Star, Zap, X } from "lucide-react";

const MOCK_SUBSCRIPTIONS = [
  {
    id: "1",
    creator: "AlphaTrader",
    avatar: "A",
    tier: "VIP",
    tierIcon: Crown,
    price: "$49.99",
    renewalDate: "Apr 15, 2026",
    status: "active" as const,
  },
  {
    id: "2",
    creator: "CryptoArtist",
    avatar: "C",
    tier: "Premium",
    tierIcon: Star,
    price: "$19.99",
    renewalDate: "Mar 18, 2026",
    status: "expiring" as const,
  },
  {
    id: "3",
    creator: "DeFi_Guru",
    avatar: "D",
    tier: "Basic",
    tierIcon: Zap,
    price: "$9.99",
    renewalDate: "May 1, 2026",
    status: "active" as const,
  },
  {
    id: "4",
    creator: "NFT_Whale",
    avatar: "N",
    tier: "Premium",
    tierIcon: Star,
    price: "$19.99",
    renewalDate: "Feb 28, 2026",
    status: "expired" as const,
  },
] as const;

function statusColor(status: "active" | "expiring" | "expired") {
  switch (status) {
    case "active":
      return "bg-emerald-500";
    case "expiring":
      return "bg-amber-500";
    case "expired":
      return "bg-red-500";
  }
}

function statusLabel(status: "active" | "expiring" | "expired") {
  switch (status) {
    case "active":
      return "Active";
    case "expiring":
      return "Expiring Soon";
    case "expired":
      return "Expired";
  }
}

export default function SubscriptionsPage() {
  const [subscriptions] = useState<typeof MOCK_SUBSCRIPTIONS[number][]>([...MOCK_SUBSCRIPTIONS]);
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
                const TierIcon = sub.tierIcon;
                return (
                  <Card key={sub.id} className="border-gray-200 bg-white">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#00AFF0] text-lg font-bold text-white">
                          {sub.avatar}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                              {sub.creator}
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
                              <p className="text-lg font-bold text-gray-900">{sub.price}</p>
                              <p className="text-[10px] text-gray-400">
                                {sub.status === "expired"
                                  ? `Expired ${sub.renewalDate}`
                                  : `Renews ${sub.renewalDate}`}
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
