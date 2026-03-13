"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

type FilterTab = "all" | "deposit" | "withdrawal" | "subscription_charge" | "tip_sent";

interface WalletTransaction {
  readonly id: number;
  readonly type: string;
  readonly amount_usdc: number;
  readonly balance_after: number;
  readonly description: string | null;
  readonly status: string;
  readonly created_at: string;
}

const FILTER_TABS: { label: string; value: FilterTab }[] = [
  { label: "All", value: "all" },
  { label: "Deposits", value: "deposit" },
  { label: "Withdrawals", value: "withdrawal" },
  { label: "Subscriptions", value: "subscription_charge" },
  { label: "Tips", value: "tip_sent" },
];

function typeBadgeClass(type: string) {
  switch (type) {
    case "deposit":
      return "bg-emerald-500/15 text-emerald-400 border-0";
    case "withdrawal":
      return "bg-red-500/15 text-red-400 border-0";
    case "subscription_charge":
    case "subscription_received":
      return "bg-[#00AFF0]/15 text-[#00AFF0] border-0";
    case "tip_sent":
    case "tip_received":
      return "bg-amber-500/15 text-amber-400 border-0";
    default:
      return "bg-gray-500/15 text-gray-400 border-0";
  }
}

function statusClass(status: string) {
  switch (status) {
    case "completed":
      return "text-emerald-500";
    case "pending":
      return "text-amber-500";
    case "failed":
      return "text-red-500";
    default:
      return "text-gray-500";
  }
}

function formatAmount(amountCents: number): string {
  const dollars = Math.abs(amountCents) / 100;
  const prefix = amountCents < 0 ? "-" : "+";
  return `${prefix}$${dollars.toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function TransactionsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [notLoggedIn, setNotLoggedIn] = useState(false);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const res = await fetch("/api/wallet?limit=50");
        if (res.status === 401) {
          setNotLoggedIn(true);
          return;
        }
        if (!res.ok) return;
        const json = await res.json();
        setTransactions(json.data?.transactions ?? []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchTransactions();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <SiteHeader />
        <main className="flex-1 pt-14">
          <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
            <p className="text-gray-400">Loading transactions...</p>
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
                Log in to view your transactions
              </p>
              <p className="mt-1 text-sm text-gray-400">
                You need to be signed in to view transaction history.
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

  const filtered = activeFilter === "all"
    ? transactions
    : transactions.filter((t) => t.type === activeFilter);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <SiteHeader />

      <main className="flex-1 pt-14">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Transaction History
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              View all your past payments and transactions.
            </p>
          </div>

          {/* Filter tabs */}
          <div className="mb-6 flex gap-2 flex-wrap">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveFilter(tab.value)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeFilter === tab.value
                    ? "bg-[#00AFF0]/15 text-[#00AFF0]"
                    : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center">
              <p className="text-sm text-gray-400">No transactions found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <table className="w-full" role="table">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                      Date
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                      Type
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                      Description
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">
                      Amount (USDC)
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((tx) => (
                    <tr
                      key={tx.id}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                        {formatDate(tx.created_at)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <Badge className={`text-[10px] ${typeBadgeClass(tx.type)}`}>
                          {tx.type.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-900">
                        {tx.description ?? "-"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold text-gray-900">
                        {formatAmount(tx.amount_usdc)}
                      </td>
                      <td className={`whitespace-nowrap px-5 py-4 text-right text-sm font-medium ${statusClass(tx.status)}`}>
                        {tx.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
