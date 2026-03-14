"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Bell,
  DollarSign,
  MessageSquare,
  UserPlus,
  Clock,
  CheckCircle,
  Unlock,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ──────────────────────────────────────────────────────────────────

type NotificationType =
  | "new_subscriber"
  | "new_tip"
  | "new_message"
  | "subscription_expiring"
  | "payout_completed"
  | "ppv_purchase";

interface Notification {
  readonly id: number;
  readonly type: NotificationType;
  readonly title: string;
  readonly body: string | null;
  readonly is_read: boolean;
  readonly reference_id: string | null;
  readonly created_at: string;
}

// ─── Icon Mapping ───────────────────────────────────────────────────────────

const ICON_MAP: Record<NotificationType, typeof Bell> = {
  new_subscriber: UserPlus,
  new_tip: DollarSign,
  new_message: MessageSquare,
  subscription_expiring: Clock,
  payout_completed: CheckCircle,
  ppv_purchase: Unlock,
};

const ICON_COLOR_MAP: Record<NotificationType, string> = {
  new_subscriber: "text-[#00AFF0] bg-[#00AFF0]/10",
  new_tip: "text-emerald-500 bg-emerald-500/10",
  new_message: "text-[#00AFF0] bg-[#00AFF0]/10",
  subscription_expiring: "text-amber-500 bg-amber-500/10",
  payout_completed: "text-emerald-500 bg-emerald-500/10",
  ppv_purchase: "text-violet-500 bg-violet-500/10",
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Polling interval (ms) ──────────────────────────────────────────────────

const POLL_INTERVAL = 30_000;

// ─── Component ──────────────────────────────────────────────────────────────

interface NotificationBellProps {
  readonly label?: string;
}

export default function NotificationBell({ label }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<readonly Notification[]>(
    [],
  );
  const [open, setOpen] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Fetch unread count (lightweight) ────────────────────────────────────

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?count_only=true");
      if (res.ok) {
        const json = await res.json();
        setUnreadCount(json.data?.unread_count ?? 0);
      }
    } catch {
      // Silently ignore polling failures
    }
  }, []);

  // ── Poll unread count every 30s ─────────────────────────────────────────

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // ── Fetch recent notifications when dropdown opens ──────────────────────

  const fetchNotifications = useCallback(async () => {
    setLoadingNotifs(true);
    try {
      const res = await fetch("/api/notifications?limit=8");
      if (res.ok) {
        const json = await res.json();
        setNotifications(json.data ?? []);
        setUnreadCount(json.unread_count ?? 0);
      }
    } catch {
      // Silently ignore
    } finally {
      setLoadingNotifs(false);
    }
  }, []);

  const handleToggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        fetchNotifications();
      }
      return next;
    });
  }, [fetchNotifications]);

  // ── Close on outside click ──────────────────────────────────────────────

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Close on Escape ─────────────────────────────────────────────────────

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [open]);

  // ── Mark all as read ────────────────────────────────────────────────────

  const handleMarkAllRead = useCallback(async () => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.is_read ? n : { ...n, is_read: true })),
    );
    setUnreadCount(0);

    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
    } catch {
      // Revert on failure
      fetchNotifications();
    }
  }, [fetchNotifications]);

  // ── Mark single as read ─────────────────────────────────────────────────

  const handleMarkRead = useCallback(
    async (id: number) => {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id && !n.is_read ? { ...n, is_read: true } : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: [id] }),
        });
      } catch {
        fetchNotifications();
      }
    },
    [fetchNotifications],
  );

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell trigger */}
      <Button
        variant="ghost"
        size="icon"
        className="relative text-muted-foreground hover:text-foreground"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={handleToggle}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#00AFF0] px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown popover */}
      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-[380px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
          role="dialog"
          aria-label="Notifications"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-[#00AFF0] px-2 py-0.5 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[#00AFF0] transition-colors hover:bg-[#00AFF0]/10"
              >
                <Check className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-[400px] overflow-y-auto">
            {loadingNotifs ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-[#00AFF0]" />
              </div>
            ) : notifications.length > 0 ? (
              <div role="list" aria-label="Recent notifications">
                {notifications.map((notification) => {
                  const IconComponent = ICON_MAP[notification.type];
                  const iconColors = ICON_COLOR_MAP[notification.type];

                  return (
                    <button
                      key={notification.id}
                      onClick={() => handleMarkRead(notification.id)}
                      role="listitem"
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                        notification.is_read
                          ? "hover:bg-gray-50"
                          : "bg-[#00AFF0]/[0.04] hover:bg-[#00AFF0]/[0.07]"
                      }`}
                    >
                      {/* Icon */}
                      <div
                        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${iconColors}`}
                      >
                        <IconComponent className="h-4 w-4" />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm leading-snug ${
                            notification.is_read
                              ? "text-gray-600"
                              : "font-medium text-gray-900"
                          }`}
                        >
                          {notification.title}
                        </p>
                        {notification.body && (
                          <p className="mt-0.5 truncate text-xs text-gray-500">
                            {notification.body}
                          </p>
                        )}
                        <p className="mt-0.5 text-[11px] text-gray-400">
                          {timeAgo(notification.created_at)}
                        </p>
                      </div>

                      {/* Unread dot */}
                      {!notification.is_read && (
                        <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-[#00AFF0]" />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10">
                <Bell className="mb-2 h-8 w-8 text-gray-300" />
                <p className="text-sm text-gray-400">No notifications yet</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100">
            <Link
              href="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center py-2.5 text-xs font-medium text-[#00AFF0] transition-colors hover:bg-gray-50"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
