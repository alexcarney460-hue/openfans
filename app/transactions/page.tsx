"use client";

import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Badge } from "@/components/ui/badge";

type TransactionType = "subscription" | "tip" | "purchase";
type FilterTab = "all" | "subscription" | "tip";

const MOCK_TRANSACTIONS = [
  { id: "1", date: "Mar 12, 2026", type: "subscription" as TransactionType, creator: "AlphaTrader", amount: "$49.99", status: "Completed" },
  { id: "2", date: "Mar 11, 2026", type: "tip" as TransactionType, creator: "CryptoArtist", amount: "$10.00", status: "Completed" },
  { id: "3", date: "Mar 10, 2026", type: "subscription" as TransactionType, creator: "DeFi_Guru", amount: "$9.99", status: "Completed" },
  { id: "4", date: "Mar 9, 2026", type: "tip" as TransactionType, creator: "NFT_Whale", amount: "$25.00", status: "Completed" },
  { id: "5", date: "Mar 8, 2026", type: "purchase" as TransactionType, creator: "AlphaTrader", amount: "$5.00", status: "Completed" },
  { id: "6", date: "Mar 5, 2026", type: "subscription" as TransactionType, creator: "CryptoArtist", amount: "$19.99", status: "Completed" },
  { id: "7", date: "Mar 3, 2026", type: "tip" as TransactionType, creator: "DeFi_Guru", amount: "$15.00", status: "Pending" },
  { id: "8", date: "Mar 1, 2026", type: "subscription" as TransactionType, creator: "NFT_Whale", amount: "$19.99", status: "Failed" },
  { id: "9", date: "Feb 28, 2026", type: "tip" as TransactionType, creator: "AlphaTrader", amount: "$50.00", status: "Completed" },
  { id: "10", date: "Feb 25, 2026", type: "purchase" as TransactionType, creator: "CryptoArtist", amount: "$3.00", status: "Completed" },
] as const;

const FILTER_TABS: { label: string; value: FilterTab }[] = [
  { label: "All", value: "all" },
  { label: "Subscriptions", value: "subscription" },
  { label: "Tips", value: "tip" },
];

function typeBadgeClass(type: TransactionType) {
  switch (type) {
    case "subscription":
      return "bg-[#00AFF0]/15 text-[#00AFF0] border-0";
    case "tip":
      return "bg-amber-500/15 text-amber-400 border-0";
    case "purchase":
      return "bg-emerald-500/15 text-emerald-400 border-0";
  }
}

function statusClass(status: string) {
  switch (status) {
    case "Completed":
      return "text-emerald-500";
    case "Pending":
      return "text-amber-500";
    case "Failed":
      return "text-red-500";
    default:
      return "text-gray-500";
  }
}

export default function TransactionsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  const filtered = activeFilter === "all"
    ? MOCK_TRANSACTIONS
    : MOCK_TRANSACTIONS.filter((t) => t.type === activeFilter);

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
          <div className="mb-6 flex gap-2">
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

          {/* Table */}
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
                    Creator
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
                      {tx.date}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <Badge className={`text-[10px] ${typeBadgeClass(tx.type)}`}>
                        {tx.type}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-gray-900">
                      {tx.creator}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold text-gray-900">
                      {tx.amount}
                    </td>
                    <td className={`whitespace-nowrap px-5 py-4 text-right text-sm font-medium ${statusClass(tx.status)}`}>
                      {tx.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
