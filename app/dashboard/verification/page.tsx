"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Shield,
  ShieldCheck,
  ShieldX,
  Clock,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Camera,
  FileText,
} from "lucide-react";

type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";

export default function VerificationPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<VerificationStatus>("unverified");
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState<string | null>(null);

  const [legalName, setLegalName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [documentUploading, setDocumentUploading] = useState(false);
  const [selfieUploading, setSelfieUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const documentInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch("/api/verification");
        if (res.ok) {
          const json = await res.json();
          setStatus(json.data.verification_status);
          setSubmittedAt(json.data.verification_submitted_at);
          setRejectionNotes(json.data.verification_notes);
        }
      } catch {
        // non-critical
      } finally {
        setLoading(false);
      }
    }
    fetchStatus();
  }, []);

  const handleFileUpload = async (
    file: File,
    setUrl: (url: string) => void,
    setUploading: (loading: boolean) => void,
  ) => {
    setUploading(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "verification-docs");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({ error: "Upload failed" }));
        setErrorMessage(json.error ?? "Failed to upload file.");
        return;
      }

      const json = await res.json();
      setUrl(json.data.url);
    } catch {
      setErrorMessage("Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!legalName.trim() || legalName.trim().length < 2) {
      setErrorMessage("Please enter your full legal name.");
      return;
    }

    if (!dateOfBirth) {
      setErrorMessage("Please enter your date of birth.");
      return;
    }

    // Client-side 18+ check
    const dob = new Date(dateOfBirth + "T00:00:00");
    const today = new Date();
    const eighteenYearsAgo = new Date(
      today.getFullYear() - 18,
      today.getMonth(),
      today.getDate(),
    );
    if (dob > eighteenYearsAgo) {
      setErrorMessage("You must be at least 18 years old to verify.");
      return;
    }

    if (!documentUrl) {
      setErrorMessage("Please upload your government ID.");
      return;
    }

    if (!selfieUrl) {
      setErrorMessage("Please upload a selfie holding your ID.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          legal_name: legalName.trim(),
          date_of_birth: dateOfBirth,
          document_url: documentUrl,
          selfie_url: selfieUrl,
        }),
      });

      if (res.ok) {
        setStatus("pending");
        setSubmittedAt(new Date().toISOString());
        setSuccessMessage("Verification submitted successfully! We will review your documents shortly.");
      } else {
        const json = await res.json().catch(() => ({ error: "Submission failed" }));
        setErrorMessage(json.error ?? "Failed to submit verification.");
      }
    } catch {
      setErrorMessage("Failed to submit verification. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Identity Verification</h1>
          <p className="mt-1 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Max date for DOB input: 18 years ago
  const today = new Date();
  const maxDob = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())
    .toISOString()
    .split("T")[0];

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Identity Verification</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Verify your identity to start publishing content and receiving payments.
        </p>
      </div>

      {/* Status messages */}
      {errorMessage && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
          <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
          {successMessage}
        </div>
      )}

      {/* Verified state */}
      {status === "verified" && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <ShieldCheck className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-emerald-700">You are verified!</h2>
            <p className="mt-2 text-sm text-emerald-600">
              Your identity has been confirmed. You can now publish content and receive payments.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pending state */}
      {status === "pending" && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-amber-700">Verification Under Review</h2>
            <p className="mt-2 text-sm text-amber-600">
              Your documents are being reviewed. This usually takes 24-48 hours.
            </p>
            {submittedAt && (
              <p className="mt-3 text-xs text-amber-500">
                Submitted on {new Date(submittedAt).toLocaleDateString("en-US", {
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
      )}

      {/* Rejected state */}
      {status === "rejected" && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100">
                <ShieldX className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-red-700">Verification Rejected</h2>
                <p className="mt-1 text-sm text-red-600">
                  Your verification was not approved. Please review the feedback below and resubmit.
                </p>
                {rejectionNotes && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-white p-3">
                    <p className="text-xs font-medium text-red-500 uppercase tracking-wide mb-1">Reason</p>
                    <p className="text-sm text-gray-700">{rejectionNotes}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submission form: shown for unverified and rejected statuses */}
      {(status === "unverified" || status === "rejected") && (
        <Card className="border-gray-200 bg-white">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00AFF0]/10">
                <Shield className="h-5 w-5 text-[#00AFF0]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Submit Verification</h2>
                <p className="text-xs text-muted-foreground">
                  All documents are stored securely and only visible to administrators.
                </p>
              </div>
            </div>

            {/* Legal Name */}
            <div>
              <Label htmlFor="legalName" className="text-sm text-muted-foreground">
                Legal Full Name
              </Label>
              <Input
                id="legalName"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="As shown on your government ID"
                maxLength={200}
                className="mt-1.5 border-gray-200 bg-gray-50 focus:border-[#00AFF0]/50 focus:ring-[#00AFF0]/30"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <Label htmlFor="dob" className="text-sm text-muted-foreground">
                Date of Birth
              </Label>
              <Input
                id="dob"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                max={maxDob}
                className="mt-1.5 border-gray-200 bg-gray-50 focus:border-[#00AFF0]/50 focus:ring-[#00AFF0]/30"
              />
              <p className="mt-1 text-xs text-muted-foreground">You must be at least 18 years old.</p>
            </div>

            {/* Government ID Upload */}
            <div>
              <Label className="text-sm text-muted-foreground">Government ID (Front)</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Upload a clear photo of the front of your government-issued ID (passport, driver&apos;s license, or national ID card).
              </p>
              {documentUrl ? (
                <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-emerald-700">ID uploaded successfully</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => {
                      setDocumentUrl(null);
                      if (documentInputRef.current) documentInputRef.current.value = "";
                    }}
                  >
                    Replace
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => documentInputRef.current?.click()}
                  disabled={documentUploading}
                  className="flex w-full items-center justify-center gap-3 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-muted-foreground transition-colors hover:border-[#00AFF0]/50 hover:bg-[#00AFF0]/5 disabled:opacity-50"
                >
                  {documentUploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <FileText className="h-5 w-5" />
                      Click to upload your government ID
                    </>
                  )}
                </button>
              )}
              <input
                ref={documentInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, setDocumentUrl, setDocumentUploading);
                }}
              />
            </div>

            {/* Selfie Upload */}
            <div>
              <Label className="text-sm text-muted-foreground">Selfie Holding ID</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Take a photo of yourself holding your government ID next to your face. Both your face and ID must be clearly visible.
              </p>
              {selfieUrl ? (
                <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-emerald-700">Selfie uploaded successfully</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => {
                      setSelfieUrl(null);
                      if (selfieInputRef.current) selfieInputRef.current.value = "";
                    }}
                  >
                    Replace
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => selfieInputRef.current?.click()}
                  disabled={selfieUploading}
                  className="flex w-full items-center justify-center gap-3 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-muted-foreground transition-colors hover:border-[#00AFF0]/50 hover:bg-[#00AFF0]/5 disabled:opacity-50"
                >
                  {selfieUploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Camera className="h-5 w-5" />
                      Click to upload your selfie with ID
                    </>
                  )}
                </button>
              )}
              <input
                ref={selfieInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, setSelfieUrl, setSelfieUploading);
                }}
              />
            </div>

            {/* Submit */}
            <div className="pt-2 border-t border-gray-200">
              <Button
                className="w-full bg-[#00AFF0] hover:bg-[#009dd8]"
                onClick={handleSubmit}
                disabled={submitting || documentUploading || selfieUploading}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Submit for Verification
                  </>
                )}
              </Button>
              <p className="mt-2 text-xs text-center text-muted-foreground">
                By submitting, you confirm that all provided information is accurate and matches your government-issued ID.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
