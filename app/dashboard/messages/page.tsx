"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { ArrowLeft, Plus, Search, X } from "lucide-react";
import ConversationList from "@/components/messages/ConversationList";
import MessageBubble from "@/components/messages/MessageBubble";
import MessageInput from "@/components/messages/MessageInput";
import UserSearchPanel from "@/components/messages/UserSearchPanel";
import EmptyState from "@/components/messages/EmptyState";
import DateSeparator from "@/components/messages/DateSeparator";
import BroadcastModal from "@/components/messages/BroadcastModal";
import type {
  Conversation,
  Message,
  ApiConversation,
  ApiMessage,
} from "./types";

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#00AFF0]" />
    </div>
  );
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function shouldShowDateSeparator(
  currentIso: string,
  previousIso: string | null,
): boolean {
  if (!previousIso) return true;
  return (
    new Date(currentIso).toDateString() !== new Date(previousIso).toDateString()
  );
}

let optimisticCounter = -1;

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch current user ──────────────────────────────────────────────────

  useEffect(() => {
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data?.id) setCurrentUserId(json.data.id);
        if (json?.data?.role === "creator") setIsCreator(true);
      })
      .catch(() => {});
  }, []);

  // ── Fetch conversations ─────────────────────────────────────────────────

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/messages?limit=50");
      if (!res.ok) throw new Error("Failed to load");
      const json = await res.json();
      const rawData = json.data;
      const apiConvs: ApiConversation[] = Array.isArray(rawData)
        ? rawData
        : rawData?.rows ?? [];

      // Determine current user from first conversation if not yet set
      if (apiConvs.length > 0 && !currentUserId) {
        const first = apiConvs[0];
        const userId =
          first.sender_id === first.partner_id
            ? first.receiver_id
            : first.sender_id;
        setCurrentUserId(userId);
      }

      setConversations((prev) => {
        const mapped: Conversation[] = apiConvs.map((c) => {
          // Preserve existing messages if the conversation was already loaded
          const existing = prev.find((p) => p.id === c.partner_id);
          return {
            id: c.partner_id,
            userId: c.partner_id,
            userName:
              c.partner_display_name || c.partner_username,
            userUsername: c.partner_username,
            userAvatar:
              c.partner_avatar_url ||
              `https://api.dicebear.com/9.x/notionists/svg?seed=${c.partner_username}&backgroundColor=00AFF0`,
            lastMessage: c.body,
            lastMessageTime: formatTimestamp(c.created_at),
            unreadCount: c.unread_count ?? (c.is_read ? 0 : 1),
            messages: existing?.messages ?? [],
            lastMessageIsBroadcast: c.is_broadcast ?? false,
          };
        });
        return mapped;
      });
    } catch {
      setError("Failed to load messages. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // ── Poll for updates ────────────────────────────────────────────────────

  useEffect(() => {
    pollTimerRef.current = setInterval(() => {
      fetchConversations();
      // If viewing a conversation, also refresh its messages
      if (activeConversationId) {
        fetchMessagesForConversation(activeConversationId, true);
      }
    }, 5000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId]);

  // ── Active conversation ─────────────────────────────────────────────────

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) ?? null,
    [conversations, activeConversationId],
  );

  // ── Auto-scroll ─────────────────────────────────────────────────────────

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages.length, scrollToBottom]);

  // ── Fetch messages for a conversation ───────────────────────────────────

  const fetchMessagesForConversation = useCallback(
    async (partnerId: string, silent = false) => {
      if (!silent) setLoadingMessages(true);
      try {
        const res = await fetch(`/api/messages/${partnerId}?limit=100`);
        if (!res.ok) return;
        const json = await res.json();
        if (!json.data || !Array.isArray(json.data)) return;

        const apiMessages = json.data as ApiMessage[];
        const mapped: Message[] = apiMessages.map((m) => ({
          id: `msg-${m.id}`,
          numericId: m.id,
          senderId: m.sender_id,
          text: m.body,
          timestamp: formatTimestamp(m.created_at),
          rawTimestamp: m.created_at,
          mediaUrl: m.media_url ?? undefined,
          tipAmount: m.price_usdc ? m.price_usdc / 100 : undefined,
          isRead: m.is_read,
          isFailed: false,
          isOptimistic: false,
          isBroadcast: m.is_broadcast ?? false,
        }));

        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === partnerId
              ? { ...conv, messages: mapped, unreadCount: 0 }
              : conv,
          ),
        );
      } catch {
        // Silently fail on poll
      } finally {
        if (!silent) setLoadingMessages(false);
      }
    },
    [],
  );

  // ── Select conversation ─────────────────────────────────────────────────

  const handleSelectConversation = useCallback(
    (conversationId: string) => {
      setActiveConversationId(conversationId);
      setShowNewMessage(false);
      fetchMessagesForConversation(conversationId);
    },
    [fetchMessagesForConversation],
  );

  // ── Start new conversation with user ────────────────────────────────────

  const handleSelectUser = useCallback(
    (user: {
      id: string;
      username: string;
      display_name: string;
      avatar_url: string | null;
    }) => {
      setShowNewMessage(false);

      // Check if conversation already exists
      const existing = conversations.find((c) => c.id === user.id);
      if (existing) {
        handleSelectConversation(user.id);
        return;
      }

      // Create a synthetic conversation
      const newConvo: Conversation = {
        id: user.id,
        userId: user.id,
        userName: user.display_name || user.username,
        userUsername: user.username,
        userAvatar:
          user.avatar_url ||
          `https://api.dicebear.com/9.x/notionists/svg?seed=${user.username}&backgroundColor=00AFF0`,
        lastMessage: "",
        lastMessageTime: "",
        unreadCount: 0,
        messages: [],
      };

      setConversations((prev) => [newConvo, ...prev]);
      setActiveConversationId(user.id);
    },
    [conversations, handleSelectConversation],
  );

  // ── Back to list (mobile) ───────────────────────────────────────────────

  const handleBackToList = useCallback(() => {
    setActiveConversationId(null);
  }, []);

  // ── Send message ────────────────────────────────────────────────────────

  const handleSendMessage = useCallback(
    async (text: string, tipAmount?: number) => {
      if (!activeConversationId || !currentUserId) return;

      const optimisticId = `msg-opt-${optimisticCounter--}`;
      const now = new Date().toISOString();

      // Optimistic message
      const optimisticMsg: Message = {
        id: optimisticId,
        numericId: optimisticCounter,
        senderId: currentUserId,
        text,
        timestamp: "Just now",
        rawTimestamp: now,
        tipAmount,
        isRead: false,
        isFailed: false,
        isOptimistic: true,
      };

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeConversationId
            ? {
                ...conv,
                messages: [...conv.messages, optimisticMsg],
                lastMessage: text,
                lastMessageTime: "Just now",
              }
            : conv,
        ),
      );

      try {
        const res = await fetch(`/api/messages/${activeConversationId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            body: text,
            is_paid: tipAmount != null && tipAmount > 0,
            price_usdc: tipAmount ? Math.round(tipAmount * 100) : undefined,
          }),
        });

        if (res.ok) {
          const json = await res.json();
          const real = json.data as ApiMessage;

          // Replace optimistic with real message
          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === activeConversationId
                ? {
                    ...conv,
                    messages: conv.messages.map((m) =>
                      m.id === optimisticId
                        ? {
                            ...m,
                            id: `msg-${real.id}`,
                            numericId: real.id,
                            timestamp: formatTimestamp(real.created_at),
                            rawTimestamp: real.created_at,
                            isOptimistic: false,
                          }
                        : m,
                    ),
                  }
                : conv,
            ),
          );

          // Refresh conversation list
          fetchConversations();
        } else {
          // Mark as failed
          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === activeConversationId
                ? {
                    ...conv,
                    messages: conv.messages.map((m) =>
                      m.id === optimisticId ? { ...m, isFailed: true } : m,
                    ),
                  }
                : conv,
            ),
          );
        }
      } catch {
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === activeConversationId
              ? {
                  ...conv,
                  messages: conv.messages.map((m) =>
                    m.id === optimisticId ? { ...m, isFailed: true } : m,
                  ),
                }
              : conv,
          ),
        );
      }
    },
    [activeConversationId, currentUserId, fetchConversations],
  );

  // ── Render ──────────────────────────────────────────────────────────────

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <main className="flex h-[calc(100vh-5rem)] items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchConversations();
            }}
            className="mt-2 text-sm text-[#00AFF0] hover:underline"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-[calc(100vh-5rem)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Left Panel - Conversation List */}
      <div
        className={`
          w-full flex-shrink-0 border-r border-gray-200 bg-white
          md:w-[320px] md:min-w-[320px]
          ${activeConversationId ? "hidden md:flex md:flex-col" : "flex flex-col"}
        `}
      >
        {showNewMessage ? (
          <UserSearchPanel
            onSelectUser={handleSelectUser}
            onClose={() => setShowNewMessage(false)}
          />
        ) : (
          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={handleSelectConversation}
            onNewMessage={() => setShowNewMessage(true)}
            onBroadcast={() => setShowBroadcast(true)}
            isCreator={isCreator}
          />
        )}
      </div>

      {/* Right Panel - Active Conversation */}
      <div
        className={`
          min-w-0 flex-1 flex-col
          ${activeConversationId ? "flex" : "hidden md:flex"}
        `}
      >
        {activeConversation ? (
          <>
            {/* Conversation Header */}
            <div className="flex items-center gap-3 border-b border-gray-100 bg-white/80 px-4 py-3 backdrop-blur-sm">
              <button
                onClick={handleBackToList}
                className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 md:hidden"
                aria-label="Back to conversations"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeConversation.userAvatar}
                alt={activeConversation.userName}
                className="h-9 w-9 rounded-full bg-gray-100"
              />

              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold text-gray-900">
                  {activeConversation.userName}
                </h3>
                {activeConversation.userUsername && (
                  <p className="truncate text-xs text-gray-500">
                    @{activeConversation.userUsername}
                  </p>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div
              className="flex-1 overflow-y-auto px-4 py-4"
              role="list"
              aria-label="Messages"
            >
              {loadingMessages && (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-[#00AFF0]" />
                </div>
              )}

              {!loadingMessages &&
                activeConversation.messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <p className="text-sm text-gray-400">
                      No messages yet. Say hello!
                    </p>
                  </div>
                )}

              {!loadingMessages &&
                activeConversation.messages.map((message, idx) => {
                  const prevMsg =
                    idx > 0
                      ? activeConversation.messages[idx - 1]
                      : null;
                  const showDate =
                    message.rawTimestamp &&
                    shouldShowDateSeparator(
                      message.rawTimestamp,
                      prevMsg?.rawTimestamp ?? null,
                    );

                  return (
                    <div key={message.id}>
                      {showDate && message.rawTimestamp && (
                        <DateSeparator dateIso={message.rawTimestamp} />
                      )}
                      <MessageBubble
                        message={message}
                        isSent={message.senderId === currentUserId}
                      />
                    </div>
                  );
                })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <MessageInput onSendMessage={handleSendMessage} />
          </>
        ) : (
          <EmptyState />
        )}
      </div>
      <BroadcastModal
        isOpen={showBroadcast}
        onClose={() => {
          setShowBroadcast(false);
          fetchConversations();
        }}
      />
    </main>
  );
}
