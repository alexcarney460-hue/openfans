"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  FileWarning,
  Scale,
  Mail,
  User,
  Link as LinkIcon,
  FileText,
} from "lucide-react";

interface DmcaRequest {
  id: number;
  complainant_name: string;
  complainant_email: string;
  copyrighted_work: string;
  infringing_urls: string;
  good_faith: boolean;
  accuracy_statement: boolean;
  signature: string;
  status: string;
  admin_notes: string | null;
  post_id: number | null;
  created_at: string;
  resolved_at: string | null;
  post_title: string | null;
  post_is_hidden: boolean | null;
}

const STATUS_TABS = ["pending", "approved", "rejected", "counter_filed"] as const;

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  counter_filed: "Counter Filed",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  counter_filed: "bg-blue-100 text-blue-700",
};

export default function AdminDmcaPage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<DmcaRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<DmcaRequest | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const fetchRequests = async (status: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/dmca?status=${status}`);
      if (res.ok) {
        const json = await res.json();
        setRequests(json.data ?? []);
      } else {
        setErrorMessage("Failed to load DMCA requests.");
      }
    } catch {
      setErrorMessage("Failed to load DMCA requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests(statusFilter);
  }, [statusFilter]);

  const handleAction = async (action: "approve" | "reject" | "counter_filed") => {
    if (!selectedRequest) return;

    setActionLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/admin/dmca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: selectedRequest.id,
          action,
          notes: adminNotes.trim() || undefined,
        }),
      });

      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.id !== selectedRequest.id));
        setSelectedRequest(null);
        setAdminNotes("");
      } else {
        const json = await res.json().catch(() => ({ error: "Action failed" }));
        setErrorMessage(json.error ?? "Failed to process action.");
      }
    } catch {
      setErrorMessage("Failed to process action.");
    } finally {
      setActionLoading(false);
    }
  };

  // Detail view
  if (selectedRequest) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => {
            setSelectedRequest(null);
            setAdminNotes("");
            setErrorMessage(null);
          }}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to list
        </button>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Review DMCA Request</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review the takedown request and take appropriate action.
          </p>
        </div>

        {errorMessage && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            {errorMessage}
          </div>
        )}

        {/* Complainant Info */}
        <Card className="border-gray-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <User className="h-4 w-4 text-[#00AFF0]" />
              Complainant Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs text-muted-foreground">Full Legal Name</p>
                <p className="text-sm font-medium text-foreground">{selectedRequest.complainant_name}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-gray-400" />
                  {selectedRequest.complainant_email}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs text-muted-foreground">Electronic Signature</p>
                <p className="text-sm font-medium text-foreground italic">{selectedRequest.signature}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs text-muted-foreground">Submitted On</p>
                <p className="text-sm font-medium text-foreground">
                  {new Date(selectedRequest.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Copyrighted Work & URLs */}
        <Card className="border-gray-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <FileText className="h-4 w-4 text-[#00AFF0]" />
              Claim Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs text-muted-foreground mb-1">Description of Copyrighted Work</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{selectedRequest.copyrighted_work}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                <LinkIcon className="h-3 w-3" />
                Infringing URL(s)
              </p>
              <div className="text-sm text-foreground whitespace-pre-wrap font-mono text-xs break-all">
                {selectedRequest.infringing_urls}
              </div>
            </div>

            {/* Statements verification */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                <p className="text-xs text-foreground">Good Faith Statement Confirmed</p>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                <p className="text-xs text-foreground">Accuracy Under Perjury Confirmed</p>
              </div>
            </div>

            {selectedRequest.post_id && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs text-muted-foreground mb-1">Linked Post</p>
                <p className="text-sm text-foreground">
                  Post #{selectedRequest.post_id}
                  {selectedRequest.post_title && ` - ${selectedRequest.post_title}`}
                  {selectedRequest.post_is_hidden && (
                    <span className="ml-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      Hidden
                    </span>
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admin Notes + Actions */}
        <Card className="border-gray-200 bg-white">
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Admin Notes (optional)</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes about this DMCA decision..."
                rows={3}
                className="mt-2 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#00AFF0]/50 focus:ring-2 focus:ring-[#00AFF0]/20 focus:outline-none resize-none"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => handleAction("approve")}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Approve (Hide Post)
              </Button>
              <Button
                variant="outline"
                className="border-gray-200 text-gray-600 hover:bg-gray-50"
                onClick={() => handleAction("reject")}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="mr-2 h-4 w-4" />
                )}
                Reject
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => handleAction("counter_filed")}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Scale className="mr-2 h-4 w-4" />
                )}
                Mark Counter-Filed
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">DMCA Requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review and manage DMCA takedown requests from copyright holders.
        </p>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === s
                ? "bg-[#00AFF0]/15 text-gray-900"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {errorMessage && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          {errorMessage}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#00AFF0]" />
        </div>
      ) : requests.length === 0 ? (
        <Card className="border-gray-200 bg-white">
          <CardContent className="p-12 text-center">
            <FileWarning className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground">No {STATUS_LABELS[statusFilter]?.toLowerCase()} requests</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {statusFilter === "pending"
                ? "All clear! No DMCA requests are waiting for review."
                : `No DMCA requests with ${STATUS_LABELS[statusFilter]?.toLowerCase()} status.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <Card
              key={req.id}
              className="border-gray-200 bg-white hover:border-[#00AFF0]/30 transition-colors cursor-pointer"
              onClick={() => setSelectedRequest(req)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-500 shrink-0">
                    <Scale className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {req.complainant_name}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        ({req.complainant_email})
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {req.copyrighted_work}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(req.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {req.status === "pending" && (
                      <div className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                        <Clock className="h-3 w-3" />
                        Pending
                      </div>
                    )}
                    {req.status === "approved" && (
                      <div className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                        <CheckCircle className="h-3 w-3" />
                        Approved
                      </div>
                    )}
                    {req.status === "rejected" && (
                      <div className="flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                        <XCircle className="h-3 w-3" />
                        Rejected
                      </div>
                    )}
                    {req.status === "counter_filed" && (
                      <div className="flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                        <Scale className="h-3 w-3" />
                        Counter Filed
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
