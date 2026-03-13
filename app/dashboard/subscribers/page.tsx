"use client";

import { useState, useMemo, useEffect } from "react";
import { Users, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// -- Types --

type Tier = "basic" | "premium" | "vip";

interface Subscriber {
  readonly id: number;
  readonly subscriber_id: string;
  readonly username: string;
  readonly display_name: string;
  readonly avatar_url: string | null;
  readonly tier: Tier;
  readonly status: "active" | "expired" | "cancelled";
  readonly started_at: string;
}

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

const STATUS_STYLES: Record<string, string> = {
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

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#00AFF0]" />
    </div>
  );
}

export default function SubscribersPage() {
  const [filter, setFilter] = useState<TierFilter>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/subscribers")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((json) => {
        if (json.data) {
          setSubscribers(json.data);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load subscribers. Please try again.");
        setLoading(false);
      });
  }, []);

  const filteredSubscribers = useMemo(() => {
    return subscribers.filter((sub) => {
      const matchesTier = filter === "all" || sub.tier === filter;
      const matchesSearch =
        search === "" ||
        sub.username.toLowerCase().includes(search.toLowerCase()) ||
        sub.display_name.toLowerCase().includes(search.toLowerCase());
      return matchesTier && matchesSearch;
    });
  }, [filter, search, subscribers]);

  const tierCounts = useMemo(() => {
    const counts: Record<string, number> = { all: subscribers.length };
    for (const sub of subscribers) {
      counts[sub.tier] = (counts[sub.tier] ?? 0) + 1;
    }
    return counts;
  }, [subscribers]);

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Subscribers</h1>
          <p className="mt-1 text-sm text-red-400">{error}</p>
        </div>
      </div>
    );
  }

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
                : "border-gray-200 bg-white hover:border-gray-300"
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
          className="border-gray-200 bg-gray-50 pl-9 text-foreground placeholder:text-muted-foreground focus-visible:ring-[#00AFF0]/50"
          aria-label="Search subscribers"
        />
      </div>

      {/* Subscriber table */}
      <Card className="border-gray-200 bg-white">
        <CardHeader className="border-b border-gray-200 pb-3">
          <CardTitle className="text-base font-semibold">
            {filter === "all" ? "All Subscribers" : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Subscribers`}{" "}
            ({filteredSubscribers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Table header */}
          <div className="hidden border-b border-gray-200 px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground md:grid md:grid-cols-12 md:gap-4">
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
            <div className="divide-y divide-gray-200">
              {filteredSubscribers.map((sub) => (
                <div
                  key={sub.id}
                  className="flex flex-col gap-2 px-6 py-4 transition-colors hover:bg-gray-50 md:grid md:grid-cols-12 md:items-center md:gap-4"
                >
                  {/* Subscriber info */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#00AFF0]/20 text-sm font-bold text-[#00AFF0]">
                      {getInitials(sub.display_name || sub.username)}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-foreground">
                        @{sub.username}
                      </span>
                      {sub.display_name && (
                        <p className="text-xs text-muted-foreground">{sub.display_name}</p>
                      )}
                    </div>
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
                    {formatDate(sub.started_at)}
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
                        STATUS_STYLES[sub.status] ?? "text-gray-400"
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
