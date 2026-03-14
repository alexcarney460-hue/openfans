"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Flag,
  ChevronLeft,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
  XCircle,
  Clock,
  CheckCircle,
  ShieldAlert,
} from "lucide-react";

interface ModerationReport {
  id: number;
  reporter_id: string | null;
  post_id: number | null;
  reported_user_id: string | null;
  reason: string;
  description: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  resolved_at: string | null;
  reporter_username: string | null;
  reporter_display_name: string | null;
  reported_username: string | null;
  reported_display_name: string | null;
  post_title: string | null;
  post_body: string | null;
  post_media_type: string | null;
  post_media_urls: string[] | null;
  post_is_hidden: boolean | null;
}

const STATUS_TABS = ["pending", "reviewed", "action_taken", "dismissed"] as const;

const REASON_LABELS: Record<string, string> = {
  spam: "Spam",
  illegal: "Illegal Content",
  underage: "Underage Content",
  harassment: "Harassment",
  copyright: "Copyright Violation",
  other: "Other",
};

const REASON_COLORS: Record<string, string> = {
  spam: "bg-yellow-100 text-yellow-700",
  illegal: "bg-red-100 text-red-700",
  underage: "bg-red-100 text-red-700",
  harassment: "bg-orange-100 text-orange-700",
  copyright: "bg-blue-100 text-blue-700",
  other: "bg-gray-100 text-gray-600",
};

export default function AdminModerationPage() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<ModerationReport | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const fetchReports = async (status: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/moderation?status=${status}`);
      if (res.ok) {
        const json = await res.json();
        setReports(json.data ?? []);
      } else {
        setErrorMessage("Failed to load moderation reports.");
      }
    } catch {
      setErrorMessage("Failed to load moderation reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(statusFilter);
  }, [statusFilter]);

  const handleAction = async (action: "dismiss" | "hide_post" | "remove_post" | "warn") => {
    if (!selectedReport) return;

    setActionLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report_id: selectedReport.id,
          action,
          notes: adminNotes.trim() || undefined,
        }),
      });

      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== selectedReport.id));
        setSelectedReport(null);
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
  if (selectedReport) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => {
            setSelectedReport(null);
            setAdminNotes("");
            setErrorMessage(null);
          }}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to list
        </button>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Review Report</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review the reported content and take appropriate action.
          </p>
        </div>

        {errorMessage && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            {errorMessage}
          </div>
        )}

        {/* Report Info */}
        <Card className="border-gray-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Flag className="h-4 w-4 text-[#00AFF0]" />
              Report Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs text-muted-foreground">Reporter</p>
                <p className="text-sm font-medium text-foreground">
                  {selectedReport.reporter_display_name ?? "Unknown"}{" "}
                  {selectedReport.reporter_username && (
                    <span className="text-muted-foreground">@{selectedReport.reporter_username}</span>
                  )}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs text-muted-foreground">Reported Creator</p>
                <p className="text-sm font-medium text-foreground">
                  {selectedReport.reported_display_name ?? "Unknown"}{" "}
                  {selectedReport.reported_username && (
                    <span className="text-muted-foreground">@{selectedReport.reported_username}</span>
                  )}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs text-muted-foreground">Reason</p>
                <span className={`inline-block mt-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${REASON_COLORS[selectedReport.reason] ?? "bg-gray-100 text-gray-600"}`}>
                  {REASON_LABELS[selectedReport.reason] ?? selectedReport.reason}
                </span>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs text-muted-foreground">Reported On</p>
                <p className="text-sm font-medium text-foreground">
                  {new Date(selectedReport.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            {selectedReport.description && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs text-muted-foreground mb-1">Description from Reporter</p>
                <p className="text-sm text-foreground">{selectedReport.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reported Post Content */}
        <Card className="border-gray-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Eye className="h-4 w-4 text-[#00AFF0]" />
              Reported Post
              {selectedReport.post_is_hidden && (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  Hidden
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedReport.post_id ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Title</p>
                  <p className="text-sm font-medium text-foreground">
                    {selectedReport.post_title ?? "Untitled"}
                  </p>
                </div>
                {selectedReport.post_body && (
                  <div>
                    <p className="text-xs text-muted-foreground">Body</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {selectedReport.post_body}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">
                    Media Type: {selectedReport.post_media_type ?? "N/A"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-24 rounded-lg border border-dashed border-gray-300 bg-gray-50">
                <p className="text-sm text-muted-foreground">Post has been deleted</p>
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
                placeholder="Add notes about this moderation decision..."
                rows={3}
                className="mt-2 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#00AFF0]/50 focus:ring-2 focus:ring-[#00AFF0]/20 focus:outline-none resize-none"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                variant="outline"
                className="border-gray-200 text-gray-600 hover:bg-gray-50"
                onClick={() => handleAction("dismiss")}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="mr-2 h-4 w-4" />
                )}
                Dismiss Report
              </Button>
              <Button
                className="bg-amber-600 hover:bg-amber-700 text-white"
                onClick={() => handleAction("warn")}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <AlertTriangle className="mr-2 h-4 w-4" />
                )}
                Warn Creator
              </Button>
              <Button
                className="bg-orange-600 hover:bg-orange-700 text-white"
                onClick={() => handleAction("hide_post")}
                disabled={actionLoading || !selectedReport.post_id}
              >
                {actionLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <EyeOff className="mr-2 h-4 w-4" />
                )}
                Hide Post
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => handleAction("remove_post")}
                disabled={actionLoading || !selectedReport.post_id}
              >
                {actionLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Remove Post
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
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Content Moderation</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review and act on user-submitted content reports.
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
            {s === "action_taken" ? "Action Taken" : s.charAt(0).toUpperCase() + s.slice(1)}
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
      ) : reports.length === 0 ? (
        <Card className="border-gray-200 bg-white">
          <CardContent className="p-12 text-center">
            <ShieldAlert className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground">No {statusFilter === "action_taken" ? "action taken" : statusFilter} reports</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {statusFilter === "pending"
                ? "All clear! No reports are waiting for review."
                : `No reports with ${statusFilter === "action_taken" ? "action taken" : statusFilter} status.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Card
              key={report.id}
              className="border-gray-200 bg-white hover:border-[#00AFF0]/30 transition-colors cursor-pointer"
              onClick={() => setSelectedReport(report)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-500 shrink-0">
                    <Flag className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {report.post_title ?? "Untitled Post"}
                      </p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${REASON_COLORS[report.reason] ?? "bg-gray-100 text-gray-600"}`}>
                        {REASON_LABELS[report.reason] ?? report.reason}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Reported by {report.reporter_display_name ?? "Unknown"}{" "}
                      {report.reporter_username && <>(@{report.reporter_username})</>}
                      {" "}&middot;{" "}
                      Creator: {report.reported_display_name ?? "Unknown"}{" "}
                      {report.reported_username && <>(@{report.reported_username})</>}
                      {" "}&middot;{" "}
                      {new Date(report.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {report.status === "pending" && (
                      <div className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                        <Clock className="h-3 w-3" />
                        Pending
                      </div>
                    )}
                    {report.status === "reviewed" && (
                      <div className="flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                        <Eye className="h-3 w-3" />
                        Reviewed
                      </div>
                    )}
                    {report.status === "action_taken" && (
                      <div className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                        <CheckCircle className="h-3 w-3" />
                        Action Taken
                      </div>
                    )}
                    {report.status === "dismissed" && (
                      <div className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                        <XCircle className="h-3 w-3" />
                        Dismissed
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
