"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  DollarSign,
  MessageSquare,
  UserPlus,
  Wallet,
  Clock,
  Check,
} from "lucide-react";

interface Notification {
  readonly id: number;
  readonly type: "new_subscriber" | "new_tip" | "new_message" | "subscription_expiring" | "payout_completed";
  readonly title: string;
  readonly body: string | null;
  readonly is_read: boolean;
  readonly reference_id: string | null;
  readonly created_at: string;
}

const ICON_MAP = {
  new_subscriber: UserPlus,
  new_tip: DollarSign,
  new_message: MessageSquare,
  subscription_expiring: Clock,
  payout_completed: Wallet,
} as const;

const ICON_COLOR_MAP = {
  new_subscriber: "text-[#00AFF0] bg-[#00AFF0]/10",
  new_tip: "text-[#10b981] bg-[#10b981]/10",
  new_message: "text-[#00AFF0] bg-[#00AFF0]/10",
  subscription_expiring: "text-[#f59e0b] bg-[#f59e0b]/10",
  payout_completed: "text-[#10b981] bg-[#10b981]/10",
} as const;

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

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#00AFF0]" />
    </div>
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<readonly Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const json = await res.json();
        setNotifications(json.data ?? []);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAllRead = useCallback(async () => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.is_read ? n : { ...n, is_read: true })),
    );

    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mark_all_read: true }),
      });
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      // Re-fetch on failure to restore correct state
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const handleMarkRead = useCallback(
    async (id: number) => {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id && !n.is_read ? { ...n, is_read: true } : n)),
      );

      try {
        await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
      } catch (err) {
        console.error("Failed to mark as read:", err);
        fetchNotifications();
      }
    },
    [fetchNotifications],
  );

  if (loading) return <LoadingSpinner />;

  return (
    <main className="min-h-[calc(100vh-57px)] bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <span className="rounded-full bg-[#00AFF0] px-2.5 py-0.5 text-xs font-bold text-white">
                {unreadCount}
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[#00AFF0] transition-colors hover:bg-[#00AFF0]/10"
            >
              <Check className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>

        {/* Notification List */}
        {notifications.length > 0 ? (
          <div className="space-y-1" role="list" aria-label="Notifications">
            {notifications.map((notification) => {
              const IconComponent = ICON_MAP[notification.type];
              const iconColors = ICON_COLOR_MAP[notification.type];

              return (
                <button
                  key={notification.id}
                  onClick={() => handleMarkRead(notification.id)}
                  role="listitem"
                  className={`
                    flex w-full items-start gap-3.5 rounded-xl px-4 py-3.5 text-left transition-colors
                    ${
                      notification.is_read
                        ? "hover:bg-gray-50"
                        : "bg-[#00AFF0]/[0.04] hover:bg-[#00AFF0]/[0.07]"
                    }
                  `}
                >
                  {/* Icon */}
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${iconColors}`}
                  >
                    <IconComponent className="h-5 w-5" />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm ${notification.is_read ? "text-gray-600" : "font-medium text-gray-900"}`}
                    >
                      {notification.title}
                    </p>
                    {notification.body && (
                      <p className="mt-0.5 text-xs text-gray-500">
                        {notification.body}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-gray-400">
                      {timeAgo(notification.created_at)}
                    </p>
                  </div>

                  {/* Unread indicator */}
                  {!notification.is_read && (
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-[#00AFF0]" />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 border border-gray-200">
              <Bell className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="mb-1 text-base font-medium text-gray-500">
              No notifications yet
            </h3>
            <p className="text-sm text-gray-400">
              You will see activity here when it happens
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
