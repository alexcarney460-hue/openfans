"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  Users,
  DollarSign,
  AlertTriangle,
  FileText,
  Download,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronRight,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TaxCreator {
  creator_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  gross_earnings_usdc: number;
  net_earnings_usdc: number;
  has_tax_info: boolean;
  needs_1099: boolean;
}

interface TaxSummary {
  year: number;
  total_creators_with_earnings: number;
  creators_above_threshold: number;
  creators_missing_tax_info: number;
  total_platform_revenue_usdc: number;
  threshold_usdc: number;
  creators: TaxCreator[];
}

interface MonthlyBreakdown {
  month: number;
  month_name: string;
  gross_earnings_usdc: number;
  net_earnings_usdc: number;
  transaction_count: number;
}

interface CreatorTaxDetail {
  creator_id: string;
  year: number;
  monthly_breakdown: MonthlyBreakdown[];
}

type FilterTab = "all" | "above_threshold" | "missing_tax_info";
type SortField = "gross_earnings" | "net_earnings";
type SortDir = "asc" | "desc";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function usdcToDisplay(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

// ---------------------------------------------------------------------------
// Stat Card (matching existing admin pattern)
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  icon: Icon,
  accentColor,
  subValue,
}: {
  label: string;
  value: string;
  icon: typeof Users;
  accentColor: string;
  subValue?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-xl font-bold text-gray-900 sm:text-2xl">
        {value}
      </p>
      <p className="mt-0.5 text-xs text-gray-500">{label}</p>
      {subValue && (
        <p
          className="mt-1 text-xs font-medium"
          style={{ color: accentColor }}
        >
          {subValue}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tax Info Badge
// ---------------------------------------------------------------------------

function TaxInfoBadge({ complete }: { complete: boolean }) {
  return complete ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
      <CheckCircle2 className="h-3 w-3" />
      Tax Info Complete
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-medium text-red-700">
      <XCircle className="h-3 w-3" />
      Missing
    </span>
  );
}

function Required1099Badge({ required }: { required: boolean }) {
  if (!required) return <span className="text-xs text-gray-400">No</span>;
  return (
    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">
      1099 Required
    </span>
  );
}

// ---------------------------------------------------------------------------
// Monthly Breakdown Row (expandable detail)
// ---------------------------------------------------------------------------

function MonthlyBreakdownPanel({
  creatorId,
  year,
}: {
  creatorId: string;
  year: number;
}) {
  const [detail, setDetail] = useState<CreatorTaxDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchDetail() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/admin/tax/creator/${creatorId}?year=${year}`
        );
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          setError(json.error ?? `Error ${res.status}`);
          return;
        }
        const json = await res.json();
        if (!cancelled) {
          setDetail(json.data);
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load creator detail");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    fetchDetail();
    return () => {
      cancelled = true;
    };
  }, [creatorId, year]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-4">
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        <span className="text-xs text-gray-400">
          Loading monthly breakdown...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-4">
        <p className="text-xs text-red-400">{error}</p>
      </div>
    );
  }

  if (!detail || detail.monthly_breakdown.length === 0) {
    return (
      <div className="px-4 py-4">
        <p className="text-xs text-gray-400">No monthly data available</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-3">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-wider text-gray-400">
              Month
            </th>
            <th className="px-2 py-1.5 text-right text-[10px] font-medium uppercase tracking-wider text-gray-400">
              Gross
            </th>
            <th className="px-2 py-1.5 text-right text-[10px] font-medium uppercase tracking-wider text-gray-400">
              Net (95%)
            </th>
            <th className="px-2 py-1.5 text-right text-[10px] font-medium uppercase tracking-wider text-gray-400">
              Transactions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {detail.monthly_breakdown.map((m) => (
            <tr key={m.month} className="text-xs">
              <td className="px-2 py-1.5 font-medium text-gray-700">
                {m.month_name}
              </td>
              <td className="px-2 py-1.5 text-right text-gray-900">
                {usdcToDisplay(m.gross_earnings_usdc)}
              </td>
              <td className="px-2 py-1.5 text-right text-gray-600">
                {usdcToDisplay(m.net_earnings_usdc)}
              </td>
              <td className="px-2 py-1.5 text-right text-gray-500">
                {m.transaction_count}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function AdminTaxPage() {
  const currentYear = new Date().getFullYear();

  const [year, setYear] = useState(currentYear);
  const [summary, setSummary] = useState<TaxSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("gross_earnings");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedCreator, setExpandedCreator] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search input (400ms)
  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [search]);

  // Fetch tax summary data
  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/tax/summary?year=${year}&threshold=60000`
      );
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? `Error ${res.status}`);
        return;
      }
      const json = await res.json();
      setSummary(json.data);
    } catch {
      setError("Failed to load tax data");
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Reset expanded row and filter when year changes
  useEffect(() => {
    setExpandedCreator(null);
  }, [year]);

  // Handle CSV export
  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const res = await fetch(
        `/api/admin/tax/export?year=${year}&format=csv`
      );
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setExportError(json.error ?? `Export failed with status ${res.status}`);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `1099-data-${year}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setExportError("Failed to export tax data. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  // Toggle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === "desc" ? "asc" : "desc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  // Filter and sort creators
  const filteredCreators = useMemo(() => {
    if (!summary) return [];

    let creators = [...summary.creators];

    // Apply filter tab
    if (filter === "above_threshold") {
      creators = creators.filter((c) => c.needs_1099);
    } else if (filter === "missing_tax_info") {
      creators = creators.filter((c) => !c.has_tax_info);
    }

    // Apply search
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      creators = creators.filter(
        (c) =>
          c.username.toLowerCase().includes(q) ||
          c.display_name.toLowerCase().includes(q)
      );
    }

    // Apply sort
    const multiplier = sortDir === "desc" ? -1 : 1;
    creators.sort((a, b) => {
      const aVal =
        sortField === "gross_earnings"
          ? a.gross_earnings_usdc
          : a.net_earnings_usdc;
      const bVal =
        sortField === "gross_earnings"
          ? b.gross_earnings_usdc
          : b.net_earnings_usdc;
      return (aVal - bVal) * multiplier;
    });

    return creators;
  }, [summary, filter, debouncedSearch, sortField, sortDir]);

  // Year options (current year and 4 prior years)
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Filter tabs config
  const FILTER_TABS: { key: FilterTab; label: string; count?: number }[] = [
    { key: "all", label: "All", count: summary?.creators.length },
    {
      key: "above_threshold",
      label: "Above Threshold",
      count: summary?.creators_above_threshold,
    },
    {
      key: "missing_tax_info",
      label: "Missing Tax Info",
      count: summary?.creators_missing_tax_info,
    },
  ];

  // Sort indicator
  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <ChevronDown className="ml-0.5 inline h-3 w-3 text-gray-300" />
      );
    }
    return (
      <ChevronDown
        className={`ml-0.5 inline h-3 w-3 text-gray-600 transition-transform ${
          sortDir === "asc" ? "rotate-180" : ""
        }`}
      />
    );
  };

  // ---- Loading state ----
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900 sm:text-xl">
            Tax Reporting
          </h1>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl border border-gray-200 bg-gray-50"
            />
          ))}
        </div>
        <div className="h-10 w-80 animate-pulse rounded-lg bg-gray-50" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-lg border border-gray-200 bg-gray-50"
            />
          ))}
        </div>
      </div>
    );
  }

  // ---- Error state ----
  if (error || !summary) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-red-400">
          {error ?? "Something went wrong"}
        </p>
        <button
          onClick={fetchSummary}
          className="mt-3 text-sm font-medium text-[#00AFF0] hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 sm:text-xl">
            Tax Reporting
          </h1>
          <p className="text-xs text-gray-500">
            Creator earnings summary and 1099 management
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Year Selector */}
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 outline-none transition-colors hover:bg-gray-50 focus:border-[#00AFF0] focus:ring-1 focus:ring-[#00AFF0]"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <button
            onClick={fetchSummary}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Creators with Earnings"
          value={formatNum(summary.total_creators_with_earnings)}
          icon={Users}
          accentColor="#00AFF0"
        />
        <StatCard
          label="Need 1099 (Above $600)"
          value={formatNum(summary.creators_above_threshold)}
          icon={FileText}
          accentColor="#d97706"
          subValue={
            summary.creators_above_threshold > 0
              ? `${usdcToDisplay(summary.threshold_usdc)} threshold`
              : undefined
          }
        />
        <StatCard
          label="Missing Tax Info (W-9)"
          value={formatNum(summary.creators_missing_tax_info)}
          icon={AlertTriangle}
          accentColor="#dc2626"
          subValue={
            summary.creators_missing_tax_info > 0
              ? "Action required"
              : "All complete"
          }
        />
        <StatCard
          label={`Platform Revenue (${year})`}
          value={usdcToDisplay(summary.total_platform_revenue_usdc)}
          icon={DollarSign}
          accentColor="#059669"
        />
      </div>

      {/* Filter Tabs + Search + Export */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                filter === tab.key
                  ? "bg-[#00AFF0] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`ml-1.5 ${
                    filter === tab.key ? "text-white/80" : "text-gray-400"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search creators..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 rounded-lg border border-gray-200 bg-white py-2 pl-8 pr-3 text-xs text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-[#00AFF0] focus:ring-1 focus:ring-[#00AFF0]"
            />
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#00AFF0] px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-[#009AD6] disabled:opacity-50"
          >
            {exporting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5" />
                Export 1099 Data
              </>
            )}
          </button>
        </div>
      </div>

      {/* Export error message */}
      {exportError && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{exportError}</span>
          <button
            onClick={() => setExportError(null)}
            className="ml-4 text-xs font-medium text-red-500 hover:text-red-700"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Creator Earnings Table */}
      {filteredCreators.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16">
          <FileText className="h-8 w-8 text-gray-300" />
          <p className="mt-3 text-sm text-gray-400">
            {debouncedSearch.trim()
              ? "No creators match your search"
              : "No creators found for this filter"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="w-8 px-4 py-3" />
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-gray-400">
                  Creator
                </th>
                <th
                  className="cursor-pointer px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-gray-400 transition-colors hover:text-gray-600"
                  onClick={() => handleSort("gross_earnings")}
                >
                  Gross Earnings
                  <SortIndicator field="gross_earnings" />
                </th>
                <th
                  className="cursor-pointer px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-gray-400 transition-colors hover:text-gray-600"
                  onClick={() => handleSort("net_earnings")}
                >
                  Net Earnings (95%)
                  <SortIndicator field="net_earnings" />
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-gray-400">
                  Tax Info Status
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-gray-400">
                  1099 Required
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredCreators.map((creator) => {
                const isExpanded = expandedCreator === creator.creator_id;
                return (
                  <tr key={creator.creator_id} className="group">
                    <td colSpan={6} className="p-0">
                      {/* Main row */}
                      <button
                        onClick={() =>
                          setExpandedCreator(
                            isExpanded ? null : creator.creator_id
                          )
                        }
                        className="flex w-full items-center transition-colors hover:bg-gray-50/50"
                      >
                        {/* Chevron */}
                        <div className="flex w-12 shrink-0 items-center justify-center px-4 py-3">
                          {isExpanded ? (
                            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                          )}
                        </div>

                        {/* Creator */}
                        <div className="flex flex-1 items-center gap-3 px-4 py-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-xs font-bold text-gray-900">
                            {creator.avatar_url ? (
                              <img
                                src={creator.avatar_url}
                                alt={creator.display_name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              creator.display_name.charAt(0)
                            )}
                          </div>
                          <div className="min-w-0 text-left">
                            <p className="truncate text-sm font-medium text-gray-900">
                              {creator.display_name}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              @{creator.username}
                            </p>
                          </div>
                        </div>

                        {/* Gross Earnings */}
                        <div className="w-36 shrink-0 px-4 py-3 text-left">
                          <span className="text-sm font-semibold text-gray-900">
                            {usdcToDisplay(creator.gross_earnings_usdc)}
                          </span>
                        </div>

                        {/* Net Earnings */}
                        <div className="w-36 shrink-0 px-4 py-3 text-left">
                          <span className="text-sm text-gray-600">
                            {usdcToDisplay(creator.net_earnings_usdc)}
                          </span>
                        </div>

                        {/* Tax Info Status */}
                        <div className="w-40 shrink-0 px-4 py-3 text-left">
                          <TaxInfoBadge complete={creator.has_tax_info} />
                        </div>

                        {/* 1099 Required */}
                        <div className="w-32 shrink-0 px-4 py-3 text-left">
                          <Required1099Badge required={creator.needs_1099} />
                        </div>
                      </button>

                      {/* Expanded monthly breakdown */}
                      {isExpanded && (
                        <div className="border-t border-gray-100 bg-gray-50/50">
                          <MonthlyBreakdownPanel
                            creatorId={creator.creator_id}
                            year={year}
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer info */}
      <div className="flex items-center justify-between text-[11px] text-gray-400">
        <p>
          Showing {filteredCreators.length} of {summary.creators.length}{" "}
          creators
        </p>
        <p>
          1099 threshold: {usdcToDisplay(summary.threshold_usdc)} | Tax year:{" "}
          {year}
        </p>
      </div>
    </div>
  );
}
