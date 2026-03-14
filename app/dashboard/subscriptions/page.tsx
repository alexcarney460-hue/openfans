"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Subscription {
  id: string;
  creator_username: string;
  creator_display_name: string;
  creator_avatar_url: string | null;
  price_usdc: number;
  status: string;
  started_at: string;
  expires_at: string | null;
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/subscriptions")
      .then((r) => r.json())
      .then((data) => {
        setSubscriptions(data.subscriptions ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">My Subscriptions</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 bg-gray-100 rounded-xl animate-pulse"
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
          {subscriptions.map((sub) => (
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
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    ${sub.price_usdc.toFixed(2)} USDC/mo
                  </span>
                  <Link
                    href={`/${sub.creator_username}`}
                    className="text-[#00AFF0] hover:underline inline-flex items-center gap-1"
                  >
                    View <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
