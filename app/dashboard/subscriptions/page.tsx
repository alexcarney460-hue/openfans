"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Heart, ExternalLink, RefreshCw, CalendarOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Subscription {
  id: number;
  creator_username: string;
  creator_display_name: string;
  creator_avatar_url: string | null;
  price_usdc: number;
  status: string;
  auto_renew: boolean;
  started_at: string;
  expires_at: string | null;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch("/api/subscriptions")
      .then((r) => r.json())
      .then((data) => {
        setSubscriptions(data.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleAutoRenew = useCallback(async (subId: number, currentValue: boolean) => {
    setTogglingIds((prev) => {
      const next = new Set(prev);
      next.add(subId);
      return next;
    });

    try {
      const res = await fetch(`/api/subscriptions/${subId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auto_renew: !currentValue }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        console.error("Failed to toggle auto-renew:", errorData);
        return;
      }

      const { data } = await res.json();

      // Update local state immutably
      setSubscriptions((prev) =>
        prev.map((s) =>
          s.id === subId ? { ...s, auto_renew: data.auto_renew } : s,
        ),
      );
    } catch (error) {
      console.error("Failed to toggle auto-renew:", error);
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(subId);
        return next;
      });
    }
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">My Subscriptions</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 bg-gray-100 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Subscriptions</h1>
        <Link
          href="/explore"
          className="text-sm text-[#00AFF0] hover:underline font-medium"
        >
          Discover creators
        </Link>
      </div>

      {subscriptions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Heart className="w-12 h-12 text-gray-300 mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              No subscriptions yet
            </h2>
            <p className="text-gray-500 mb-6 max-w-sm">
              Explore creators and subscribe to access their exclusive content.
            </p>
            <Link
              href="/explore"
              className="bg-[#00AFF0] text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-[#0095cc] transition-colors"
            >
              Explore Creators
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {subscriptions.map((sub) => {
            const isToggling = togglingIds.has(sub.id);

            return (
              <Card key={sub.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00AFF0] to-[#0A1628] flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                      {sub.creator_avatar_url ? (
                        <img
                          src={sub.creator_avatar_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        sub.creator_display_name?.charAt(0)?.toUpperCase() ?? "?"
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-semibold truncate">
                        {sub.creator_display_name}
                      </CardTitle>
                      <p className="text-xs text-gray-500 truncate">
                        @{sub.creator_username}
                      </p>
                    </div>
                    <Badge
                      variant={
                        sub.status === "active" ? "default" : "secondary"
                      }
                      className={
                        sub.status === "active"
                          ? "bg-green-100 text-green-700"
                          : ""
                      }
                    >
                      {sub.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      ${(sub.price_usdc / 100).toFixed(2)} USDC/mo
                    </span>
                    <Link
                      href={`/${sub.creator_username}`}
                      className="text-[#00AFF0] hover:underline inline-flex items-center gap-1"
                    >
                      View <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>

                  {/* Renewal / Expiry date */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    {sub.auto_renew ? (
                      <>
                        <RefreshCw className="w-3 h-3 text-green-500" />
                        <span>Renews on {formatDate(sub.expires_at)}</span>
                      </>
                    ) : (
                      <>
                        <CalendarOff className="w-3 h-3 text-amber-500" />
                        <span>Expires on {formatDate(sub.expires_at)}</span>
                      </>
                    )}
                  </div>

                  {/* Auto-renewal toggle */}
                  {sub.status === "active" && (
                    <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                      <span className="text-xs text-gray-600">Auto-renew</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={sub.auto_renew}
                        disabled={isToggling}
                        onClick={() => toggleAutoRenew(sub.id, sub.auto_renew)}
                        className={`
                          relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full
                          border-2 border-transparent transition-colors duration-200 ease-in-out
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00AFF0] focus-visible:ring-offset-2
                          disabled:cursor-not-allowed disabled:opacity-50
                          ${sub.auto_renew ? "bg-[#00AFF0]" : "bg-gray-200"}
                        `}
                      >
                        <span
                          className={`
                            pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg
                            ring-0 transition-transform duration-200 ease-in-out
                            ${sub.auto_renew ? "translate-x-4" : "translate-x-0"}
                          `}
                        />
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
