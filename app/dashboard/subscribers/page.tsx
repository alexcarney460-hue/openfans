"use client";

import { useState, useMemo, useCallback } from "react";
import { Users, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// -- Types --

type Tier = "basic" | "premium" | "vip";

interface Subscriber {
  readonly id: string;
  readonly username: string;
  readonly avatar: string | null;
  readonly tier: Tier;
  readonly subscribedSince: string;
  readonly status: "active" | "expired" | "cancelled";
}

// -- Mock data --

const MOCK_SUBSCRIBERS: readonly Subscriber[] = [
  {
    id: "1",
    username: "alex_web3",
    avatar: null,
    tier: "premium",
    subscribedSince: "2026-01-15",
    status: "active",
  },
  {
    id: "2",
    username: "crypto_fan",
    avatar: null,
    tier: "basic",
    subscribedSince: "2026-02-03",
    status: "active",
  },
  {
    id: "3",
    username: "sol_holder",
    avatar: null,
    tier: "basic",
    subscribedSince: "2026-02-20",
    status: "active",
  },
  {
    id: "4",
    username: "nft_collector",
    avatar: null,
    tier: "vip",
    subscribedSince: "2025-12-01",
    status: "active",
  },
  {
    id: "5",
    username: "defi_degen",
    avatar: null,
    tier: "premium",
    subscribedSince: "2026-01-28",
    status: "active",
  },
  {
    id: "6",
    username: "whale_watcher",
    avatar: null,
    tier: "vip",
    subscribedSince: "2025-11-10",
    status: "active",
  },
  {
    id: "7",
    username: "moon_hodler",
    avatar: null,
    tier: "basic",
    subscribedSince: "2026-03-01",
    status: "active",
  },
  {
    id: "8",
    username: "token_trader",
    avatar: null,
    tier: "premium",
    subscribedSince: "2025-10-22",
    status: "cancelled",
  },
  {
    id: "9",
    username: "chain_explorer",
    avatar: null,
    tier: "basic",
    subscribedSince: "2026-01-05",
    status: "expired",
  },
  {
    id: "10",
    username: "block_builder",
    avatar: null,
    tier: "vip",
    subscribedSince: "2025-09-15",
    status: "active",
  },
] as const;

// -- Helpers --

type TierFilter = "all" | Tier;

const TIER_FILTERS: readonly { readonly value: TierFilter; readonly label: string }[] = [
  { value: "all", label: "All Tiers" },
  { value: "basic", label: "Basic" },
  { value: "premium", label: "Premium" },
  { value: "vip", label: "VIP" },
] as const;

const TIER_BADGE_STYLES: Record<Tier, string> = {
  basic: "bg-blue-500/15 text-blue-400",
  premium: "bg-[#00AFF0]/15 text-[#00AFF0]",
  vip: "bg-amber-500/15 text-amber-400",
};

const STATUS_STYLES: Record<Subscriber["status"], string> = {
  active: "text-emerald-400",
  expired: "text-amber-400",
  cancelled: "text-red-400",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(username: string): string {
  return username.charAt(0).toUpperCase();
}

export default function SubscribersPage() {
  const [filter, setFilter] = useState<TierFilter>("all");
  const [search, setSearch] = useState("");

  const filteredSubscribers = useMemo(() => {
    return MOCK_SUBSCRIBERS.filter((sub) => {
      const matchesTier = filter === "all" || sub.tier === filter;
      const matchesSearch =
        search === "" ||
        sub.username.toLowerCase().includes(search.toLowerCase());
      return matchesTier && matchesSearch;
    });
  }, [filter, search]);

  const tierCounts = useMemo(() => {
    const counts: Record<string, number> = { all: MOCK_SUBSCRIBERS.length };
    for (const sub of MOCK_SUBSCRIBERS) {
      counts[sub.tier] = (counts[sub.tier] ?? 0) + 1;
    }
    return counts;
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Subscribers
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View and manage your subscriber base.
        </p>
      </div>

      {/* Tier summary cards */}
      <div className="grid gap-3 sm:grid-cols-4">
        {TIER_FILTERS.map((tier) => (
          <button
            key={tier.value}
            type="button"
            onClick={() => setFilter(tier.value)}
            className={cn(
              "rounded-lg border p-4 text-left transition-all",
              filter === tier.value
                ? "border-[#00AFF0]/50 bg-[#00AFF0]/10"
                : "border-white/[0.06] bg-[#111111] hover:border-white/[0.12]"
            )}
            aria-pressed={filter === tier.value}
          >
            <p className="text-xs font-medium text-muted-foreground">
              {tier.label}
            </p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {tierCounts[tier.value] ?? 0}
            </p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search subscribers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-white/[0.08] bg-white/[0.03] pl-9 text-foreground placeholder:text-muted-foreground focus-visible:ring-[#00AFF0]/50"
          aria-label="Search subscribers"
        />
      </div>

      {/* Subscriber table */}
      <Card className="border-white/[0.06] bg-[#111111]">
        <CardHeader className="border-b border-white/[0.06] pb-3">
          <CardTitle className="text-base font-semibold">
            {filter === "all" ? "All Subscribers" : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Subscribers`}{" "}
            ({filteredSubscribers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Table header */}
          <div className="hidden border-b border-white/[0.06] px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground md:grid md:grid-cols-12 md:gap-4">
            <div className="col-span-4">Subscriber</div>
            <div className="col-span-2">Tier</div>
            <div className="col-span-3">Subscribed Since</div>
            <div className="col-span-3 text-right">Status</div>
          </div>

          {/* Table rows */}
          {filteredSubscribers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Users className="mb-3 h-10 w-10 opacity-40" />
              <p className="text-sm">No subscribers found.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {filteredSubscribers.map((sub) => (
                <div
                  key={sub.id}
                  className="flex flex-col gap-2 px-6 py-4 transition-colors hover:bg-white/[0.02] md:grid md:grid-cols-12 md:items-center md:gap-4"
                >
                  {/* Subscriber info */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#00AFF0]/20 text-sm font-bold text-[#00AFF0]">
                      {getInitials(sub.username)}
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      @{sub.username}
                    </span>
                  </div>

                  {/* Tier */}
                  <div className="col-span-2">
                    <Badge
                      className={cn(
                        "border-0 text-[10px] font-semibold uppercase",
                        TIER_BADGE_STYLES[sub.tier]
                      )}
                    >
                      {sub.tier}
                    </Badge>
                  </div>

                  {/* Subscribed since */}
                  <div className="col-span-3 text-sm text-muted-foreground">
                    {formatDate(sub.subscribedSince)}
                  </div>

                  {/* Status */}
                  <div className="col-span-3 flex items-center justify-end gap-1.5">
                    <div
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        sub.status === "active"
                          ? "bg-emerald-400"
                          : sub.status === "expired"
                            ? "bg-amber-400"
                            : "bg-red-400"
                      )}
                    />
                    <span
                      className={cn(
                        "text-xs font-medium capitalize",
                        STATUS_STYLES[sub.status]
                      )}
                    >
                      {sub.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
