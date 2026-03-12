"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import ConversationList from "@/components/ConversationList";
import MessageBubble from "@/components/MessageBubble";
import MessageInput from "@/components/MessageInput";
import {
  conversations as initialConversations,
  CURRENT_USER,
  type Conversation,
  type Message,
} from "./mock-data";

export default function MessagesPage() {
  const [conversations, setConversations] = useState<readonly Conversation[]>(
    initialConversations
  );
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const handleSelectConversation = useCallback((conversationId: string) => {
    setActiveConversationId(conversationId);
  }, []);

  const handleBackToList = useCallback(() => {
    setActiveConversationId(null);
  }, []);

  const handleSendMessage = useCallback(
    (text: string, tipAmount?: number) => {
      if (!activeConversationId) return;

      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        senderId: CURRENT_USER,
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
    },
    [activeConversationId]
  );

  return (
    <main className="flex h-[calc(100vh-57px)] overflow-hidden bg-[#0a0a0a]">
      {/* Left Panel - Conversation List */}
      <div
        className={`
          w-full flex-shrink-0 border-r border-[#1a1a1a] bg-[#0d0d0d]
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
            <div className="flex items-center gap-3 border-b border-[#1a1a1a] bg-[#0d0d0d]/80 backdrop-blur-sm px-4 py-3">
              <button
                onClick={handleBackToList}
                className="rounded-lg p-1.5 text-[#999] transition-colors hover:bg-[#1a1a1a] hover:text-white md:hidden"
                aria-label="Back to conversations"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeConversation.userAvatar}
                alt={activeConversation.userName}
                className="h-9 w-9 rounded-full bg-[#1a1a1a]"
              />

              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-white truncate">
                  {activeConversation.userName}
                </h3>
                <p className="text-xs text-[#666]">Online</p>
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
                  isSent={message.senderId === CURRENT_USER}
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
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1a1a1a] border border-[#262626]">
              <svg
                className="h-8 w-8 text-[#555]"
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
            <h3 className="mb-1 text-base font-medium text-[#999]">
              Select a conversation
            </h3>
            <p className="text-sm text-[#555]">
              Choose someone from the left to start chatting
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
