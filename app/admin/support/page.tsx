"use client";

import { useEffect, useState, useCallback } from "react";
import {
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Clock,
  AlertCircle,
  ChevronLeft,
  Send,
  LifeBuoy,
  Search,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Ticket {
  id: number;
  user_id: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  user_username: string | null;
  user_display_name: string | null;
  user_avatar_url: string | null;
  message_count: number;
  user_message_count: number;
}

interface Message {
  id: number;
  ticket_id: number;
  sender_id: string;
  body: string;
  is_staff: boolean;
  created_at: string;
  sender_username: string | null;
  sender_display_name: string | null;
  sender_avatar_url: string | null;
}

interface TicketDetail {
  ticket: Ticket;
  messages: Message[];
}

interface Summary {
  open_count: number;
  in_progress_count: number;
  resolved_count: number;
  closed_count: number;
  total_count: number;
}

type StatusFilter = "all" | "open" | "in_progress" | "resolved" | "closed";

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

const STATUS_CONFIG: Record<string, { label: string; bgClass: string; textClass: string }> = {
  open: { label: "Open", bgClass: "bg-amber-100", textClass: "text-amber-700" },
  in_progress: { label: "In Progress", bgClass: "bg-blue-100", textClass: "text-blue-700" },
  resolved: { label: "Resolved", bgClass: "bg-emerald-100", textClass: "text-emerald-700" },
  closed: { label: "Closed", bgClass: "bg-gray-100", textClass: "text-gray-600" },
};

const PRIORITY_CONFIG: Record<string, { label: string; bgClass: string; textClass: string }> = {
  low: { label: "Low", bgClass: "bg-gray-100", textClass: "text-gray-600" },
  medium: { label: "Medium", bgClass: "bg-amber-100", textClass: "text-amber-700" },
  high: { label: "High", bgClass: "bg-red-100", textClass: "text-red-700" },
};

const CATEGORY_LABELS: Record<string, string> = {
  account: "Account",
  billing: "Billing",
  content: "Content",
  technical: "Technical",
  other: "Other",
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.open;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${config.bgClass} ${config.textClass}`}
    >
      {config.label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const config = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.medium;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${config.bgClass} ${config.textClass}`}
    >
      {config.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  icon: Icon,
  accentColor,
}: {
  label: string;
  value: string;
  icon: typeof Clock;
  accentColor: string;
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
      <p className="mt-3 text-xl font-bold text-gray-900 sm:text-2xl">{value}</p>
      <p className="mt-0.5 text-xs text-gray-500">{label}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter Tabs
// ---------------------------------------------------------------------------

const FILTER_TABS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "in_progress", label: "In Progress" },
  { key: "resolved", label: "Resolved" },
  { key: "closed", label: "Closed" },
];

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);

  // Detail view
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  // Reply
  const [replyBody, setReplyBody] = useState("");
  const [replying, setReplying] = useState(false);

  // Status update
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Toast
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (successMessage) {
      const t = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(t);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const t = setTimeout(() => setErrorMessage(null), 6000);
      return () => clearTimeout(t);
    }
  }, [errorMessage]);

  // ---- Fetch tickets ----
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (filter !== "all") params.set("status", filter);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/admin/support?${params.toString()}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? `Error ${res.status}`);
        return;
      }
      const json = await res.json();
      setTickets(json.data.tickets);
      setSummary(json.data.summary);
    } catch {
      setError("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, [filter, searchQuery]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // ---- View ticket detail ----
  const handleViewTicket = async (ticketId: number) => {
    setDetailLoading(true);
    setShowDetail(true);
    setReplyBody("");
    try {
      const res = await fetch(`/api/support/${ticketId}`);
      if (!res.ok) {
        setErrorMessage("Failed to load ticket");
        setShowDetail(false);
        return;
      }
      const json = await res.json();
      setSelectedTicket(json.data);
    } catch {
      setErrorMessage("Failed to load ticket");
      setShowDetail(false);
    } finally {
      setDetailLoading(false);
    }
  };

  // ---- Send reply ----
  const handleReply = async () => {
    if (!selectedTicket || !replyBody.trim()) return;
    setReplying(true);
    try {
      const res = await fetch(`/api/support/${selectedTicket.ticket.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: replyBody.trim() }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setErrorMessage(json.error ?? "Failed to send reply");
        return;
      }
      setReplyBody("");
      setSuccessMessage("Reply sent");
      await handleViewTicket(selectedTicket.ticket.id);
      fetchTickets();
    } catch {
      setErrorMessage("Failed to send reply");
    } finally {
      setReplying(false);
    }
  };

  // ---- Update status ----
  const handleStatusUpdate = async (newStatus: string) => {
    if (!selectedTicket) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/support/${selectedTicket.ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setErrorMessage(json.error ?? "Failed to update status");
        return;
      }
      setSuccessMessage(`Ticket marked as ${newStatus.replace("_", " ")}`);
      await handleViewTicket(selectedTicket.ticket.id);
      fetchTickets();
    } catch {
      setErrorMessage("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ---- Detail panel ----
  if (showDetail) {
    if (detailLoading) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-100" />
            <div className="h-6 w-64 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl border border-gray-200 bg-gray-50" />
            ))}
          </div>
        </div>
      );
    }

    if (!selectedTicket) return null;

    const { ticket, messages } = selectedTicket;
    const isClosed = ticket.status === "closed";

    return (
      <div className="space-y-6">
        {/* Toast */}
        {successMessage && (
          <div className="fixed right-4 top-20 z-50 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-lg">
            <CheckCircle2 className="h-4 w-4" />
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="fixed right-4 top-20 z-50 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-lg">
            <XCircle className="h-4 w-4" />
            {errorMessage}
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <button
              onClick={() => {
                setShowDetail(false);
                setSelectedTicket(null);
              }}
              className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-bold text-gray-900">
                  {ticket.subject}
                </h1>
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {CATEGORY_LABELS[ticket.category] ?? ticket.category}
                {" "}&middot; Ticket #{ticket.id}
                {" "}&middot; by @{ticket.user_username ?? "unknown"}
                {" "}&middot; {timeAgo(ticket.created_at)}
              </p>
            </div>
          </div>

          {/* Status actions */}
          <div className="flex gap-2">
            {ticket.status !== "resolved" && ticket.status !== "closed" && (
              <button
                onClick={() => handleStatusUpdate("resolved")}
                disabled={updatingStatus}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50"
              >
                <CheckCircle2 className="h-3 w-3" />
                Resolve
              </button>
            )}
            {ticket.status !== "closed" && (
              <button
                onClick={() => handleStatusUpdate("closed")}
                disabled={updatingStatus}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50"
              >
                <XCircle className="h-3 w-3" />
                Close
              </button>
            )}
            {ticket.status === "closed" && (
              <button
                onClick={() => handleStatusUpdate("open")}
                disabled={updatingStatus}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-50"
              >
                <AlertCircle className="h-3 w-3" />
                Reopen
              </button>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 flex items-center gap-3">
          {ticket.user_avatar_url ? (
            <img src={ticket.user_avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-xs font-bold text-white">
              {(ticket.user_display_name ?? "?").charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-900">
              {ticket.user_display_name ?? "Unknown"}
            </p>
            <p className="text-xs text-gray-500">@{ticket.user_username ?? "unknown"}</p>
          </div>
        </div>

        {/* Messages Thread */}
        <div className="space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-xl border p-4 ${
                msg.is_staff
                  ? "border-[#00AFF0]/20 bg-[#00AFF0]/5"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="mb-2 flex items-center gap-2">
                {msg.sender_avatar_url ? (
                  <img src={msg.sender_avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                      msg.is_staff ? "bg-[#00AFF0]" : "bg-gray-400"
                    }`}
                  >
                    {(msg.sender_display_name ?? "?").charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-medium text-gray-900">
                  {msg.sender_display_name ?? msg.sender_username ?? "Unknown"}
                </span>
                {msg.is_staff && (
                  <span className="rounded-full bg-[#00AFF0]/10 px-2 py-0.5 text-[10px] font-medium text-[#00AFF0]">
                    Staff
                  </span>
                )}
                <span className="ml-auto text-[11px] text-gray-400">
                  {timeAgo(msg.created_at)}
                </span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {msg.body}
              </p>
            </div>
          ))}
        </div>

        {/* Reply Box */}
        {!isClosed ? (
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              maxLength={5000}
              rows={3}
              placeholder="Type your response as staff..."
              className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#00AFF0]/50 focus:ring-2 focus:ring-[#00AFF0]/30 focus:outline-none resize-none"
            />
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-gray-400">{replyBody.length}/5000</p>
              <button
                onClick={handleReply}
                disabled={replying || !replyBody.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#00AFF0] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#009AD6] disabled:opacity-50"
              >
                {replying ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    Send Reply
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-center text-sm text-gray-500">
            This ticket is closed. Reopen it to continue the conversation.
          </div>
        )}
      </div>
    );
  }

  // ---- Loading state ----
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900 sm:text-xl">
            Support Tickets
          </h1>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-gray-200 bg-gray-50" />
          ))}
        </div>
        <div className="h-10 w-80 animate-pulse rounded-lg bg-gray-50" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg border border-gray-200 bg-gray-50" />
          ))}
        </div>
      </div>
    );
  }

  // ---- Error state ----
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-red-400">{error}</p>
        <button
          onClick={fetchTickets}
          className="mt-3 text-sm font-medium text-[#00AFF0] hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {successMessage && (
        <div className="fixed right-4 top-20 z-50 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-lg">
          <CheckCircle2 className="h-4 w-4" />
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="fixed right-4 top-20 z-50 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-lg">
          <XCircle className="h-4 w-4" />
          {errorMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 sm:text-xl">
            Support Tickets
          </h1>
          <p className="text-xs text-gray-500">
            Manage and respond to user support requests
          </p>
        </div>
        <button
          onClick={fetchTickets}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            label="Open"
            value={String(summary.open_count)}
            icon={AlertCircle}
            accentColor="#d97706"
          />
          <StatCard
            label="In Progress"
            value={String(summary.in_progress_count)}
            icon={Clock}
            accentColor="#2563eb"
          />
          <StatCard
            label="Resolved"
            value={String(summary.resolved_count)}
            icon={CheckCircle2}
            accentColor="#059669"
          />
          <StatCard
            label="Closed"
            value={String(summary.closed_count)}
            icon={XCircle}
            accentColor="#6b7280"
          />
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tickets..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#00AFF0]/50 focus:ring-2 focus:ring-[#00AFF0]/30 focus:outline-none"
          />
        </div>
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
            </button>
          ))}
        </div>
      </div>

      {/* Tickets Table */}
      {tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16">
          <LifeBuoy className="h-8 w-8 text-gray-300" />
          <p className="mt-3 text-sm text-gray-400">
            No {filter === "all" ? "" : filter.replace("_", " ")} tickets found
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-gray-400">
                  Ticket
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-gray-400">
                  User
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-gray-400">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-gray-400">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-gray-400">
                  Priority
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-gray-400">
                  Updated
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-gray-400">
                  Msgs
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  onClick={() => handleViewTicket(ticket.id)}
                  className="cursor-pointer transition-colors hover:bg-gray-50/50"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[250px]">
                        {ticket.subject}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        #{ticket.id}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {ticket.user_avatar_url ? (
                        <img src={ticket.user_avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-300 text-[10px] font-bold text-white">
                          {(ticket.user_display_name ?? "?").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-900">
                          {ticket.user_display_name ?? "Unknown"}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          @{ticket.user_username ?? "unknown"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-600">
                      {CATEGORY_LABELS[ticket.category] ?? ticket.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={ticket.priority} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-500">
                      {timeAgo(ticket.updated_at)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 text-xs text-gray-500">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {ticket.message_count}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
