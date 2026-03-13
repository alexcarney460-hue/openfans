"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  DollarSign,
  MessageSquare,
  UserPlus,
  Wallet,
  Check,
} from "lucide-react";

interface Notification {
  readonly id: string;
  readonly type: "subscription" | "tip" | "message" | "payout";
  readonly text: string;
  readonly timestamp: string;
  readonly read: boolean;
  readonly avatar: string;
  readonly userName: string;
}

const ICON_MAP = {
  subscription: UserPlus,
  tip: DollarSign,
  message: MessageSquare,
  payout: Wallet,
} as const;

const ICON_COLOR_MAP = {
  subscription: "text-[#00AFF0] bg-[#00AFF0]/10",
  tip: "text-[#10b981] bg-[#10b981]/10",
  message: "text-[#00AFF0] bg-[#00AFF0]/10",
  payout: "text-[#f59e0b] bg-[#f59e0b]/10",
} as const;

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

  useEffect(() => {
    // No notifications API/table exists yet - show empty state
    setNotifications([]);
    setLoading(false);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((n) => (n.read ? n : { ...n, read: true }))
    );
  }, []);

  const handleMarkRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id && !n.read ? { ...n, read: true } : n))
    );
  }, []);

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
                      notification.read
                        ? "hover:bg-gray-50"
                        : "bg-[#00AFF0]/[0.04] hover:bg-[#00AFF0]/[0.07]"
                    }
                  `}
                >
                  {/* Icon or Avatar */}
                  {notification.type === "payout" ? (
                    <div
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${iconColors}`}
                    >
                      <IconComponent className="h-5 w-5" />
                    </div>
                  ) : (
                    <div className="relative flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={notification.avatar}
                        alt={notification.userName}
                        className="h-10 w-10 rounded-full bg-gray-100"
                      />
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-gray-50 ${iconColors}`}
                      >
                        <IconComponent className="h-2.5 w-2.5" />
                      </div>
                    </div>
                  )}

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-600">
                      <span
                        className={`font-medium ${notification.read ? "text-gray-600" : "text-gray-900"}`}
                      >
                        {notification.userName}
                      </span>{" "}
                      {notification.text}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {notification.timestamp}
                    </p>
                  </div>

                  {/* Unread indicator */}
                  {!notification.read && (
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
