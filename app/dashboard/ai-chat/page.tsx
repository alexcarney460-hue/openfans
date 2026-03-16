"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  Plus,
  MessageSquare,
  Users,
  DollarSign,
  Pencil,
  Power,
  Eye,
  Loader2,
  X,
  Save,
  AlertCircle,
} from "lucide-react";

interface Persona {
  id: string;
  creator_id: string;
  name: string;
  personality: string;
  system_prompt: string;
  avatar_url: string | null;
  greeting_message: string;
  price_per_message: number;
  is_active: boolean;
  total_conversations: number;
  total_messages: number;
  total_revenue_usdc: number;
  created_at: string;
  updated_at: string;
}

interface PersonaFormData {
  name: string;
  personality: string;
  system_prompt: string;
  avatar_url: string;
  greeting_message: string;
  price_per_message: number;
}

const EMPTY_FORM: PersonaFormData = {
  name: "",
  personality: "",
  system_prompt: "",
  avatar_url: "",
  greeting_message: "Hey! How are you doing? \u{1F495}",
  price_per_message: 50,
};

export default function AiChatDashboard() {
  const router = useRouter();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PersonaFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadPersonas = async () => {
    try {
      const res = await fetch("/api/ai-chat/personas");
      if (!res.ok) {
        const data = await res.json();
        if (data.code === "CREATOR_REQUIRED") {
          setError("Only creators can manage AI personas");
        } else {
          setError(data.error || "Failed to load personas");
        }
        setLoading(false);
        return;
      }
      const { data } = await res.json();
      setPersonas(data);
    } catch {
      setError("Failed to load personas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPersonas();
  }, []);

  const openCreateForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowForm(true);
  };

  const openEditForm = (persona: Persona) => {
    setEditingId(persona.id);
    setForm({
      name: persona.name,
      personality: persona.personality,
      system_prompt: persona.system_prompt,
      avatar_url: persona.avatar_url ?? "",
      greeting_message: persona.greeting_message,
      price_per_message: persona.price_per_message,
    });
    setFormError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    try {
      if (editingId) {
        // Update existing
        const res = await fetch("/api/ai-chat/personas", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingId,
            ...form,
            avatar_url: form.avatar_url || null,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          setFormError(data.error || "Failed to update persona");
          setSaving(false);
          return;
        }
      } else {
        // Create new
        const res = await fetch("/api/ai-chat/personas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            avatar_url: form.avatar_url || null,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          setFormError(data.error || "Failed to create persona");
          setSaving(false);
          return;
        }
      }

      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      await loadPersonas();
    } catch {
      setFormError("An error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (persona: Persona) => {
    try {
      await fetch("/api/ai-chat/personas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: persona.id, is_active: !persona.is_active }),
      });
      setPersonas((prev) =>
        prev.map((p) =>
          p.id === persona.id ? { ...p, is_active: !p.is_active } : p,
        ),
      );
    } catch {
      // Silently fail
    }
  };

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const totalRevenue = personas.reduce((sum, p) => sum + p.total_revenue_usdc, 0);
  const totalMessages = personas.reduce((sum, p) => sum + p.total_messages, 0);
  const totalConversations = personas.reduce((sum, p) => sum + p.total_conversations, 0);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#00AFF0]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Chat Personas</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create AI personas that fans can pay to chat with 24/7
          </p>
        </div>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-2 rounded-lg bg-[#00AFF0] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#00AFF0]/80"
        >
          <Plus className="h-4 w-4" />
          Create Persona
        </button>
      </div>

      {/* Stats overview */}
      {personas.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Revenue</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatPrice(totalRevenue)}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Messages</p>
                <p className="text-lg font-bold text-gray-900">
                  {totalMessages.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Conversations</p>
                <p className="text-lg font-bold text-gray-900">
                  {totalConversations.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Persona list */}
      {personas.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16">
          <Bot className="h-16 w-16 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-700">
            No personas yet
          </h3>
          <p className="mt-1 max-w-sm text-center text-sm text-gray-500">
            Create your first AI persona. Fans will pay per message to chat with it 24/7, generating passive income for you.
          </p>
          <button
            onClick={openCreateForm}
            className="mt-6 flex items-center gap-2 rounded-lg bg-[#00AFF0] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#00AFF0]/80"
          >
            <Plus className="h-4 w-4" />
            Create Your First Persona
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {personas.map((persona) => (
            <div
              key={persona.id}
              className={`rounded-xl border bg-white p-5 transition-all ${
                persona.is_active
                  ? "border-gray-200 hover:border-[#00AFF0]/30 hover:shadow-md"
                  : "border-gray-100 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {persona.avatar_url ? (
                    <img
                      src={persona.avatar_url}
                      alt={persona.name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#00AFF0] to-purple-500 text-lg font-bold text-white">
                      {persona.name[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">{persona.name}</h3>
                    <p className="text-xs text-gray-500">
                      {formatPrice(persona.price_per_message)}/message
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    persona.is_active
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {persona.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                {persona.personality}
              </p>

              {/* Stats */}
              <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {persona.total_conversations} chats
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5" />
                  {persona.total_messages} msgs
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  {formatPrice(persona.total_revenue_usdc)}
                </span>
              </div>

              {/* Actions */}
              <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3">
                <button
                  onClick={() => openEditForm(persona)}
                  className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </button>
                <button
                  onClick={() => toggleActive(persona)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    persona.is_active
                      ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                      : "bg-green-50 text-green-700 hover:bg-green-100"
                  }`}
                >
                  <Power className="h-3 w-3" />
                  {persona.is_active ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() =>
                    window.open(`/ai-chat/${persona.id}`, "_blank")
                  }
                  className="flex items-center gap-1.5 rounded-lg bg-[#00AFF0]/10 px-3 py-1.5 text-xs font-medium text-[#00AFF0] transition-colors hover:bg-[#00AFF0]/20"
                >
                  <Eye className="h-3 w-3" />
                  Preview
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {editingId ? "Edit Persona" : "Create AI Persona"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g. Luna, Sophia, Alex"
                  maxLength={100}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#00AFF0] focus:outline-none focus:ring-1 focus:ring-[#00AFF0]"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Personality *
                </label>
                <textarea
                  value={form.personality}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, personality: e.target.value }))
                  }
                  placeholder="e.g. A flirty, fun, and adventurous 25-year-old model who loves travel and deep conversations"
                  maxLength={500}
                  rows={2}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#00AFF0] focus:outline-none focus:ring-1 focus:ring-[#00AFF0]"
                />
                <p className="mt-0.5 text-xs text-gray-400">
                  {form.personality.length}/500 characters
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  System Prompt *
                </label>
                <textarea
                  value={form.system_prompt}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, system_prompt: e.target.value }))
                  }
                  placeholder="Detailed instructions for how the AI should behave, what topics to discuss, tone of voice, etc."
                  maxLength={2000}
                  rows={4}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#00AFF0] focus:outline-none focus:ring-1 focus:ring-[#00AFF0]"
                />
                <p className="mt-0.5 text-xs text-gray-400">
                  {form.system_prompt.length}/2000 characters
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Avatar URL
                </label>
                <input
                  type="url"
                  value={form.avatar_url}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, avatar_url: e.target.value }))
                  }
                  placeholder="https://..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#00AFF0] focus:outline-none focus:ring-1 focus:ring-[#00AFF0]"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Greeting Message
                </label>
                <input
                  type="text"
                  value={form.greeting_message}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      greeting_message: e.target.value,
                    }))
                  }
                  maxLength={500}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#00AFF0] focus:outline-none focus:ring-1 focus:ring-[#00AFF0]"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Price per Message (cents) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={form.price_per_message}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        price_per_message: parseInt(e.target.value, 10) || 0,
                      }))
                    }
                    min={10}
                    max={10000}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#00AFF0] focus:outline-none focus:ring-1 focus:ring-[#00AFF0]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    = {formatPrice(form.price_per_message || 0)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-gray-400">
                  Min $0.10, max $100.00. You earn 90% ({formatPrice(Math.floor((form.price_per_message || 0) * 0.9))}).
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-[#00AFF0] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#00AFF0]/80 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {editingId ? "Update Persona" : "Create Persona"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
