"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Send, Wallet, Loader2, AlertCircle } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  cost_usdc: number;
  created_at: string;
}

interface PersonaInfo {
  id: string;
  name: string;
  personality: string;
  avatar_url: string | null;
  greeting_message: string;
  price_per_message: number;
  is_active: boolean;
  total_conversations: number;
  total_messages: number;
  creator_username: string;
  creator_display_name: string;
}

export default function AiChatPage() {
  const params = useParams();
  const router = useRouter();
  const personaId = params.personaId as string;

  const [persona, setPersona] = useState<PersonaInfo | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Load persona info
  useEffect(() => {
    async function loadPersona() {
      try {
        const res = await fetch(`/api/ai-chat?persona_id=${personaId}`);
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Persona not found");
          setLoading(false);
          return;
        }
        const { data } = await res.json();
        setPersona(data);
      } catch {
        setError("Failed to load persona");
      }
    }
    loadPersona();
  }, [personaId]);

  // Load wallet balance
  useEffect(() => {
    async function loadWallet() {
      try {
        const res = await fetch("/api/wallet");
        if (res.ok) {
          const { data } = await res.json();
          setWalletBalance(data.wallet.balance_usdc);
        }
      } catch {
        // Wallet may not exist yet
      }
    }
    loadWallet();
  }, []);

  // Start or resume conversation
  useEffect(() => {
    if (!persona) return;

    async function startConversation() {
      try {
        const res = await fetch("/api/ai-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ persona_id: personaId }),
        });

        if (!res.ok) {
          const data = await res.json();
          if (data.code === "AUTH_REQUIRED") {
            router.push("/auth/login");
            return;
          }
          setError(data.error || "Failed to start conversation");
          setLoading(false);
          return;
        }

        const { data } = await res.json();
        setConversationId(data.conversation_id);
      } catch {
        setError("Failed to start conversation");
        setLoading(false);
      }
    }

    startConversation();
  }, [persona, personaId, router]);

  // Load messages when conversation is ready
  useEffect(() => {
    if (!conversationId) return;

    async function loadMessages() {
      try {
        const res = await fetch(`/api/ai-chat/${conversationId}?limit=100`);
        if (res.ok) {
          const { data } = await res.json();
          setMessages(data.messages);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }

    loadMessages();
  }, [conversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = async () => {
    if (!input.trim() || sending || !conversationId || !persona) return;

    const content = input.trim();
    setInput("");
    setSending(true);
    setError(null);

    // Optimistic: add user message immediately
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content,
      cost_usdc: persona.price_per_message,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch(`/api/ai-chat/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Remove optimistic message
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
        setError(data.error || "Failed to send message");
        setInput(content); // Restore input
        setSending(false);
        return;
      }

      // Replace optimistic message with real one and add AI response
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMsg.id),
        data.data.user_message,
        data.data.ai_message,
      ]);

      setWalletBalance(data.data.wallet_balance);
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
      setError("Failed to send message. Please try again.");
      setInput(content);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const canAffordMessage = persona ? walletBalance >= persona.price_per_message : false;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#00AFF0]" />
          <p className="text-sm text-gray-400">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (error && !persona) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-950 px-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-center text-lg text-gray-300">{error}</p>
        <button
          onClick={() => router.back()}
          className="rounded-lg bg-[#00AFF0] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#00AFF0]/80"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!persona) return null;

  return (
    <div className="flex min-h-screen flex-col bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-gray-800 bg-gray-950/95 px-4 py-3 backdrop-blur-md">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        {/* Persona info */}
        <div className="flex items-center gap-3">
          <div className="relative">
            {persona.avatar_url ? (
              <Image
                src={persona.avatar_url}
                alt={persona.name}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover ring-2 ring-[#00AFF0]/30"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#00AFF0] to-purple-500 text-sm font-bold text-white ring-2 ring-[#00AFF0]/30">
                {persona.name[0]?.toUpperCase()}
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-gray-950 bg-green-400" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">{persona.name}</h1>
            <p className="text-xs text-gray-400">
              by @{persona.creator_username} &middot; {formatPrice(persona.price_per_message)}/msg
            </p>
          </div>
        </div>

        {/* Wallet balance */}
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/dashboard/wallet"
            className="flex items-center gap-1.5 rounded-full bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:bg-gray-700"
          >
            <Wallet className="h-3.5 w-3.5 text-[#00AFF0]" />
            {formatPrice(walletBalance)}
          </Link>
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-2xl space-y-4">
          {/* Persona intro card */}
          {messages.length <= 1 && (
            <div className="mx-auto max-w-sm rounded-2xl bg-gray-900 p-6 text-center">
              {persona.avatar_url ? (
                <Image
                  src={persona.avatar_url}
                  alt={persona.name}
                  width={80}
                  height={80}
                  className="mx-auto mb-3 h-20 w-20 rounded-full object-cover ring-4 ring-[#00AFF0]/20"
                />
              ) : (
                <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#00AFF0] to-purple-500 text-2xl font-bold text-white ring-4 ring-[#00AFF0]/20">
                  {persona.name[0]?.toUpperCase()}
                </div>
              )}
              <h2 className="text-lg font-bold text-white">{persona.name}</h2>
              <p className="mt-1 text-sm text-gray-400">{persona.personality}</p>
              <div className="mt-3 flex items-center justify-center gap-4 text-xs text-gray-500">
                <span>{persona.total_conversations?.toLocaleString()} chats</span>
                <span>&middot;</span>
                <span>{formatPrice(persona.price_per_message)} per message</span>
              </div>
            </div>
          )}

          {/* Message bubbles */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className="flex max-w-[80%] gap-2">
                {msg.role === "assistant" && (
                  <div className="mt-auto flex-shrink-0">
                    {persona.avatar_url ? (
                      <Image
                        src={persona.avatar_url}
                        alt={persona.name}
                        width={28}
                        height={28}
                        className="h-7 w-7 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#00AFF0] to-purple-500 text-[10px] font-bold text-white">
                        {persona.name[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                )}
                <div
                  className={`rounded-2xl px-4 py-2.5 ${
                    msg.role === "user"
                      ? "bg-[#00AFF0] text-white"
                      : "bg-gray-800 text-gray-100"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {msg.content}
                  </p>
                  <div
                    className={`mt-1 flex items-center gap-2 text-[10px] ${
                      msg.role === "user" ? "text-white/50" : "text-gray-500"
                    }`}
                  >
                    <span>
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {msg.cost_usdc > 0 && (
                      <span>&middot; {formatPrice(msg.cost_usdc)}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {sending && (
            <div className="flex justify-start">
              <div className="flex gap-2">
                <div className="mt-auto flex-shrink-0">
                  {persona.avatar_url ? (
                    <Image
                      src={persona.avatar_url}
                      alt={persona.name}
                      width={28}
                      height={28}
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#00AFF0] to-purple-500 text-[10px] font-bold text-white">
                      {persona.name[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="rounded-2xl bg-gray-800 px-4 py-3">
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="border-t border-red-900/30 bg-red-950/50 px-4 py-2">
          <p className="text-center text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Insufficient funds banner */}
      {!canAffordMessage && persona && (
        <div className="border-t border-amber-900/30 bg-amber-950/50 px-4 py-2.5">
          <div className="mx-auto flex max-w-2xl items-center justify-between">
            <p className="text-xs text-amber-400">
              Insufficient balance. Need {formatPrice(persona.price_per_message)} per message.
            </p>
            <Link
              href="/dashboard/wallet"
              className="rounded-lg bg-amber-500 px-3 py-1 text-xs font-semibold text-black transition-colors hover:bg-amber-400"
            >
              Add Funds
            </Link>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-gray-800 bg-gray-950 px-4 pb-safe pt-3">
        <div className="mx-auto flex max-w-2xl items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${persona.name}...`}
            rows={1}
            disabled={sending || !canAffordMessage}
            className="flex-1 resize-none rounded-2xl border border-gray-700 bg-gray-900 px-4 py-2.5 text-sm text-white placeholder-gray-500 transition-colors focus:border-[#00AFF0] focus:outline-none disabled:opacity-50"
            style={{ maxHeight: "120px" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = Math.min(target.scrollHeight, 120) + "px";
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending || !canAffordMessage}
            className="flex h-10 items-center gap-2 rounded-2xl bg-[#00AFF0] px-4 text-sm font-medium text-white transition-all hover:bg-[#00AFF0]/80 disabled:opacity-40 disabled:hover:bg-[#00AFF0]"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">
                  Send ({formatPrice(persona.price_per_message)})
                </span>
              </>
            )}
          </button>
        </div>
        <p className="mx-auto mt-1.5 max-w-2xl text-center text-[10px] text-gray-600">
          Each message costs {formatPrice(persona.price_per_message)}
        </p>
      </div>
    </div>
  );
}
