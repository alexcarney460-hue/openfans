"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LifeBuoy,
  Plus,
  ChevronLeft,
  Send,
  Loader2,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Ticket {
  id: number;
  subject: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  message_count: number;
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
  ticket: Ticket & {
    user_id: string;
    user_username: string | null;
    user_display_name: string | null;
  };
  messages: Message[];
}

type StatusFilter = "all" | "open" | "in_progress" | "resolved" | "closed";
type View = "list" | "create" | "detail";

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

const STATUS_CONFIG: Record<string, { label: string; bgClass: string; textClass: string; icon: typeof Clock }> = {
  open: { label: "Open", bgClass: "bg-amber-100", textClass: "text-amber-700", icon: AlertCircle },
  in_progress: { label: "In Progress", bgClass: "bg-blue-100", textClass: "text-blue-700", icon: Clock },
  resolved: { label: "Resolved", bgClass: "bg-emerald-100", textClass: "text-emerald-700", icon: CheckCircle2 },
  closed: { label: "Closed", bgClass: "bg-gray-100", textClass: "text-gray-600", icon: XCircle },
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

export default function SupportPage() {
  const [view, setView] = useState<View>("list");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");

  // Create form state
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("account");
  const [body, setBody] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Detail view state
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [replying, setReplying] = useState(false);

  // Toast
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (successMessage) {
      const t = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(t);
    }
  }, [successMessage]);

  // ---- Fetch tickets ----
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const statusParam = filter !== "all" ? `&status=${filter}` : "";
      const res = await fetch(`/api/support?limit=50${statusParam}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? `Error ${res.status}`);
        return;
      }
      const json = await res.json();
      setTickets(json.data.tickets);
    } catch {
      setError("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // ---- Create ticket ----
  const handleCreate = async () => {
    setCreating(true);
    setCreateError(null);

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), category, body: body.trim() }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setCreateError(json.error ?? "Failed to create ticket");
        return;
      }

      setSubject("");
      setCategory("account");
      setBody("");
      setSuccessMessage("Ticket submitted successfully");
      setView("list");
      fetchTickets();
    } catch {
      setCreateError("Failed to create ticket");
    } finally {
      setCreating(false);
    }
  };

  // ---- View ticket detail ----
  const handleViewTicket = async (ticketId: number) => {
    setDetailLoading(true);
    setView("detail");
    try {
      const res = await fetch(`/api/support/${ticketId}`);
      if (!res.ok) {
        setError("Failed to load ticket");
        setView("list");
        return;
      }
      const json = await res.json();
      setSelectedTicket(json.data);
    } catch {
      setError("Failed to load ticket");
      setView("list");
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
        setError(json.error ?? "Failed to send reply");
        return;
      }

      setReplyBody("");
      // Refresh the ticket detail
      await handleViewTicket(selectedTicket.ticket.id);
    } catch {
      setError("Failed to send reply");
    } finally {
      setReplying(false);
    }
  };

  // ---- Create View ----
  if (view === "create") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView("list")}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">New Support Ticket</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Describe your issue and our team will get back to you.
            </p>
          </div>
        </div>

        {createError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {createError}
          </div>
        )}

        <Card className="border-gray-200 bg-white">
          <CardContent className="p-6 space-y-5">
            <div>
              <Label htmlFor="subject" className="text-sm text-muted-foreground">
                Subject
              </Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={200}
                placeholder="Brief description of your issue"
                className="mt-1.5 border-gray-200 bg-gray-50 focus:border-[#00AFF0]/50 focus:ring-[#00AFF0]/30"
              />
            </div>

            <div>
              <Label htmlFor="category" className="text-sm text-muted-foreground">
                Category
              </Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-foreground focus:border-[#00AFF0]/50 focus:ring-2 focus:ring-[#00AFF0]/30 focus:outline-none"
              >
                <option value="account">Account</option>
                <option value="billing">Billing</option>
                <option value="content">Content</option>
                <option value="technical">Technical</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <Label htmlFor="body" className="text-sm text-muted-foreground">
                Message
              </Label>
              <textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={5000}
                rows={6}
                placeholder="Describe your issue in detail..."
                className="mt-1.5 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#00AFF0]/50 focus:ring-2 focus:ring-[#00AFF0]/30 focus:outline-none resize-none"
              />
              <p className="mt-1 text-xs text-muted-foreground">{body.length}/5000</p>
            </div>

            <div className="flex justify-end">
              <Button
                className="bg-[#00AFF0] hover:bg-[#009dd8] px-6"
                onClick={handleCreate}
                disabled={creating || !subject.trim() || !body.trim()}
              >
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Ticket
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---- Detail View ----
  if (view === "detail") {
    if (detailLoading) {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-100" />
            <div className="h-6 w-48 animate-pulse rounded bg-gray-100" />
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
        {/* Header */}
        <div className="flex items-start gap-3">
          <button
            onClick={() => {
              setView("list");
              setSelectedTicket(null);
              fetchTickets();
            }}
            className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                {ticket.subject}
              </h1>
              <StatusBadge status={ticket.status} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {CATEGORY_LABELS[ticket.category] ?? ticket.category} &middot; Ticket #{ticket.id} &middot; {timeAgo(ticket.created_at)}
            </p>
          </div>
        </div>

        {/* Messages Thread */}
        <div className="space-y-4">
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
                  <img
                    src={msg.sender_avatar_url}
                    alt=""
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${
                      msg.is_staff ? "bg-[#00AFF0]" : "bg-gray-400"
                    }`}
                  >
                    {(msg.sender_display_name ?? "?").charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium text-foreground">
                    {msg.sender_display_name ?? msg.sender_username ?? "Unknown"}
                  </span>
                  {msg.is_staff && (
                    <span className="ml-2 rounded-full bg-[#00AFF0]/10 px-2 py-0.5 text-[10px] font-medium text-[#00AFF0]">
                      Staff
                    </span>
                  )}
                </div>
                <span className="ml-auto text-[11px] text-muted-foreground">
                  {timeAgo(msg.created_at)}
                </span>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {msg.body}
              </p>
            </div>
          ))}
        </div>

        {/* Reply Box */}
        {!isClosed ? (
          <Card className="border-gray-200 bg-white">
            <CardContent className="p-4">
              <textarea
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                maxLength={5000}
                rows={3}
                placeholder="Type your reply..."
                className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#00AFF0]/50 focus:ring-2 focus:ring-[#00AFF0]/30 focus:outline-none resize-none"
              />
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{replyBody.length}/5000</p>
                <Button
                  size="sm"
                  className="bg-[#00AFF0] hover:bg-[#009dd8]"
                  onClick={handleReply}
                  disabled={replying || !replyBody.trim()}
                >
                  {replying ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-1.5 h-3.5 w-3.5" />
                      Reply
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-center text-sm text-muted-foreground">
            This ticket has been closed. If you need further help, please open a new ticket.
          </div>
        )}
      </div>
    );
  }

  // ---- List View ----
  return (
    <div className="space-y-6">
      {/* Toast */}
      {successMessage && (
        <div className="fixed right-4 top-20 z-50 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-lg">
          <CheckCircle2 className="h-4 w-4" />
          {successMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Support</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View your support tickets and submit new requests.
          </p>
        </div>
        <Button
          className="bg-[#00AFF0] hover:bg-[#009dd8] gap-2"
          onClick={() => setView("create")}
        >
          <Plus className="h-4 w-4" />
          New Ticket
        </Button>
      </div>

      {/* Filter Tabs */}
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

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl border border-gray-200 bg-gray-50"
            />
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={fetchTickets}
            className="mt-3 text-sm font-medium text-[#00AFF0] hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && tickets.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16">
          <LifeBuoy className="h-8 w-8 text-gray-300" />
          <p className="mt-3 text-sm text-gray-400">
            {filter === "all" ? "No support tickets yet" : `No ${filter.replace("_", " ")} tickets`}
          </p>
          <button
            onClick={() => setView("create")}
            className="mt-3 text-sm font-medium text-[#00AFF0] hover:underline"
          >
            Submit your first ticket
          </button>
        </div>
      )}

      {/* Ticket List */}
      {!loading && !error && tickets.length > 0 && (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => handleViewTicket(ticket.id)}
              className="w-full text-left rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50/50 hover:border-gray-300"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {ticket.subject}
                    </h3>
                    <StatusBadge status={ticket.status} />
                  </div>
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-500">
                      {CATEGORY_LABELS[ticket.category] ?? ticket.category}
                    </span>
                    <span>#{ticket.id}</span>
                    <span>{timeAgo(ticket.updated_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MessageSquare className="h-3.5 w-3.5" />
                  {ticket.message_count}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
