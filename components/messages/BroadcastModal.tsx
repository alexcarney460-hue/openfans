"use client";

import { useState, useEffect, useCallback } from "react";
import { Megaphone, X, Send, AlertCircle, CheckCircle2 } from "lucide-react";

interface BroadcastModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

type ModalState = "idle" | "loading" | "confirming" | "sending" | "success" | "error";

export default function BroadcastModal({ isOpen, onClose }: BroadcastModalProps) {
  const [body, setBody] = useState("");
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
  const [modalState, setModalState] = useState<ModalState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [sentCount, setSentCount] = useState(0);

  // Fetch subscriber count when modal opens
  useEffect(() => {
    if (!isOpen) return;

    setBody("");
    setModalState("loading");
    setErrorMessage("");
    setSentCount(0);

    fetch("/api/messages/broadcast")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch subscriber count");
        return res.json();
      })
      .then((json) => {
        setSubscriberCount(json.data?.subscriber_count ?? 0);
        setModalState("idle");
      })
      .catch(() => {
        setErrorMessage("Could not load subscriber count. You may not be a creator.");
        setModalState("error");
      });
  }, [isOpen]);

  const handleBodyChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setBody(e.target.value);
    },
    [],
  );

  const handleConfirm = useCallback(() => {
    if (!body.trim() || !subscriberCount) return;
    setModalState("confirming");
  }, [body, subscriberCount]);

  const handleCancel = useCallback(() => {
    setModalState("idle");
  }, []);

  const handleSend = useCallback(async () => {
    setModalState("sending");
    setErrorMessage("");

    try {
      const res = await fetch("/api/messages/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim() }),
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorMessage(json.error || "Failed to send broadcast");
        setModalState("error");
        return;
      }

      setSentCount(json.data?.sent_count ?? 0);
      setModalState("success");
    } catch {
      setErrorMessage("Network error. Please try again.");
      setModalState("error");
    }
  }, [body]);

  const handleClose = useCallback(() => {
    if (modalState === "sending") return; // Prevent closing while sending
    setBody("");
    setModalState("idle");
    setErrorMessage("");
    onClose();
  }, [modalState, onClose]);

  if (!isOpen) return null;

  const charCount = body.length;
  const isOverLimit = charCount > 2000;
  const canSend = body.trim().length > 0 && !isOverLimit && subscriberCount != null && subscriberCount > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00AFF0]/10">
              <Megaphone className="h-4.5 w-4.5 text-[#00AFF0]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Broadcast Message</h3>
              {modalState === "loading" ? (
                <p className="text-xs text-gray-400">Loading subscribers...</p>
              ) : subscriberCount != null ? (
                <p className="text-xs text-gray-500">
                  Will be sent to{" "}
                  <span className="font-medium text-[#00AFF0]">{subscriberCount}</span>{" "}
                  active subscriber{subscriberCount === 1 ? "" : "s"}
                </p>
              ) : null}
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={modalState === "sending"}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {/* Success State */}
          {modalState === "success" && (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                <CheckCircle2 className="h-7 w-7 text-emerald-500" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900">Broadcast Sent</h4>
              <p className="mt-1.5 text-sm text-gray-500">
                Your message was sent to {sentCount} subscriber{sentCount === 1 ? "" : "s"}.
              </p>
              <button
                onClick={handleClose}
                className="mt-6 rounded-xl bg-[#00AFF0] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#009dd8]"
              >
                Done
              </button>
            </div>
          )}

          {/* Error State */}
          {modalState === "error" && (
            <div className="flex flex-col items-center py-4 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
              <p className="text-sm text-red-600">{errorMessage}</p>
              <button
                onClick={() => setModalState("idle")}
                className="mt-4 text-sm text-[#00AFF0] hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Confirmation State */}
          {modalState === "confirming" && (
            <div className="py-2">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-medium text-amber-800">
                  Are you sure you want to send this broadcast?
                </p>
                <p className="mt-1 text-xs text-amber-600">
                  This will send a message to {subscriberCount} subscriber{subscriberCount === 1 ? "" : "s"}.
                  This action cannot be undone.
                </p>
              </div>

              <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{body.trim()}</p>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  className="flex-1 rounded-xl bg-[#00AFF0] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#009dd8]"
                >
                  Send Broadcast
                </button>
              </div>
            </div>
          )}

          {/* Default compose state */}
          {(modalState === "idle" || modalState === "loading") && (
            <>
              <textarea
                value={body}
                onChange={handleBodyChange}
                placeholder="Write your broadcast message..."
                maxLength={2100}
                rows={6}
                disabled={modalState === "loading"}
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-[#00AFF0]/50 focus:ring-1 focus:ring-[#00AFF0]/25 disabled:opacity-50"
                aria-label="Broadcast message body"
              />

              <div className="mt-2 flex items-center justify-between">
                <p className={`text-[11px] ${isOverLimit ? "text-red-500 font-medium" : "text-gray-400"}`}>
                  {charCount}/2000
                </p>
                {subscriberCount === 0 && modalState !== "loading" && (
                  <p className="text-xs text-amber-600">No active subscribers</p>
                )}
              </div>
            </>
          )}

          {/* Sending state */}
          {modalState === "sending" && (
            <div className="flex flex-col items-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#00AFF0]" />
              <p className="mt-3 text-sm text-gray-500">Sending broadcast...</p>
            </div>
          )}
        </div>

        {/* Footer - only show for compose state */}
        {(modalState === "idle" || modalState === "loading") && (
          <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
            <button
              onClick={handleClose}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!canSend || modalState === "loading"}
              className="flex items-center gap-2 rounded-xl bg-[#00AFF0] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#009dd8] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
              Send to all subscribers
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
