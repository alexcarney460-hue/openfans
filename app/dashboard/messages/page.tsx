"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import ConversationList from "@/components/ConversationList";
import MessageBubble from "@/components/MessageBubble";
import MessageInput from "@/components/MessageInput";
import {
  CURRENT_USER,
  type Conversation,
  type Message,
} from "./mock-data";

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
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHrs < 24) return `${diffHrs} hr ago`;
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface ApiConversation {
  readonly id: number;
  readonly sender_id: string;
  readonly receiver_id: string;
  readonly body: string;
  readonly media_url: string | null;
  readonly is_read: boolean;
  readonly created_at: string;
  readonly partner_id: string;
  readonly partner_username: string;
  readonly partner_display_name: string;
  readonly partner_avatar_url: string | null;
}

interface ApiMessage {
  readonly id: number;
  readonly sender_id: string;
  readonly receiver_id: string;
  readonly body: string;
  readonly media_url: string | null;
  readonly is_paid: boolean;
  readonly price_usdc: number | null;
  readonly is_read: boolean;
  readonly created_at: string;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>(CURRENT_USER);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversation list
  useEffect(() => {
    fetch("/api/messages")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((json) => {
        if (json.data && Array.isArray(json.data)) {
          const apiConvs = json.data as ApiConversation[];
          // Determine current user id from the first conversation
          if (apiConvs.length > 0) {
            const first = apiConvs[0];
            const userId = first.sender_id === first.partner_id ? first.receiver_id : first.sender_id;
            setCurrentUserId(userId);
          }

          const mapped: Conversation[] = apiConvs.map((c) => ({
            id: c.partner_id,
            userId: c.partner_id,
            userName: c.partner_display_name || c.partner_username,
            userAvatar: c.partner_avatar_url || `https://api.dicebear.com/9.x/notionists/svg?seed=${c.partner_username}&backgroundColor=00AFF0`,
            lastMessage: c.body,
            lastMessageTime: formatTimestamp(c.created_at),
            unreadCount: c.is_read ? 0 : 1,
            messages: [],
          }));
          setConversations(mapped);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load messages. Please try again.");
        setLoading(false);
      });
  }, []);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) ?? null,
    [conversations, activeConversationId]
  );

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages.length, scrollToBottom]);

  // When a conversation is selected, fetch its messages
  const handleSelectConversation = useCallback((conversationId: string) => {
    setActiveConversationId(conversationId);

    fetch(`/api/messages?with=${conversationId}&limit=50`)
      .then((res) => res.json())
      .then((json) => {
        if (json.data && Array.isArray(json.data)) {
          const apiMessages = json.data as ApiMessage[];
          const mapped: Message[] = apiMessages
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            .map((m) => ({
              id: `msg-${m.id}`,
              senderId: m.sender_id,
              text: m.body,
              timestamp: formatTimestamp(m.created_at),
              mediaUrl: m.media_url ?? undefined,
              tipAmount: m.price_usdc ? m.price_usdc / 100 : undefined,
            }));

          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === conversationId
                ? { ...conv, messages: mapped }
                : conv
            )
          );
        }
      })
      .catch(() => {
        // Silently fail - conversation stays with empty messages
      });
  }, []);

  const handleBackToList = useCallback(() => {
    setActiveConversationId(null);
  }, []);

  const handleSendMessage = useCallback(
    (text: string, tipAmount?: number) => {
      if (!activeConversationId) return;

      // Optimistically add message to UI
      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        senderId: currentUserId,
        text,
        timestamp: "Just now",
        tipAmount,
      };

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeConversationId
            ? {
                ...conv,
                messages: [...conv.messages, newMessage],
                lastMessage: text,
                lastMessageTime: "Just now",
              }
            : conv
        )
      );

      // Send to API
      fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiver_id: activeConversationId,
          body: text,
          is_paid: tipAmount != null && tipAmount > 0,
          price_usdc: tipAmount ? Math.round(tipAmount * 100) : undefined,
        }),
      }).catch(() => {
        // Message send failed - could show error toast
      });
    },
    [activeConversationId, currentUserId]
  );

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <main className="flex h-[calc(100vh-57px)] items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-[calc(100vh-57px)] overflow-hidden bg-gray-50">
      {/* Left Panel - Conversation List */}
      <div
        className={`
          w-full flex-shrink-0 border-r border-gray-200 bg-white
          md:w-[340px] lg:w-[380px]
          ${activeConversationId ? "hidden md:flex md:flex-col" : "flex flex-col"}
        `}
      >
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
        />
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
            <div className="flex items-center gap-3 border-b border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-3">
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
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  {activeConversation.userName}
                </h3>
                <p className="text-xs text-gray-500">Online</p>
              </div>
            </div>

            {/* Messages Area */}
            <div
              className="flex-1 overflow-y-auto px-4 py-4"
              role="list"
              aria-label="Messages"
            >
              {activeConversation.messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isSent={message.senderId === currentUserId}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <MessageInput onSendMessage={handleSendMessage} />
          </>
        ) : (
          /* Empty State */
          <div className="flex flex-1 flex-col items-center justify-center px-4">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 border border-gray-200">
              <svg
                className="h-8 w-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                />
              </svg>
            </div>
            <h3 className="mb-1 text-base font-medium text-gray-500">
              Select a conversation
            </h3>
            <p className="text-sm text-gray-400">
              Choose someone from the left to start chatting
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
