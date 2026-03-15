"use client";

import { useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";

interface FormState {
  readonly complainant_name: string;
  readonly complainant_email: string;
  readonly copyrighted_work: string;
  readonly infringing_urls: string;
  readonly good_faith: boolean;
  readonly accuracy_statement: boolean;
  readonly signature: string;
  readonly website: string; // honeypot
}

const INITIAL_STATE: FormState = {
  complainant_name: "",
  complainant_email: "",
  copyrighted_work: "",
  infringing_urls: "",
  good_faith: false,
  accuracy_statement: false,
  signature: "",
  website: "",
};

export default function DmcaSubmitPage() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const updateField = <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Client-side validation
    if (!form.complainant_name.trim()) {
      setErrorMessage("Full legal name is required.");
      return;
    }
    if (!form.complainant_email.trim()) {
      setErrorMessage("Email address is required.");
      return;
    }
    if (!form.copyrighted_work.trim()) {
      setErrorMessage("Description of copyrighted work is required.");
      return;
    }
    if (!form.infringing_urls.trim()) {
      setErrorMessage("At least one infringing URL is required.");
      return;
    }
    if (!form.good_faith) {
      setErrorMessage("You must confirm the good faith statement.");
      return;
    }
    if (!form.accuracy_statement) {
      setErrorMessage("You must confirm the accuracy statement.");
      return;
    }
    if (!form.signature.trim()) {
      setErrorMessage("Electronic signature is required.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/dmca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complainant_name: form.complainant_name.trim(),
          complainant_email: form.complainant_email.trim(),
          copyrighted_work: form.copyrighted_work.trim(),
          infringing_urls: form.infringing_urls.trim(),
          good_faith: form.good_faith,
          accuracy_statement: form.accuracy_statement,
          signature: form.signature.trim(),
          website: form.website, // honeypot
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const json = await res.json().catch(() => ({ error: "Submission failed" }));
        setErrorMessage(json.error ?? "Failed to submit DMCA request. Please try again.");
      }
    } catch {
      setErrorMessage("Failed to submit DMCA request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <SiteHeader />

      <main className="flex-1 pt-14">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
          <Link
            href="/dmca"
            className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to DMCA Policy
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Submit DMCA Takedown Request
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              If you are a copyright owner or authorized to act on behalf of one,
              use this form to submit a takedown request for content that infringes
              your copyright on OpenFans.
            </p>
          </div>

          {submitted ? (
            <Card className="border-gray-200 bg-white">
              <CardContent className="p-12 text-center">
                <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Request Submitted Successfully
                </h2>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  Your DMCA takedown request has been received. We will review it
                  and respond within 2 business days. You will receive updates at
                  the email address provided.
                </p>
                <Link href="/dmca">
                  <Button className="mt-6 bg-[#00AFF0] hover:bg-[#0090c0] text-white">
                    Return to DMCA Policy
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-gray-200 bg-white">
              <CardContent className="p-6 sm:p-8">
                {errorMessage && (
                  <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    {errorMessage}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Honeypot field - hidden from real users */}
                  <div className="absolute -left-[9999px]" aria-hidden="true">
                    <label htmlFor="website">Website</label>
                    <input
                      type="text"
                      id="website"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      value={form.website}
                      onChange={(e) => updateField("website", e.target.value)}
                    />
                  </div>

                  {/* Complainant Name */}
                  <div>
                    <label
                      htmlFor="complainant_name"
                      className="block text-sm font-medium text-gray-900"
                    >
                      Full Legal Name <span className="text-red-500">*</span>
                    </label>
                    <p className="mt-1 text-xs text-gray-400">
                      The name of the copyright owner or authorized representative.
                    </p>
                    <input
                      type="text"
                      id="complainant_name"
                      value={form.complainant_name}
                      onChange={(e) => updateField("complainant_name", e.target.value)}
                      placeholder="John Doe"
                      maxLength={200}
                      className="mt-2 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#00AFF0]/50 focus:ring-2 focus:ring-[#00AFF0]/20 focus:outline-none"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="complainant_email"
                      className="block text-sm font-medium text-gray-900"
                    >
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <p className="mt-1 text-xs text-gray-400">
                      We will use this to communicate about your request.
                    </p>
                    <input
                      type="email"
                      id="complainant_email"
                      value={form.complainant_email}
                      onChange={(e) => updateField("complainant_email", e.target.value)}
                      placeholder="your@email.com"
                      className="mt-2 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#00AFF0]/50 focus:ring-2 focus:ring-[#00AFF0]/20 focus:outline-none"
                    />
                  </div>

                  {/* Copyrighted Work */}
                  <div>
                    <label
                      htmlFor="copyrighted_work"
                      className="block text-sm font-medium text-gray-900"
                    >
                      Description of Copyrighted Work <span className="text-red-500">*</span>
                    </label>
                    <p className="mt-1 text-xs text-gray-400">
                      Identify the copyrighted work that you claim has been infringed.
                      If multiple works, provide a representative list.
                    </p>
                    <textarea
                      id="copyrighted_work"
                      value={form.copyrighted_work}
                      onChange={(e) => updateField("copyrighted_work", e.target.value)}
                      placeholder="Describe the original copyrighted work(s)..."
                      rows={4}
                      maxLength={10000}
                      className="mt-2 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#00AFF0]/50 focus:ring-2 focus:ring-[#00AFF0]/20 focus:outline-none resize-none"
                    />
                  </div>

                  {/* Infringing URLs */}
                  <div>
                    <label
                      htmlFor="infringing_urls"
                      className="block text-sm font-medium text-gray-900"
                    >
                      Infringing Content URL(s) <span className="text-red-500">*</span>
                    </label>
                    <p className="mt-1 text-xs text-gray-400">
                      Provide the URL(s) on OpenFans where the infringing content is located.
                      One URL per line.
                    </p>
                    <textarea
                      id="infringing_urls"
                      value={form.infringing_urls}
                      onChange={(e) => updateField("infringing_urls", e.target.value)}
                      placeholder={"https://openfans.online/creator/username/post/123\nhttps://openfans.online/creator/username/post/456"}
                      rows={3}
                      maxLength={10000}
                      className="mt-2 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#00AFF0]/50 focus:ring-2 focus:ring-[#00AFF0]/20 focus:outline-none resize-none font-mono text-xs"
                    />
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-200" />

                  {/* Good Faith Statement */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="good_faith"
                      checked={form.good_faith}
                      onChange={(e) => updateField("good_faith", e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-[#00AFF0] focus:ring-[#00AFF0]/20"
                    />
                    <label htmlFor="good_faith" className="text-sm text-gray-600">
                      <span className="font-medium text-gray-900">Good Faith Statement</span>{" "}
                      <span className="text-red-500">*</span>
                      <br />
                      I have a good faith belief that the use of the material described
                      above is not authorized by the copyright owner, its agent, or the law
                      (e.g., as a fair use).
                    </label>
                  </div>

                  {/* Accuracy Statement */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="accuracy_statement"
                      checked={form.accuracy_statement}
                      onChange={(e) => updateField("accuracy_statement", e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-[#00AFF0] focus:ring-[#00AFF0]/20"
                    />
                    <label htmlFor="accuracy_statement" className="text-sm text-gray-600">
                      <span className="font-medium text-gray-900">Accuracy Under Penalty of Perjury</span>{" "}
                      <span className="text-red-500">*</span>
                      <br />
                      I swear, under penalty of perjury, that the information in this
                      notification is accurate and that I am the copyright owner, or am
                      authorized to act on behalf of the owner of an exclusive right that
                      is allegedly infringed.
                    </label>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-200" />

                  {/* Electronic Signature */}
                  <div>
                    <label
                      htmlFor="signature"
                      className="block text-sm font-medium text-gray-900"
                    >
                      Electronic Signature <span className="text-red-500">*</span>
                    </label>
                    <p className="mt-1 text-xs text-gray-400">
                      Type your full legal name as your electronic signature.
                    </p>
                    <input
                      type="text"
                      id="signature"
                      value={form.signature}
                      onChange={(e) => updateField("signature", e.target.value)}
                      placeholder="Type your full legal name"
                      maxLength={200}
                      className="mt-2 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#00AFF0]/50 focus:ring-2 focus:ring-[#00AFF0]/20 focus:outline-none italic"
                    />
                  </div>

                  {/* Warning notice */}
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-amber-700">
                        <strong>Important:</strong> Knowingly submitting a materially
                        false DMCA takedown notice may subject you to liability for
                        damages, including costs and attorney&apos;s fees, under 17 U.S.C.
                        &sect; 512(f).
                      </p>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-[#00AFF0] hover:bg-[#0090c0] text-white py-3 text-sm font-medium"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit DMCA Takedown Request"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
