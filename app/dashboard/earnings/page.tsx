"use client";

import { useState } from "react";
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

interface Transaction {
  readonly id: string;
  readonly date: string;
  readonly type: "subscription" | "tip" | "payout";
  readonly description: string;
  readonly amount: string;
  readonly status: "completed" | "pending" | "failed";
}

// -- Mock data --

const MOCK_WALLET_DISPLAY = "7xKXt...4Fv9n" as const;
const MOCK_WALLET_FULL = "7xKXtRbFz3dVkP9mQh2NwYsJ6cLuA8gEo1fXp4Fv9n" as const;
const MOCK_BALANCE = "14,630.00" as const;

const MOCK_TRANSACTIONS: readonly Transaction[] = [
  {
    id: "tx-1",
    date: "2026-03-12",
    type: "subscription",
    description: "Premium subscription - alex_web3",
    amount: "+$19.99",
    status: "completed",
  },
  {
    id: "tx-2",
    date: "2026-03-12",
    type: "tip",
    description: "Tip from crypto_fan",
    amount: "+$5.00",
    status: "completed",
  },
  {
    id: "tx-3",
    date: "2026-03-11",
    type: "payout",
    description: "Withdrawal to Solana wallet",
    amount: "-$2,500.00",
    status: "completed",
  },
  {
    id: "tx-4",
    date: "2026-03-11",
    type: "subscription",
    description: "Basic subscription - sol_holder",
    amount: "+$9.99",
    status: "completed",
  },
  {
    id: "tx-5",
    date: "2026-03-10",
    type: "tip",
    description: "Tip from defi_degen",
    amount: "+$25.00",
    status: "completed",
  },
  {
    id: "tx-6",
    date: "2026-03-10",
    type: "subscription",
    description: "VIP subscription - whale_watcher",
    amount: "+$49.99",
    status: "completed",
  },
  {
    id: "tx-7",
    date: "2026-03-09",
    type: "payout",
    description: "Withdrawal to Solana wallet",
    amount: "-$1,000.00",
    status: "pending",
  },
  {
    id: "tx-8",
    date: "2026-03-08",
    type: "subscription",
    description: "Premium subscription - nft_collector",
    amount: "+$19.99",
    status: "failed",
  },
] as const;

// -- Helpers --

const TYPE_STYLES: Record<Transaction["type"], { bg: string; icon: typeof ArrowUpRight }> = {
  subscription: { bg: "bg-[#00AFF0]/15 text-[#00AFF0]", icon: ArrowDownLeft },
  tip: { bg: "bg-emerald-500/15 text-emerald-400", icon: ArrowDownLeft },
  payout: { bg: "bg-amber-500/15 text-amber-400", icon: ArrowUpRight },
};

const STATUS_CONFIG: Record<Transaction["status"], { icon: typeof CheckCircle2; color: string; label: string }> = {
  completed: { icon: CheckCircle2, color: "text-emerald-400", label: "Completed" },
  pending: { icon: Clock, color: "text-amber-400", label: "Pending" },
  failed: { icon: XCircle, color: "text-red-400", label: "Failed" },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function EarningsPage() {
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(MOCK_WALLET_FULL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = MOCK_WALLET_FULL;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleViewOnExplorer = () => {
    window.open(
      `https://explorer.solana.com/address/${MOCK_WALLET_FULL}`,
      "_blank"
    );
  };

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
        <Card className="border-white/[0.06] bg-[#111111]">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground">
              Available Balance
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-[#00AFF0] text-4xl font-bold tracking-tight">
                ${MOCK_BALANCE}
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                USDC
              </span>
            </div>
            <Button className="mt-4 w-full bg-[#00AFF0] hover:bg-[#009dd8]">
              <Wallet className="mr-2 h-4 w-4" />
              Withdraw to Wallet
            </Button>
          </CardContent>
        </Card>

        {/* Connected wallet */}
        <Card className="border-white/[0.06] bg-[#111111]">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground">
              Connected Wallet
            </p>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00AFF0]/20">
                <Wallet className="h-4 w-4 text-[#00AFF0]" />
              </div>
              <span className="font-mono text-lg font-semibold text-foreground">
                {MOCK_WALLET_DISPLAY}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Solana Network</p>
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-white/[0.08] text-xs"
                onClick={handleCopyAddress}
              >
                {copied ? (
                  <>
                    <Check className="mr-1.5 h-3 w-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="mr-1.5 h-3 w-3" />
                    Copy Address
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-white/[0.08] text-xs"
                onClick={handleViewOnExplorer}
              >
                <ExternalLink className="mr-1.5 h-3 w-3" />
                View on Explorer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction history */}
      <Card className="border-white/[0.06] bg-[#111111]">
        <CardHeader className="border-b border-white/[0.06] pb-3">
          <CardTitle className="text-base font-semibold">
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Table header */}
          <div className="hidden border-b border-white/[0.06] px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground md:grid md:grid-cols-12 md:gap-4">
            <div className="col-span-2">Date</div>
            <div className="col-span-1">Type</div>
            <div className="col-span-5">Description</div>
            <div className="col-span-2 text-right">Amount</div>
            <div className="col-span-2 text-right">Status</div>
          </div>

          {/* Table rows */}
          <div className="divide-y divide-white/[0.04]">
            {MOCK_TRANSACTIONS.map((tx) => {
              const typeConfig = TYPE_STYLES[tx.type];
              const statusConfig = STATUS_CONFIG[tx.status];
              const StatusIcon = statusConfig.icon;
              const TypeIcon = typeConfig.icon;
              const isIncoming = tx.type !== "payout";

              return (
                <div
                  key={tx.id}
                  className="flex flex-col gap-2 px-6 py-4 transition-colors hover:bg-white/[0.02] md:grid md:grid-cols-12 md:items-center md:gap-4"
                >
                  {/* Date */}
                  <div className="col-span-2 text-sm text-muted-foreground">
                    {formatDate(tx.date)}
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
                    <p className="text-sm text-foreground">{tx.description}</p>
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
                      {tx.amount}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="col-span-2 flex items-center justify-end gap-1.5">
                    <StatusIcon className={cn("h-3.5 w-3.5", statusConfig.color)} />
                    <span className={cn("text-xs font-medium", statusConfig.color)}>
                      {statusConfig.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
