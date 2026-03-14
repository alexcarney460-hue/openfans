"use client";

import { useEffect, useState, useCallback } from "react";
import {
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Users,
  ShieldX,
  ShieldCheck,
  Search,
  UserX,
  UserCheck,
  AlertTriangle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface User {
  id: string;
  username: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  role: string;
  is_suspended: boolean;
  suspended_at: string | null;
  suspension_reason: string | null;
  created_at: string;
}

type StatusFilter = "all" | "active" | "suspended";

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

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  subValue,
  icon: Icon,
  accentColor,
}: {
  label: string;
  value: string;
  subValue?: string;
  icon: typeof Users;
  accentColor: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-xl font-bold text-gray-900 sm:text-2xl">{value}</p>
      <p className="mt-0.5 text-xs text-gray-500">{label}</p>
      {subValue && (
        <p className="mt-1 text-xs font-medium" style={{ color: accentColor }}>
          {subValue}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Suspend Modal
// ---------------------------------------------------------------------------

function SuspendModal({
  user,
  onConfirm,
  onCancel,
  processing,
}: {
  user: User;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  processing: boolean;
}) {
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <h3 className="text-sm font-bold text-gray-900">Suspend User</h3>
        </div>

        <p className="mt-4 text-sm text-gray-600">
          Suspend{" "}
          <span className="font-semibold text-gray-900">
            @{user.username}
          </span>
          ? They will be blocked from accessing the platform.
        </p>

        <div className="mt-4">
          <label
            htmlFor="suspend-reason"
            className="block text-xs font-medium text-gray-700"
          >
            Reason (required)
          </label>
          <textarea
            id="suspend-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter suspension reason..."
            rows={3}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#00AFF0] focus:outline-none focus:ring-1 focus:ring-[#00AFF0]"
          />
        </div>

        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            disabled={processing}
            className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={processing || reason.trim().length === 0}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Suspending...
              </>
            ) : (
              "Suspend"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Unsuspend Confirm Modal
// ---------------------------------------------------------------------------

function UnsuspendModal({
  user,
  onConfirm,
  onCancel,
  processing,
}: {
  user: User;
  onConfirm: () => void;
  onCancel: () => void;
  processing: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
          </div>
          <h3 className="text-sm font-bold text-gray-900">Unsuspend User</h3>
        </div>

        <p className="mt-4 text-sm text-gray-600">
          Restore access for{" "}
          <span className="font-semibold text-gray-900">
            @{user.username}
          </span>
          ? They will be able to use the platform again.
        </p>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            disabled={processing}
            className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={processing}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Restoring...
              </>
            ) : (
              "Unsuspend"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [suspendTarget, setSuspendTarget] = useState<User | null>(null);
  const [unsuspendTarget, setUnsuspendTarget] = useState<User | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? `Error ${res.status}`);
        return;
      }
      const json = await res.json();
      setUsers(json.data.users);
    } catch {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Auto-dismiss toast messages
  useEffect(() => {
    if (successMessage) {
      const t = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(t);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const t = setTimeout(() => setErrorMessage(null), 6000);
      return () => clearTimeout(t);
    }
  }, [errorMessage]);

  // ---- Suspend handler ----
  const handleSuspend = async (user: User, reason: string) => {
    setSuspendTarget(null);
    setProcessingId(user.id);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "suspend", reason }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMessage(json.error ?? "Failed to suspend user");
        return;
      }
      setSuccessMessage(`@${user.username} has been suspended`);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, is_suspended: true, suspension_reason: reason, suspended_at: new Date().toISOString() }
            : u,
        ),
      );
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  // ---- Unsuspend handler ----
  const handleUnsuspend = async (user: User) => {
    setUnsuspendTarget(null);
    setProcessingId(user.id);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unsuspend" }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMessage(json.error ?? "Failed to unsuspend user");
        return;
      }
      setSuccessMessage(`@${user.username} has been unsuspended`);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, is_suspended: false, suspension_reason: null, suspended_at: null }
            : u,
        ),
      );
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  // ---- Computed summary stats ----
  const totalUsers = users.length;
  const activeCount = users.filter((u) => !u.is_suspended).length;
  const suspendedCount = users.filter((u) => u.is_suspended).length;
  const adminCount = users.filter((u) => u.role === "admin").length;

  // ---- Filter tabs ----
  const filterTabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: "all", label: "All", count: totalUsers },
    { key: "active", label: "Active", count: activeCount },
    { key: "suspended", label: "Suspended", count: suspendedCount },
  ];

  // ---- Role badge ----
  function roleBadge(role: string) {
    switch (role) {
      case "admin":
        return (
          <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-[11px] font-medium text-purple-700">
            Admin
          </span>
        );
      case "creator":
        return (
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-medium text-blue-700">
            Creator
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-500">
            Subscriber
          </span>
        );
    }
  }

  // ---- Loading state ----
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900 sm:text-xl">
            User Management
          </h1>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl border border-gray-200 bg-gray-50"
            />
          ))}
        </div>
        <div className="h-10 w-80 animate-pulse rounded-lg bg-gray-50" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-lg border border-gray-200 bg-gray-50"
            />
          ))}
        </div>
      </div>
    );
  }

  // ---- Error state ----
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-red-400">{error}</p>
        <button
          onClick={fetchUsers}
          className="mt-3 text-sm font-medium text-[#00AFF0] hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Modals */}
      {suspendTarget && (
        <SuspendModal
          user={suspendTarget}
          onConfirm={(reason) => handleSuspend(suspendTarget, reason)}
          onCancel={() => setSuspendTarget(null)}
          processing={processingId === suspendTarget.id}
        />
      )}
      {unsuspendTarget && (
        <UnsuspendModal
          user={unsuspendTarget}
          onConfirm={() => handleUnsuspend(unsuspendTarget)}
          onCancel={() => setUnsuspendTarget(null)}
          processing={processingId === unsuspendTarget.id}
        />
      )}

      {/* Toast messages */}
      {successMessage && (
        <div className="fixed right-4 top-20 z-50 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-lg">
          <CheckCircle2 className="h-4 w-4" />
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="fixed right-4 top-20 z-50 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-lg">
          <XCircle className="h-4 w-4" />
          {errorMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 sm:text-xl">
            User Management
          </h1>
          <p className="text-xs text-gray-500">
            View all users and manage account suspensions
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Users"
          value={String(totalUsers)}
          icon={Users}
          accentColor="#2563eb"
        />
        <StatCard
          label="Active Users"
          value={String(activeCount)}
          icon={UserCheck}
          accentColor="#059669"
        />
        <StatCard
          label="Suspended Users"
          value={String(suspendedCount)}
          subValue={
            totalUsers > 0
              ? `${Math.round((suspendedCount / totalUsers) * 100)}% of users`
              : undefined
          }
          icon={UserX}
          accentColor="#dc2626"
        />
        <StatCard
          label="Admins"
          value={String(adminCount)}
          icon={ShieldCheck}
          accentColor="#7c3aed"
        />
      </div>

      {/* Filter Tabs + Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === tab.key
                  ? "bg-[#00AFF0]/15 text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-[10px] text-gray-400">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative max-w-sm sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by username or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#00AFF0] focus:outline-none focus:ring-1 focus:ring-[#00AFF0]"
          />
        </div>
      </div>

      {/* Users Table */}
      {users.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16">
          <Users className="h-8 w-8 text-gray-300" />
          <p className="mt-3 text-sm text-gray-400">
            {searchQuery ? "No users match your search" : "No users found"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-gray-400">
                  User
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-gray-400">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-gray-400">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-gray-400">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-gray-400">
                  Joined
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-gray-400">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="transition-colors hover:bg-gray-50/50"
                >
                  {/* User */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {u.avatar_url ? (
                        <img
                          src={u.avatar_url}
                          alt={u.display_name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-500">
                          {u.display_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {u.display_name}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          @{u.username}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">{u.email}</span>
                  </td>

                  {/* Role */}
                  <td className="px-4 py-3">{roleBadge(u.role)}</td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    {u.is_suspended ? (
                      <div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-medium text-red-700">
                          <ShieldX className="h-3 w-3" />
                          Suspended
                        </span>
                        {u.suspension_reason && (
                          <p className="mt-1 max-w-[200px] truncate text-[10px] text-gray-400" title={u.suspension_reason}>
                            {u.suspension_reason}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                        Active
                      </span>
                    )}
                  </td>

                  {/* Joined */}
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-500">
                      {timeAgo(u.created_at)}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3 text-right">
                    {u.role === "admin" ? (
                      <span className="text-[11px] text-gray-300">--</span>
                    ) : u.is_suspended ? (
                      <button
                        onClick={() => setUnsuspendTarget(u)}
                        disabled={processingId === u.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-100 disabled:opacity-50"
                      >
                        {processingId === u.id ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          "Unsuspend"
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => setSuspendTarget(u)}
                        disabled={processingId === u.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                      >
                        {processingId === u.id ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          "Suspend"
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
