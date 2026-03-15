"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Tag,
  Plus,
  Copy,
  CheckCircle2,
  Clock,
  Percent,
  Calendar,
  X,
  ToggleLeft,
  ToggleRight,
  Users,
  Zap,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Promotion {
  readonly id: number;
  readonly creator_id: string;
  readonly code: string;
  readonly type: "discount" | "free_trial";
  readonly discount_percent: number | null;
  readonly trial_days: number | null;
  readonly max_uses: number | null;
  readonly current_uses: number;
  readonly expires_at: string | null;
  readonly is_active: boolean;
  readonly created_at: string;
}

type ModalState =
  | { readonly open: false }
  | { readonly open: true };

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#00AFF0]" />
    </div>
  );
}

// ─── Create Promotion Modal ─────────────────────────────────────────────────

interface CreateModalProps {
  readonly onClose: () => void;
  readonly onCreated: (promo: Promotion) => void;
}

function CreatePromotionModal({ onClose, onCreated }: CreateModalProps) {
  const [code, setCode] = useState(generateCode());
  const [type, setType] = useState<"discount" | "free_trial">("discount");
  const [discountPercent, setDiscountPercent] = useState(20);
  const [trialDays, setTrialDays] = useState(7);
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    setSaving(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        code,
        type,
      };

      if (type === "discount") {
        payload.discount_percent = discountPercent;
      } else {
        payload.trial_days = trialDays;
      }

      if (maxUses.trim()) {
        const parsed = parseInt(maxUses, 10);
        if (isNaN(parsed) || parsed < 1) {
          setError("Max uses must be a positive number");
          setSaving(false);
          return;
        }
        payload.max_uses = parsed;
      }

      if (expiresAt) {
        payload.expires_at = new Date(expiresAt).toISOString();
      }

      const res = await fetch("/api/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Failed to create promotion");
        setSaving(false);
        return;
      }

      onCreated(json.data);
    } catch {
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  }, [code, type, discountPercent, trialDays, maxUses, expiresAt, onCreated]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-lg font-bold text-gray-900">Create Promotion</h3>
        <p className="mt-1 text-sm text-gray-500">
          Offer discounts or free trials to attract new subscribers
        </p>

        <div className="mt-5 space-y-4">
          {/* Promo Code */}
          <div>
            <label className="block text-xs font-medium text-gray-600">
              Promo Code
            </label>
            <div className="mt-1 flex gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={20}
                className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-mono text-gray-900 focus:border-[#00AFF0] focus:outline-none focus:ring-1 focus:ring-[#00AFF0]"
                placeholder="SUMMER20"
              />
              <button
                onClick={() => setCode(generateCode())}
                className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
              >
                Generate
              </button>
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-gray-600">
              Type
            </label>
            <div className="mt-1 flex gap-2">
              <button
                onClick={() => setType("discount")}
                className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                  type === "discount"
                    ? "border-[#00AFF0] bg-[#00AFF0]/10 text-[#00AFF0]"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Percent className="mb-1 inline h-4 w-4" /> Discount
              </button>
              <button
                onClick={() => setType("free_trial")}
                className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                  type === "free_trial"
                    ? "border-[#00AFF0] bg-[#00AFF0]/10 text-[#00AFF0]"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Zap className="mb-1 inline h-4 w-4" /> Free Trial
              </button>
            </div>
          </div>

          {/* Discount Percent or Trial Days */}
          {type === "discount" ? (
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Discount Percentage
              </label>
              <div className="mt-1 flex items-center gap-3">
                <input
                  type="range"
                  min={10}
                  max={90}
                  step={5}
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(parseInt(e.target.value, 10))}
                  className="flex-1 accent-[#00AFF0]"
                />
                <span className="w-12 text-center text-sm font-bold text-gray-900">
                  {discountPercent}%
                </span>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Trial Duration (days)
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={trialDays}
                onChange={(e) =>
                  setTrialDays(
                    Math.max(1, Math.min(30, parseInt(e.target.value, 10) || 1)),
                  )
                }
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-[#00AFF0] focus:outline-none focus:ring-1 focus:ring-[#00AFF0]"
              />
            </div>
          )}

          {/* Max Uses */}
          <div>
            <label className="block text-xs font-medium text-gray-600">
              Max Uses{" "}
              <span className="text-gray-400">(optional, leave empty for unlimited)</span>
            </label>
            <input
              type="number"
              min={1}
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="Unlimited"
              className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-[#00AFF0] focus:outline-none focus:ring-1 focus:ring-[#00AFF0]"
            />
          </div>

          {/* Expiry Date */}
          <div>
            <label className="block text-xs font-medium text-gray-600">
              Expiry Date{" "}
              <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-[#00AFF0] focus:outline-none focus:ring-1 focus:ring-[#00AFF0]"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5">
              <p className="text-xs text-red-500">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#00AFF0] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#009ad6] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Create Promotion
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function PromotionsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [modalState, setModalState] = useState<ModalState>({ open: false });
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Fetch promotions on mount
  useEffect(() => {
    fetch("/api/promotions")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((json) => {
        setPromotions(json.data ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load promotions. Please try again.");
        setLoading(false);
      });
  }, []);

  const handleCopyLink = useCallback(
    async (promo: Promotion) => {
      // We need the creator's username for the promo link
      // For now, construct based on window location
      const link = `${window.location.origin}/?promo=${promo.code}`;
      await navigator.clipboard.writeText(link);
      setCopiedId(promo.id);
      setTimeout(() => setCopiedId(null), 2000);
    },
    [],
  );

  const handleToggle = useCallback(
    async (promo: Promotion) => {
      setTogglingId(promo.id);
      try {
        const res = await fetch("/api/promotions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: promo.id, is_active: !promo.is_active }),
        });
        if (res.ok) {
          const json = await res.json();
          setPromotions((prev) =>
            prev.map((p) => (p.id === promo.id ? json.data : p)),
          );
        }
      } catch {
        // Silently handle toggle failures
      } finally {
        setTogglingId(null);
      }
    },
    [],
  );

  const handleCreated = useCallback((newPromo: Promotion) => {
    setPromotions((prev) => [newPromo, ...prev]);
    setModalState({ open: false });
  }, []);

  if (loading) return <LoadingSpinner />;

  const activeCount = promotions.filter((p) => p.is_active).length;
  const totalUses = promotions.reduce((sum, p) => sum + p.current_uses, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotions</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create promo codes to offer discounts and free trials
          </p>
        </div>
        <button
          onClick={() => setModalState({ open: true })}
          className="flex items-center gap-2 rounded-lg bg-[#00AFF0] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#009ad6]"
        >
          <Plus className="h-4 w-4" />
          Create Promotion
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-4">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00AFF0]/10">
              <Tag className="h-5 w-5 text-[#00AFF0]" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400">Total Promos</p>
              <p className="text-2xl font-bold text-gray-900">
                {promotions.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400">Active</p>
              <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
              <Users className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400">Total Uses</p>
              <p className="text-2xl font-bold text-gray-900">{totalUses}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Promotions List */}
      <div className="rounded-xl border border-gray-200 bg-white">
        {promotions.length === 0 ? (
          <div className="py-16 text-center">
            <Tag className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-500">
              No promotions yet
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Create your first promo code to attract new subscribers
            </p>
            <button
              onClick={() => setModalState({ open: true })}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#00AFF0] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#009ad6]"
            >
              <Plus className="h-4 w-4" />
              Create Promotion
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {promotions.map((promo) => {
              const isExpired =
                promo.expires_at &&
                new Date(promo.expires_at).getTime() < Date.now();
              const isMaxed =
                promo.max_uses !== null &&
                promo.current_uses >= promo.max_uses;

              return (
                <div
                  key={promo.id}
                  className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-gray-50 ${
                    !promo.is_active || isExpired || isMaxed ? "opacity-60" : ""
                  }`}
                >
                  {/* Type icon */}
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
                      promo.type === "discount"
                        ? "bg-[#00AFF0]/10"
                        : "bg-purple-500/10"
                    }`}
                  >
                    {promo.type === "discount" ? (
                      <Percent className="h-5 w-5 text-[#00AFF0]" />
                    ) : (
                      <Zap className="h-5 w-5 text-purple-500" />
                    )}
                  </div>

                  {/* Code + details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-bold text-gray-900">
                        {promo.code}
                      </code>
                      {promo.type === "discount" && (
                        <span className="rounded-full bg-[#00AFF0]/10 px-2 py-0.5 text-xs font-medium text-[#00AFF0]">
                          {promo.discount_percent}% off
                        </span>
                      )}
                      {promo.type === "free_trial" && (
                        <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-600">
                          {promo.trial_days} day trial
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {promo.current_uses}
                        {promo.max_uses ? ` / ${promo.max_uses}` : ""} uses
                      </span>
                      {promo.expires_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {isExpired ? "Expired" : `Expires ${formatDate(promo.expires_at)}`}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Created {formatDate(promo.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Status badge */}
                  <span
                    className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      !promo.is_active || isExpired || isMaxed
                        ? "bg-gray-100 text-gray-500"
                        : "bg-green-500/10 text-green-600"
                    }`}
                  >
                    {isExpired
                      ? "Expired"
                      : isMaxed
                      ? "Maxed"
                      : promo.is_active
                      ? "Active"
                      : "Inactive"}
                  </span>

                  {/* Actions */}
                  <div className="flex flex-shrink-0 items-center gap-1">
                    {/* Copy link */}
                    <button
                      onClick={() => handleCopyLink(promo)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                      aria-label="Copy promo link"
                      title="Copy promo link"
                    >
                      {copiedId === promo.id ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>

                    {/* Toggle active */}
                    <button
                      onClick={() => handleToggle(promo)}
                      disabled={togglingId === promo.id}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed"
                      aria-label={promo.is_active ? "Deactivate" : "Activate"}
                      title={promo.is_active ? "Deactivate" : "Activate"}
                    >
                      {promo.is_active ? (
                        <ToggleRight className="h-5 w-5 text-green-500" />
                      ) : (
                        <ToggleLeft className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {modalState.open && (
        <CreatePromotionModal
          onClose={() => setModalState({ open: false })}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
