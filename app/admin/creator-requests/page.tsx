"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  UserPlus,
  Link2,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Loader2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RequestedCreator {
  readonly platform: string;
  readonly platform_username: string;
  readonly creator_name: string;
  readonly waitlist_count: number | string;
  readonly claim_status: string;
  readonly first_requested_at: string;
  readonly last_requested_at: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const mins = Math.floor((now - then) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function statusBadge(status: string) {
  switch (status) {
    case "claimed":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
          <Check className="h-3 w-3" /> Claimed
        </span>
      );
    case "pending":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-600">
          <Link2 className="h-3 w-3" /> Link Sent
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
          Unclaimed
        </span>
      );
  }
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function AdminCreatorRequestsPage() {
  const [creators, setCreators] = useState<readonly RequestedCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/creator-requests?limit=50&page=${page}`);
      if (!res.ok) {
        setError("Failed to load creator requests");
        return;
      }
      const json = await res.json();
      setCreators(json.data ?? []);
      setTotalPages(json.pagination?.pages ?? 1);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const generateClaimLink = async (creator: RequestedCreator) => {
    const key = `${creator.platform}:${creator.platform_username}`;
    setGeneratingFor(key);

    try {
      const res = await fetch("/api/creator-claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform_username: creator.platform_username,
          platform: creator.platform,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json.error ?? "Failed to generate claim link");
        return;
      }

      const fullUrl = `${window.location.origin}${json.data.claim_url}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopiedToken(key);
      setTimeout(() => setCopiedToken(null), 3000);
      fetchData();
    } catch {
      alert("Network error");
    } finally {
      setGeneratingFor(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900 sm:text-xl">
            Creator Requests
          </h1>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl border border-gray-200 bg-gray-50"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-red-400">{error}</p>
        <button
          onClick={fetchData}
          className="mt-3 text-sm font-medium text-[#00AFF0] hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 sm:text-xl">
            Creator Requests
          </h1>
          <p className="text-xs text-gray-500">
            Fan-requested creators waitlist
          </p>
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#00AFF0]/10 text-[#00AFF0]">
            <Users className="h-4 w-4" />
          </div>
          <p className="mt-3 text-xl font-bold text-gray-900">
            {creators.length}
          </p>
          <p className="text-xs text-gray-500">Requested Creators</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
            <Link2 className="h-4 w-4" />
          </div>
          <p className="mt-3 text-xl font-bold text-gray-900">
            {creators.filter((c) => c.claim_status === "pending").length}
          </p>
          <p className="text-xs text-gray-500">Links Sent</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500">
            <Check className="h-4 w-4" />
          </div>
          <p className="mt-3 text-xl font-bold text-gray-900">
            {creators.filter((c) => c.claim_status === "claimed").length}
          </p>
          <p className="text-xs text-gray-500">Claimed</p>
        </div>
      </div>

      {/* Table */}
      {creators.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
          <UserPlus className="mx-auto h-10 w-10 text-gray-200" />
          <p className="mt-3 text-sm text-gray-400">No creator requests yet</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Creator</th>
                  <th className="px-4 py-3">Platform</th>
                  <th className="px-4 py-3 text-center">Waitlist</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Last Request</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {creators.map((creator, i) => {
                  const key = `${creator.platform}:${creator.platform_username}`;
                  const isGenerating = generatingFor === key;
                  const isCopied = copiedToken === key;

                  return (
                    <tr
                      key={key}
                      className="border-b border-gray-50 transition-colors hover:bg-gray-50/50"
                    >
                      <td className="px-4 py-3 text-xs font-medium text-gray-400">
                        {(page - 1) * 50 + i + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {creator.creator_name}
                          </p>
                          <p className="text-xs text-gray-400">
                            @{creator.platform_username}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs capitalize text-gray-500">
                        {creator.platform}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#00AFF0]/10 px-2.5 py-0.5 text-xs font-bold text-[#00AFF0]">
                          <Users className="h-3 w-3" />
                          {creator.waitlist_count}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {statusBadge(creator.claim_status)}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {creator.last_requested_at
                          ? timeAgo(creator.last_requested_at)
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {creator.claim_status === "claimed" ? (
                          <span className="text-xs text-gray-400">Done</span>
                        ) : (
                          <button
                            onClick={() =>
                              generateClaimLink(creator as RequestedCreator)
                            }
                            disabled={isGenerating}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#00AFF0]/30 px-3 py-1.5 text-xs font-medium text-[#00AFF0] transition-all hover:bg-[#00AFF0] hover:text-white disabled:opacity-50"
                          >
                            {isGenerating ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : isCopied ? (
                              <>
                                <Check className="h-3 w-3" />
                                Copied!
                              </>
                            ) : creator.claim_status === "pending" ? (
                              <>
                                <Copy className="h-3 w-3" />
                                Copy Link
                              </>
                            ) : (
                              <>
                                <Link2 className="h-3 w-3" />
                                Generate Link
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-xs font-medium text-gray-500 hover:text-gray-900 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-xs text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="text-xs font-medium text-gray-500 hover:text-gray-900 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
