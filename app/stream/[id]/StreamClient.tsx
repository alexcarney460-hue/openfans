"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Users, MessageSquareOff, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { LiveBadge } from "@/components/LiveBadge";
import { ChatMessage, type ChatMessageData } from "@/components/ChatMessage";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StreamCreator {
  readonly username: string;
  readonly display_name: string;
  readonly avatar_url: string | null;
}

interface StreamData {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly playback_url: string | null;
  readonly thumbnail_url: string | null;
  readonly status: "live" | "ended" | "scheduled";
  readonly chat_enabled: boolean;
  readonly is_subscriber_only: boolean;
  readonly is_subscribed?: boolean;
  readonly started_at: string | null;
  readonly ended_at: string | null;
  readonly viewer_count?: number;
  readonly creator: StreamCreator;
}

interface ViewerData {
  readonly count: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function avatarInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

function formatDuration(startedAt: string, endedAt: string): string {
  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();
  const totalSeconds = Math.floor((end - start) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface StreamClientProps {
  readonly streamId: string;
}

const CHAT_POLL_INTERVAL = 3000;
const VIEWER_POLL_INTERVAL = 10000;

export default function StreamClient({ streamId }: StreamClientProps) {
  // ---- State ----
  const [stream, setStream] = useState<StreamData | null>(null);
  const [messages, setMessages] = useState<readonly ChatMessageData[]>([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [chatInput, setChatInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);

  // ---- Fetch stream data ----
  useEffect(() => {
    let cancelled = false;

    async function fetchStream() {
      try {
        const res = await fetch(`/api/streams/${streamId}`);
        if (!res.ok) {
          setError(res.status === 404 ? "Stream not found" : "Failed to load stream");
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          const streamPayload: StreamData = data.data ?? data.stream ?? data;
          setStream(streamPayload);
          setIsSubscribed(streamPayload.is_subscribed ?? data.is_subscribed ?? false);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to connect. Please try again.");
          setLoading(false);
        }
      }
    }

    fetchStream();
    return () => { cancelled = true; };
  }, [streamId]);

  // ---- Poll for chat messages ----
  useEffect(() => {
    if (!stream || stream.status === "ended" || !stream.chat_enabled) return;
    let cancelled = false;

    async function fetchMessages() {
      try {
        const res = await fetch(`/api/streams/${streamId}/chat`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          const incoming: ChatMessageData[] = data.data ?? data.messages ?? data;
          setMessages(Array.isArray(incoming) ? incoming : []);
        }
      } catch {
        // Silently retry on next interval
      }
    }

    fetchMessages();
    const interval = setInterval(fetchMessages, CHAT_POLL_INTERVAL);
    return () => { cancelled = true; clearInterval(interval); };
  }, [streamId, stream?.status, stream?.chat_enabled]);

  // ---- Poll for viewer count ----
  useEffect(() => {
    if (!stream || stream.status !== "live") return;
    let cancelled = false;

    async function fetchViewers() {
      try {
        const res = await fetch(`/api/streams/${streamId}/viewers`);
        if (res.ok && !cancelled) {
          const json = await res.json();
          const viewerData = json.data ?? json;
          setViewerCount(viewerData.viewer_count ?? viewerData.count ?? 0);
        }
      } catch {
        // Silently retry on next interval
      }
    }

    fetchViewers();
    const interval = setInterval(fetchViewers, VIEWER_POLL_INTERVAL);
    return () => { cancelled = true; clearInterval(interval); };
  }, [streamId, stream?.status]);

  // ---- Auto-scroll chat ----
  useEffect(() => {
    if (shouldAutoScroll.current) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleChatScroll = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    shouldAutoScroll.current = scrollHeight - scrollTop - clientHeight < 60;
  }, []);

  // ---- Send message ----
  const sendMessage = useCallback(async () => {
    const trimmed = chatInput.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/streams/${streamId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: trimmed }),
      });
      if (res.ok) {
        setChatInput("");
        // Immediately fetch new messages to show own message
        const refreshRes = await fetch(`/api/streams/${streamId}/chat`);
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setMessages(data.messages ?? data);
        }
      }
    } catch {
      // Swallow network errors — user can retry
    } finally {
      setIsSending(false);
    }
  }, [chatInput, isSending, streamId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage],
  );

  // ---- Loading / Error states ----
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-[#00AFF0]" />
      </div>
    );
  }

  if (error || !stream) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black px-4 text-center">
        <p className="text-lg text-gray-300">{error ?? "Stream not found"}</p>
        <Link
          href="/"
          className="rounded-lg bg-[#00AFF0] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#00AFF0]/90"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  const isEnded = stream.status === "ended";
  const showSubscribeGate = stream.is_subscriber_only && !isSubscribed;

  // ---- Render ----
  return (
    <div className="flex min-h-screen flex-col bg-black lg:flex-row">
      {/* ================================================================ */}
      {/* LEFT: Video + Info */}
      {/* ================================================================ */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3">
          <Link
            href="/"
            className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="truncate text-sm font-medium text-white">
            {stream.title}
          </h1>
        </div>

        {/* Video area */}
        <div className="relative aspect-video w-full bg-gray-950">
          {showSubscribeGate ? (
            <SubscribeOverlay
              creatorName={stream.creator.display_name}
              creatorUsername={stream.creator.username}
              thumbnailUrl={stream.thumbnail_url}
            />
          ) : isEnded ? (
            <StreamEndedOverlay
              startedAt={stream.started_at}
              endedAt={stream.ended_at}
            />
          ) : stream.playback_url ? (
            <iframe
              src={stream.playback_url}
              className="absolute inset-0 h-full w-full"
              sandbox="allow-scripts allow-same-origin"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title={stream.title}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-gray-500">
                Waiting for stream to start...
              </p>
            </div>
          )}
        </div>

        {/* Stream info bar */}
        <div className="flex items-center gap-3 border-t border-white/10 px-4 py-3">
          <Link
            href={`/${stream.creator.username}`}
            className="flex-shrink-0"
          >
            {stream.creator.avatar_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={stream.creator.avatar_url}
                alt={stream.creator.display_name}
                className="h-10 w-10 rounded-full object-cover ring-2 ring-white/10"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-700 ring-2 ring-white/10">
                <span className="text-sm font-semibold text-gray-300">
                  {avatarInitial(stream.creator.display_name)}
                </span>
              </div>
            )}
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Link
                href={`/${stream.creator.username}`}
                className="truncate text-sm font-semibold text-white hover:underline"
              >
                {stream.creator.display_name}
              </Link>
              {stream.status === "live" && (
                <LiveBadge size="sm" />
              )}
            </div>
            <p className="truncate text-xs text-gray-400">
              {stream.title}
            </p>
          </div>

          {stream.status === "live" && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Users className="h-4 w-4" />
              <span className="tabular-nums">
                {viewerCount.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ================================================================ */}
      {/* RIGHT: Chat Panel */}
      {/* ================================================================ */}
      <div className="flex w-full flex-col border-t border-white/10 lg:w-[380px] lg:border-l lg:border-t-0">
        {/* Chat header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">Live Chat</h2>
          {stream.status === "live" && (
            <LiveBadge size="sm" viewerCount={viewerCount} />
          )}
        </div>

        {/* Chat disabled state */}
        {!stream.chat_enabled ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6">
            <MessageSquareOff className="h-8 w-8 text-gray-600" />
            <p className="text-sm text-gray-500">Chat is disabled</p>
          </div>
        ) : isEnded ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6">
            <p className="text-sm text-gray-500">
              Chat has ended with this stream
            </p>
          </div>
        ) : (
          <>
            {/* Message list */}
            <div
              ref={chatContainerRef}
              onScroll={handleChatScroll}
              className="flex-1 overflow-y-auto bg-white"
              style={{ minHeight: 300, maxHeight: "calc(100vh - 200px)" }}
              role="log"
              aria-live="polite"
              aria-label="Chat messages"
            >
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center p-6">
                  <p className="text-sm text-gray-400">
                    No messages yet. Say hi!
                  </p>
                </div>
              ) : (
                <div className="py-2">
                  {messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} />
                  ))}
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>

            {/* Chat input */}
            <div className="border-t border-gray-200 bg-white p-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Send a message..."
                  maxLength={500}
                  disabled={isSending}
                  className={cn(
                    "flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900",
                    "placeholder:text-gray-400 focus:border-[#00AFF0] focus:outline-none focus:ring-1 focus:ring-[#00AFF0]",
                    "disabled:cursor-not-allowed disabled:opacity-60",
                  )}
                />
                <button
                  onClick={sendMessage}
                  disabled={isSending || !chatInput.trim()}
                  aria-label="Send message"
                  className={cn(
                    "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-colors",
                    chatInput.trim()
                      ? "bg-[#00AFF0] text-white hover:bg-[#00AFF0]/90"
                      : "bg-gray-100 text-gray-400",
                    "disabled:cursor-not-allowed disabled:opacity-60",
                  )}
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SubscribeOverlay({
  creatorName,
  creatorUsername,
  thumbnailUrl,
}: {
  readonly creatorName: string;
  readonly creatorUsername: string;
  readonly thumbnailUrl: string | null;
}) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
      {thumbnailUrl && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={thumbnailUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-20 blur-lg"
        />
      )}
      <div className="relative z-10 flex flex-col items-center gap-4 px-6 text-center">
        <Lock className="h-10 w-10 text-gray-400" />
        <div>
          <h3 className="text-lg font-semibold text-white">
            Subscriber-Only Stream
          </h3>
          <p className="mt-1 text-sm text-gray-400">
            Subscribe to {creatorName} to watch this live stream
          </p>
        </div>
        <Link
          href={`/${creatorUsername}`}
          className="rounded-lg bg-[#00AFF0] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#00AFF0]/90"
        >
          Subscribe to Watch
        </Link>
      </div>
    </div>
  );
}

function StreamEndedOverlay({
  startedAt,
  endedAt,
}: {
  readonly startedAt: string | null;
  readonly endedAt: string | null;
}) {
  const duration =
    startedAt && endedAt ? formatDuration(startedAt, endedAt) : null;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-gray-950 text-center">
      <div className="rounded-full bg-white/5 p-4">
        <svg
          className="h-8 w-8 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 10l0 4m6-4l0 4"
          />
        </svg>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-300">Stream has ended</p>
        {duration && (
          <p className="mt-0.5 text-xs text-gray-500">
            Duration: {duration}
          </p>
        )}
      </div>
      <Link
        href="/"
        className="mt-2 rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
      >
        Back to Home
      </Link>
    </div>
  );
}
