"use client";

import type { Conversation } from "@/app/dashboard/messages/types";
import { Search, Plus, MessageSquare } from "lucide-react";
import { useState, useMemo, useCallback } from "react";

interface ConversationListProps {
  readonly conversations: readonly Conversation[];
  readonly activeConversationId: string | null;
  readonly onSelectConversation: (conversationId: string) => void;
  readonly onNewMessage: () => void;
}

export default function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewMessage,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter(
      (conv) =>
        conv.userName.toLowerCase().includes(query) ||
        (conv.userUsername?.toLowerCase().includes(query) ?? false) ||
        conv.lastMessage.toLowerCase().includes(query),
    );
  }, [conversations, searchQuery]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    [],
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
          <button
            onClick={onNewMessage}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
            aria-label="New message"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-[#00AFF0]/50 focus:ring-1 focus:ring-[#00AFF0]/25"
            aria-label="Search conversations"
          />
        </div>
      </div>

      {/* List */}
      <div
        className="flex-1 overflow-y-auto"
        role="listbox"
        aria-label="Conversations"
      >
        {filteredConversations.length === 0 && (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <MessageSquare className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600">
              {searchQuery.trim() ? "No conversations found" : "No conversations yet"}
            </p>
            {!searchQuery.trim() && (
              <p className="mt-1 text-xs text-gray-400">
                Start a conversation with the + button
              </p>
            )}
          </div>
        )}

        {filteredConversations.map((conversation) => {
          const isActive = conversation.id === activeConversationId;
          const hasUnread = conversation.unreadCount > 0;

          return (
            <button
              key={conversation.id}
              onClick={() => onSelectConversation(conversation.id)}
              role="option"
              aria-selected={isActive}
              className={`
                flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors
                ${
                  isActive
                    ? "border-l-2 border-l-[#00AFF0] bg-[#00AFF0]/10"
                    : "border-l-2 border-l-transparent hover:bg-gray-50"
                }
              `}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={conversation.userAvatar}
                  alt={conversation.userName}
                  className="h-11 w-11 rounded-full bg-gray-100"
                />
                {hasUnread && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#00AFF0] text-[10px] font-bold text-white">
                    {conversation.unreadCount > 9
                      ? "9+"
                      : conversation.unreadCount}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span
                    className={`truncate text-sm ${
                      hasUnread
                        ? "font-semibold text-gray-900"
                        : "font-medium text-gray-600"
                    }`}
                  >
                    {conversation.userName}
                  </span>
                  <span className="ml-2 flex-shrink-0 text-[11px] text-gray-400">
                    {conversation.lastMessageTime}
                  </span>
                </div>
                <p
                  className={`mt-0.5 truncate text-xs ${
                    hasUnread
                      ? "font-medium text-gray-700"
                      : "text-gray-400"
                  }`}
                >
                  {conversation.lastMessage || "No messages yet"}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
