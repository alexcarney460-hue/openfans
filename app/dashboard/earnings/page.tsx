"use client";

import { useState, useEffect } from "react";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// -- Types --

interface EarningsSummary {
  total_earnings_usdc: number;
  this_month_earnings_usdc: number;
  pending_payout_usdc: number;
  total_paid_out_usdc: number;
}

interface Transaction {
  readonly id: string | number;
  readonly created_at: string;
  readonly type: "subscription" | "tip" | "payout";
  readonly from_username: string | null;
  readonly amount_usdc: number;
  readonly tier: string | null;
  readonly payment_tx: string | null;
}

// -- Helpers --

const TYPE_STYLES: Record<Transaction["type"], { bg: string; icon: typeof ArrowUpRight }> = {
  subscription: { bg: "bg-[#00AFF0]/15 text-[#00AFF0]", icon: ArrowDownLeft },
  tip: { bg: "bg-emerald-500/15 text-emerald-400", icon: ArrowDownLeft },
  payout: { bg: "bg-amber-500/15 text-amber-400", icon: ArrowUpRight },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatUsdc(cents: number): string {
  return `$${(Math.abs(cents) / 100).toFixed(2)}`;
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#00AFF0]" />
    </div>
  );
}

export default function EarningsPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/earnings")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((json) => {
        if (json.data) {
          setSummary(json.data);
        }
        if (json.transactions) {
          setTransactions(json.transactions);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load earnings data. Please try again.");
        setLoading(false);
      });
  }, []);

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Earnings</h1>
          <p className="mt-1 text-sm text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  const totalEarnings = summary?.total_earnings_usdc ?? 0;
  const pendingPayout = summary?.pending_payout_usdc ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Earnings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track your income and manage withdrawals.
        </p>
      </div>

      {/* Balance and wallet cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Total balance */}
        <Card className="border-gray-200 bg-white">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground">
              Total Earnings
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-[#00AFF0] text-4xl font-bold tracking-tight">
                {formatUsdc(totalEarnings)}
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                USDC
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              This month: {formatUsdc(summary?.this_month_earnings_usdc ?? 0)}
            </p>
            <Button className="mt-4 w-full bg-[#00AFF0] hover:bg-[#009dd8]">
              <Wallet className="mr-2 h-4 w-4" />
              Withdraw to Wallet
            </Button>
          </CardContent>
        </Card>

        {/* Pending payout */}
        <Card className="border-gray-200 bg-white">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground">
              Available for Payout
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-emerald-400 text-4xl font-bold tracking-tight">
                {formatUsdc(pendingPayout)}
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                USDC
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Total paid out: {formatUsdc(summary?.total_paid_out_usdc ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction history */}
      <Card className="border-gray-200 bg-white">
        <CardHeader className="border-b border-gray-200 pb-3">
          <CardTitle className="text-base font-semibold">
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Table header */}
          <div className="hidden border-b border-gray-200 px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground md:grid md:grid-cols-12 md:gap-4">
            <div className="col-span-2">Date</div>
            <div className="col-span-1">Type</div>
            <div className="col-span-5">Description</div>
            <div className="col-span-2 text-right">Amount</div>
            <div className="col-span-2 text-right">Tx</div>
          </div>

          {/* Table rows */}
          <div className="divide-y divide-gray-200">
            {transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Wallet className="mb-3 h-10 w-10 opacity-40" />
                <p className="text-sm">No transactions yet.</p>
              </div>
            ) : (
              transactions.map((tx) => {
                const typeConfig = TYPE_STYLES[tx.type] ?? TYPE_STYLES.subscription;
                const TypeIcon = typeConfig.icon;
                const isIncoming = tx.type !== "payout";

                const description =
                  tx.type === "payout"
                    ? "Withdrawal to Solana wallet"
                    : tx.type === "tip"
                      ? `Tip from ${tx.from_username ?? "unknown"}`
                      : `${tx.tier ? tx.tier.charAt(0).toUpperCase() + tx.tier.slice(1) + " subscription" : "Subscription"} - ${tx.from_username ?? "unknown"}`;

                return (
                  <div
                    key={`${tx.type}-${tx.id}`}
                    className="flex flex-col gap-2 px-6 py-4 transition-colors hover:bg-gray-50 md:grid md:grid-cols-12 md:items-center md:gap-4"
                  >
                    {/* Date */}
                    <div className="col-span-2 text-sm text-muted-foreground">
                      {formatDate(tx.created_at)}
                    </div>

                    {/* Type */}
                    <div className="col-span-1">
                      <div
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-full",
                          typeConfig.bg
                        )}
                      >
                        <TypeIcon className="h-3.5 w-3.5" />
                      </div>
                    </div>

                    {/* Description */}
                    <div className="col-span-5">
                      <p className="text-sm text-foreground">{description}</p>
                      <Badge
                        variant="secondary"
                        className="mt-1 border-0 text-[10px] font-medium capitalize md:hidden"
                      >
                        {tx.type}
                      </Badge>
                    </div>

                    {/* Amount */}
                    <div className="col-span-2 text-right">
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          isIncoming ? "text-emerald-400" : "text-foreground"
                        )}
                      >
                        {isIncoming ? "+" : "-"}{formatUsdc(tx.amount_usdc)}
                      </span>
                    </div>

                    {/* Tx link */}
                    <div className="col-span-2 text-right">
                      {tx.payment_tx ? (
                        <a
                          href={`https://explorer.solana.com/tx/${tx.payment_tx}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#00AFF0] hover:underline"
                        >
                          {tx.payment_tx.slice(0, 4)}...{tx.payment_tx.slice(-4)}
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">--</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
