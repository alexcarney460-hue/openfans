"use client";

import { useState, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Loader2, Calendar, AlertCircle } from "lucide-react";

interface ScheduleStreamModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onCreated: () => void;
}

interface ToggleSwitchProps {
  readonly enabled: boolean;
  readonly onToggle: () => void;
  readonly id: string;
  readonly label: string;
  readonly description?: string;
}

function ToggleSwitch({ enabled, onToggle, id, label, description }: ToggleSwitchProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <label htmlFor={id} className="text-sm font-medium text-foreground cursor-pointer">
          {label}
        </label>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <button
        id={id}
        role="switch"
        type="button"
        aria-checked={enabled}
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
          enabled ? "bg-[#00AFF0]" : "bg-gray-300"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

export default function ScheduleStreamModal({ open, onClose, onCreated }: ScheduleStreamModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [subscriberOnly, setSubscriberOnly] = useState(false);
  const [chatEnabled, setChatEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setScheduledAt("");
    setSubscriberOnly(false);
    setChatEnabled(true);
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    if (!scheduledAt) {
      setError("Please select a date and time.");
      return;
    }

    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate <= new Date()) {
      setError("Scheduled time must be in the future.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/streams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          scheduled_at: scheduledDate.toISOString(),
          subscriber_only: subscriberOnly,
          chat_enabled: chatEnabled,
          status: "scheduled",
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error ?? "Failed to schedule stream.");
      }

      resetForm();
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule stream.");
    } finally {
      setLoading(false);
    }
  }, [title, description, scheduledAt, subscriberOnly, chatEnabled, resetForm, onCreated, onClose]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) {
        handleClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, loading, handleClose]);

  if (!open) return null;

  // Minimum datetime value: now + 5 minutes
  const minDateTime = new Date(Date.now() + 5 * 60 * 1000)
    .toISOString()
    .slice(0, 16);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <Card className="relative z-10 w-full max-w-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-6 pb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#00AFF0]" />
            <h2 className="text-lg font-semibold text-foreground">Schedule Stream</h2>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-gray-100 hover:text-foreground"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Error message */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="stream-title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="stream-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's your stream about?"
              maxLength={150}
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="stream-description">Description</Label>
            <textarea
              id="stream-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell viewers what to expect (optional)"
              maxLength={500}
              rows={3}
              disabled={loading}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/500
            </p>
          </div>

          {/* Date/Time */}
          <div className="space-y-2">
            <Label htmlFor="stream-datetime">
              Date & Time <span className="text-red-500">*</span>
            </Label>
            <Input
              id="stream-datetime"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              min={minDateTime}
              disabled={loading}
            />
          </div>

          {/* Toggles */}
          <div className="border-t border-gray-200 pt-4 space-y-1">
            <ToggleSwitch
              id="subscriber-only"
              enabled={subscriberOnly}
              onToggle={() => setSubscriberOnly((prev) => !prev)}
              label="Subscriber-only"
              description="Only subscribers can watch this stream"
            />
            <ToggleSwitch
              id="chat-enabled"
              enabled={chatEnabled}
              onToggle={() => setChatEnabled((prev) => !prev)}
              label="Chat enabled"
              description="Allow viewers to send chat messages"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#00AFF0] text-white hover:bg-[#00AFF0]/90"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scheduling...
                </>
              ) : (
                "Schedule Stream"
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
