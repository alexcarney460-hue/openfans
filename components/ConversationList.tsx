"use client";

import type { Conversation } from "@/app/dashboard/messages/mock-data";
import { Search } from "lucide-react";
import { useState, useMemo, useCallback } from "react";

interface ConversationListProps {
  readonly conversations: readonly Conversation[];
  readonly activeConversationId: string | null;
  readonly onSelectConversation: (conversationId: string) => void;
}

export default function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter(
      (conv) =>
        conv.userName.toLowerCase().includes(query) ||
        conv.lastMessage.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    []
  );

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[#1a1a1a] p-4">
        <h2 className="mb-3 text-lg font-semibold text-white">Messages</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#666]" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full rounded-xl bg-[#141414] border border-[#262626] py-2.5 pl-10 pr-4 text-sm text-white placeholder-[#666] outline-none transition-colors focus:border-[#00AFF0]/50 focus:ring-1 focus:ring-[#00AFF0]/25"
            aria-label="Search conversations"
          />
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto"
        role="listbox"
        aria-label="Conversations"
      >
        {filteredConversations.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-[#666]">
            No conversations found
          </div>
        )}

        {filteredConversations.map((conversation) => {
          const isActive = conversation.id === activeConversationId;
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
                    ? "bg-[#00AFF0]/10 border-l-2 border-l-[#00AFF0]"
                    : "border-l-2 border-l-transparent hover:bg-[#141414]"
                }
              `}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={conversation.userAvatar}
                  alt={conversation.userName}
                  className="h-11 w-11 rounded-full bg-[#1a1a1a]"
                />
                {conversation.unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#00AFF0] text-[10px] font-bold text-white">
                    {conversation.unreadCount}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span
                    className={`truncate text-sm font-medium ${
                      conversation.unreadCount > 0
                        ? "text-white"
                        : "text-[#ccc]"
                    }`}
                  >
                    {conversation.userName}
                  </span>
                  <span className="ml-2 flex-shrink-0 text-[11px] text-[#555]">
                    {conversation.lastMessageTime}
                  </span>
                </div>
                <p
                  className={`mt-0.5 truncate text-xs ${
                    conversation.unreadCount > 0
                      ? "text-[#999] font-medium"
                      : "text-[#555]"
                  }`}
                >
                  {conversation.lastMessage}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
