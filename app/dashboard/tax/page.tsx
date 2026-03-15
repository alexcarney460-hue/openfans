"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DollarSign,
  Download,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  MinusCircle,
  Settings,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// -- Types --

interface MonthlyBreakdown {
  readonly month: string;
  readonly month_number: number;
  readonly subscriptions: number;
  readonly tips: number;
  readonly ppv: number;
  readonly total: number;
  readonly net: number;
}

interface QuarterlySummary {
  readonly quarter: string;
  readonly subscriptions: number;
  readonly tips: number;
  readonly ppv: number;
  readonly total: number;
  readonly net: number;
}

interface TaxSummary {
  readonly year: number;
  readonly annual: {
    readonly gross_earnings: number;
    readonly net_earnings: number;
    readonly platform_fees: number;
    readonly total_payouts: number;
  };
  readonly monthly: readonly MonthlyBreakdown[];
  readonly quarterly: readonly QuarterlySummary[];
  readonly is_above_threshold: boolean;
  readonly has_tax_info: boolean;
}

// -- Helpers --

function formatUsdc(cents: number): string {
  const dollars = Math.abs(cents) / 100;
  return `$${dollars.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#00AFF0]" />
    </div>
  );
}

function generateCsv(data: TaxSummary): string {
  const header = "Month,Subscriptions,Tips,PPV,Gross Total,Net Earnings (95%)";
  const monthRows = data.monthly.map((m) =>
    [
      m.month,
      (m.subscriptions / 100).toFixed(2),
      (m.tips / 100).toFixed(2),
      (m.ppv / 100).toFixed(2),
      (m.total / 100).toFixed(2),
      (m.net / 100).toFixed(2),
    ].join(","),
  );

  // Insert quarterly summary rows
  const rows: string[] = [];
  for (let i = 0; i < monthRows.length; i++) {
    rows.push(monthRows[i]);
    if ((i + 1) % 3 === 0) {
      const q = data.quarterly[Math.floor(i / 3)];
      rows.push(
        [
          `${q.quarter} Total`,
          (q.subscriptions / 100).toFixed(2),
          (q.tips / 100).toFixed(2),
          (q.ppv / 100).toFixed(2),
          (q.total / 100).toFixed(2),
          (q.net / 100).toFixed(2),
        ].join(","),
      );
    }
  }

  // Annual total row
  rows.push(
    [
      "Annual Total",
      (data.monthly.reduce((s, m) => s + m.subscriptions, 0) / 100).toFixed(2),
      (data.monthly.reduce((s, m) => s + m.tips, 0) / 100).toFixed(2),
      (data.monthly.reduce((s, m) => s + m.ppv, 0) / 100).toFixed(2),
      (data.annual.gross_earnings / 100).toFixed(2),
      (data.annual.net_earnings / 100).toFixed(2),
    ].join(","),
  );

  return [header, ...rows].join("\n");
}

function downloadCsv(data: TaxSummary): void {
  const csv = generateCsv(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `tax-summary-${data.year}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// -- 1099 Status Component --

function TaxStatusBadge({
  isAboveThreshold,
  hasTaxInfo,
}: {
  readonly isAboveThreshold: boolean;
  readonly hasTaxInfo: boolean;
}) {
  if (hasTaxInfo) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
        <CheckCircle2 className="h-4 w-4" />
        Tax info complete
      </div>
    );
  }

  if (isAboveThreshold) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
        <AlertCircle className="h-4 w-4" />
        <span>
          Action needed &mdash;{" "}
          <a
            href="/dashboard/settings"
            className="underline hover:text-amber-900"
          >
            submit tax info
          </a>
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm font-medium text-gray-500">
      <MinusCircle className="h-4 w-4" />
      Below $600 threshold &mdash; no 1099 required
    </div>
  );
}

// -- Main Page --

export default function TaxSummaryPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TaxSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (year: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tax/my-summary?year=${year}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load tax summary");
      }
      const json = await res.json();
      setData(json.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load tax summary. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(selectedYear);
  }, [selectedYear, fetchData]);

  // Year options: current year back to 2024
  const yearOptions: number[] = [];
  for (let y = currentYear; y >= 2024; y--) {
    yearOptions.push(y);
  }

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Tax Summary
          </h1>
          <p className="mt-1 text-sm text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Tax Summary
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View your annual earnings breakdown and download tax documents.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Year Selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-foreground shadow-sm focus:border-[#00AFF0] focus:outline-none focus:ring-1 focus:ring-[#00AFF0]"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* Download CSV */}
          <Button
            variant="outline"
            className="border-gray-200"
            onClick={() => downloadCsv(data)}
          >
            <Download className="mr-2 h-4 w-4" />
            Download CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Annual Net Earnings */}
        <Card className="border-gray-200 bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                Annual Net Earnings
              </p>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00AFF0]/10">
                <TrendingUp className="h-4 w-4 text-[#00AFF0]" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
              {formatUsdc(data.annual.net_earnings)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Gross: {formatUsdc(data.annual.gross_earnings)}
            </p>
          </CardContent>
        </Card>

        {/* Platform Fees Paid */}
        <Card className="border-gray-200 bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                Platform Fees Paid
              </p>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10">
                <DollarSign className="h-4 w-4 text-amber-500" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
              {formatUsdc(data.annual.platform_fees)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">5% platform fee</p>
          </CardContent>
        </Card>

        {/* Total Payouts */}
        <Card className="border-gray-200 bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                Total Payouts
              </p>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10">
                <DollarSign className="h-4 w-4 text-emerald-500" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
              {formatUsdc(data.annual.total_payouts)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Withdrawn to wallet
            </p>
          </CardContent>
        </Card>

        {/* 1099 Status */}
        <Card className="border-gray-200 bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                1099 Status
              </p>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                <FileText className="h-4 w-4 text-gray-500" />
              </div>
            </div>
            <div className="mt-3">
              <TaxStatusBadge
                isAboveThreshold={data.is_above_threshold}
                hasTaxInfo={data.has_tax_info}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Earnings Table */}
      <Card className="border-gray-200 bg-white">
        <CardHeader className="border-b border-gray-200 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              {selectedYear} Monthly Breakdown
            </CardTitle>
            <a
              href="/dashboard/settings"
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Settings className="h-3.5 w-3.5" />
              Update Tax Info
            </a>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Table header */}
          <div className="hidden border-b border-gray-200 px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground md:grid md:grid-cols-12 md:gap-4">
            <div className="col-span-2">Month</div>
            <div className="col-span-2 text-right">Subscriptions</div>
            <div className="col-span-2 text-right">Tips</div>
            <div className="col-span-2 text-right">PPV</div>
            <div className="col-span-2 text-right">Total</div>
            <div className="col-span-2 text-right">Net (95%)</div>
          </div>

          <div className="divide-y divide-gray-200">
            {data.monthly.map((m, idx) => {
              const isQuarterEnd = (idx + 1) % 3 === 0;
              const quarterIdx = Math.floor(idx / 3);
              const q = data.quarterly[quarterIdx];

              return (
                <div key={m.month_number}>
                  {/* Monthly row */}
                  <div className="flex flex-col gap-1 px-6 py-3 transition-colors hover:bg-gray-50 md:grid md:grid-cols-12 md:items-center md:gap-4">
                    <div className="col-span-2 text-sm font-medium text-foreground">
                      {m.month}
                    </div>
                    <div className="col-span-2 text-right text-sm text-muted-foreground">
                      <span className="mr-2 text-xs text-gray-400 md:hidden">
                        Subs:
                      </span>
                      {formatUsdc(m.subscriptions)}
                    </div>
                    <div className="col-span-2 text-right text-sm text-muted-foreground">
                      <span className="mr-2 text-xs text-gray-400 md:hidden">
                        Tips:
                      </span>
                      {formatUsdc(m.tips)}
                    </div>
                    <div className="col-span-2 text-right text-sm text-muted-foreground">
                      <span className="mr-2 text-xs text-gray-400 md:hidden">
                        PPV:
                      </span>
                      {formatUsdc(m.ppv)}
                    </div>
                    <div className="col-span-2 text-right text-sm font-medium text-foreground">
                      <span className="mr-2 text-xs text-gray-400 md:hidden">
                        Total:
                      </span>
                      {formatUsdc(m.total)}
                    </div>
                    <div className="col-span-2 text-right text-sm font-semibold text-emerald-600">
                      <span className="mr-2 text-xs text-gray-400 md:hidden">
                        Net:
                      </span>
                      {formatUsdc(m.net)}
                    </div>
                  </div>

                  {/* Quarterly summary row */}
                  {isQuarterEnd && (
                    <div className="flex flex-col gap-1 border-t border-gray-300 bg-gray-50 px-6 py-3 md:grid md:grid-cols-12 md:items-center md:gap-4">
                      <div className="col-span-2 text-sm font-bold text-foreground">
                        {q.quarter} Total
                      </div>
                      <div className="col-span-2 text-right text-sm font-semibold text-muted-foreground">
                        {formatUsdc(q.subscriptions)}
                      </div>
                      <div className="col-span-2 text-right text-sm font-semibold text-muted-foreground">
                        {formatUsdc(q.tips)}
                      </div>
                      <div className="col-span-2 text-right text-sm font-semibold text-muted-foreground">
                        {formatUsdc(q.ppv)}
                      </div>
                      <div className="col-span-2 text-right text-sm font-bold text-foreground">
                        {formatUsdc(q.total)}
                      </div>
                      <div className="col-span-2 text-right text-sm font-bold text-emerald-600">
                        {formatUsdc(q.net)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Annual total row */}
            <div className="flex flex-col gap-1 border-t-2 border-gray-400 bg-gray-100 px-6 py-4 md:grid md:grid-cols-12 md:items-center md:gap-4">
              <div className="col-span-2 text-sm font-bold text-foreground">
                Annual Total
              </div>
              <div className="col-span-2 text-right text-sm font-bold text-muted-foreground">
                {formatUsdc(
                  data.monthly.reduce((s, m) => s + m.subscriptions, 0),
                )}
              </div>
              <div className="col-span-2 text-right text-sm font-bold text-muted-foreground">
                {formatUsdc(data.monthly.reduce((s, m) => s + m.tips, 0))}
              </div>
              <div className="col-span-2 text-right text-sm font-bold text-muted-foreground">
                {formatUsdc(data.monthly.reduce((s, m) => s + m.ppv, 0))}
              </div>
              <div className="col-span-2 text-right text-sm font-bold text-foreground">
                {formatUsdc(data.annual.gross_earnings)}
              </div>
              <div className="col-span-2 text-right text-sm font-bold text-[#00AFF0]">
                {formatUsdc(data.annual.net_earnings)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
