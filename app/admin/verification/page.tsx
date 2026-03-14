"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Shield,
  ShieldCheck,
  ShieldX,
  Clock,
  Loader2,
  ChevronLeft,
  User,
  Calendar,
  FileText,
  Camera,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";

interface VerificationRecord {
  creator_profile_id: number;
  user_id: string;
  verification_status: string;
  verification_submitted_at: string | null;
  verification_document_url: string | null;
  verification_selfie_url: string | null;
  verification_notes: string | null;
  date_of_birth: string | null;
  legal_name: string | null;
  display_name: string;
  username: string;
  email: string;
  avatar_url: string | null;
}

export default function AdminVerificationPage() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<VerificationRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<VerificationRecord | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionNotes, setRejectionNotes] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchRecords = async (status: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/admin/verification?status=${status}`);
      if (res.ok) {
        const json = await res.json();
        setRecords(json.data ?? []);
      } else {
        setErrorMessage("Failed to load verification records.");
      }
    } catch {
      setErrorMessage("Failed to load verification records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords(statusFilter);
  }, [statusFilter]);

  const handleAction = async (action: "approve" | "reject") => {
    if (!selectedRecord) return;

    if (action === "reject" && !rejectionNotes.trim()) {
      setErrorMessage("Please provide a rejection reason.");
      return;
    }

    setActionLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/admin/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creator_id: selectedRecord.user_id,
          action,
          notes: action === "reject" ? rejectionNotes.trim() : undefined,
        }),
      });

      if (res.ok) {
        // Remove from list and go back
        setRecords((prev) => prev.filter((r) => r.user_id !== selectedRecord.user_id));
        setSelectedRecord(null);
        setShowRejectForm(false);
        setRejectionNotes("");
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

  // Detail view for a single record
  if (selectedRecord) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => {
            setSelectedRecord(null);
            setShowRejectForm(false);
            setRejectionNotes("");
            setErrorMessage(null);
          }}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to list
        </button>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Review Verification</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review the submitted documents and approve or reject.
          </p>
        </div>

        {errorMessage && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            {errorMessage}
          </div>
        )}

        {/* Creator info */}
        <Card className="border-gray-200 bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#00AFF0] text-lg font-bold text-white overflow-hidden">
                {selectedRecord.avatar_url ? (
                  <Image
                    src={selectedRecord.avatar_url}
                    alt={selectedRecord.display_name}
                    width={56}
                    height={56}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  selectedRecord.display_name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">{selectedRecord.display_name}</h2>
                <p className="text-sm text-muted-foreground">@{selectedRecord.username} &middot; {selectedRecord.email}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Legal Name</p>
                  <p className="text-sm font-medium text-foreground">{selectedRecord.legal_name ?? "N/A"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Date of Birth</p>
                  <p className="text-sm font-medium text-foreground">
                    {selectedRecord.date_of_birth
                      ? new Date(selectedRecord.date_of_birth + "T00:00:00").toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {selectedRecord.verification_submitted_at && (
              <p className="mt-4 text-xs text-muted-foreground">
                Submitted on{" "}
                {new Date(selectedRecord.verification_submitted_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Documents */}
        <div className="grid gap-6 sm:grid-cols-2">
          <Card className="border-gray-200 bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <FileText className="h-4 w-4 text-[#00AFF0]" />
                Government ID
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedRecord.verification_document_url ? (
                <a
                  href={selectedRecord.verification_document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg overflow-hidden border border-gray-200 hover:border-[#00AFF0]/50 transition-colors"
                >
                  <img
                    src={selectedRecord.verification_document_url}
                    alt="Government ID"
                    className="w-full h-auto"
                  />
                </a>
              ) : (
                <div className="flex items-center justify-center h-48 rounded-lg border border-dashed border-gray-300 bg-gray-50">
                  <p className="text-sm text-muted-foreground">No document uploaded</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-gray-200 bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Camera className="h-4 w-4 text-[#00AFF0]" />
                Selfie with ID
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedRecord.verification_selfie_url ? (
                <a
                  href={selectedRecord.verification_selfie_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg overflow-hidden border border-gray-200 hover:border-[#00AFF0]/50 transition-colors"
                >
                  <img
                    src={selectedRecord.verification_selfie_url}
                    alt="Selfie with ID"
                    className="w-full h-auto"
                  />
                </a>
              ) : (
                <div className="flex items-center justify-center h-48 rounded-lg border border-dashed border-gray-300 bg-gray-50">
                  <p className="text-sm text-muted-foreground">No selfie uploaded</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card className="border-gray-200 bg-white">
          <CardContent className="p-6">
            {showRejectForm ? (
              <div className="space-y-4">
                <label className="text-sm font-medium text-foreground">
                  Rejection Reason
                </label>
                <textarea
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  placeholder="Explain why this verification is being rejected..."
                  rows={3}
                  className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-300 focus:ring-2 focus:ring-red-200 focus:outline-none resize-none"
                />
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="border-gray-200"
                    onClick={() => {
                      setShowRejectForm(false);
                      setRejectionNotes("");
                    }}
                    disabled={actionLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => handleAction("reject")}
                    disabled={actionLoading || !rejectionNotes.trim()}
                  >
                    {actionLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <ShieldX className="mr-2 h-4 w-4" />
                        Confirm Rejection
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1"
                  onClick={() => handleAction("approve")}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Approve
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="border-red-200 text-red-500 hover:bg-red-50 flex-1"
                  onClick={() => setShowRejectForm(true)}
                  disabled={actionLoading}
                >
                  <ShieldX className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Verification Reviews</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review and approve creator identity verifications.
        </p>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2">
        {["pending", "verified", "rejected", "unverified"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === s
                ? "bg-[#00AFF0]/15 text-gray-900"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
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
      ) : records.length === 0 ? (
        <Card className="border-gray-200 bg-white">
          <CardContent className="p-12 text-center">
            <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground">No {statusFilter} verifications</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {statusFilter === "pending"
                ? "All caught up! No verifications are waiting for review."
                : `No creators with ${statusFilter} verification status.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <Card
              key={record.user_id}
              className="border-gray-200 bg-white hover:border-[#00AFF0]/30 transition-colors cursor-pointer"
              onClick={() => setSelectedRecord(record)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00AFF0] text-sm font-bold text-white overflow-hidden shrink-0">
                    {record.avatar_url ? (
                      <Image
                        src={record.avatar_url}
                        alt={record.display_name}
                        width={40}
                        height={40}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      record.display_name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {record.display_name}
                      </p>
                      <span className="text-xs text-muted-foreground">@{record.username}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {record.legal_name ?? "Name not provided"}{" "}
                      {record.verification_submitted_at && (
                        <>
                          &middot; Submitted{" "}
                          {new Date(record.verification_submitted_at).toLocaleDateString()}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {record.verification_status === "pending" && (
                      <div className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                        <Clock className="h-3 w-3" />
                        Pending
                      </div>
                    )}
                    {record.verification_status === "verified" && (
                      <div className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                        <ShieldCheck className="h-3 w-3" />
                        Verified
                      </div>
                    )}
                    {record.verification_status === "rejected" && (
                      <div className="flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                        <ShieldX className="h-3 w-3" />
                        Rejected
                      </div>
                    )}
                    {record.verification_status === "unverified" && (
                      <div className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                        <Shield className="h-3 w-3" />
                        Unverified
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
