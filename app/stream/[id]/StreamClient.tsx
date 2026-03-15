"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  Users,
  MessageSquareOff,
  Lock,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Loader2,
  DollarSign,
  PhoneOff,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LiveBadge } from "@/components/LiveBadge";
import { ChatMessage, type ChatMessageData } from "@/components/ChatMessage";
import {
  LiveKitRoom,
  VideoTrack,
  useTracks,
  useConnectionState,
  useLocalParticipant,
  RoomAudioRenderer,
} from "@livekit/components-react";
import { Track, ConnectionState } from "livekit-client";

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
  readonly creator_id: string;
  readonly title: string;
  readonly description: string | null;
  readonly playback_url: string | null;
  readonly thumbnail_url: string | null;
  readonly stream_key?: string;
  readonly status: "live" | "ended" | "scheduled";
  readonly chat_enabled: boolean;
  readonly ticket_price: number | null;
  readonly is_creator?: boolean;
  readonly has_paid?: boolean;
  readonly is_subscriber_only: boolean;
  readonly is_subscribed?: boolean;
  readonly started_at: string | null;
  readonly ended_at: string | null;
  readonly viewer_count?: number;
  readonly creator: StreamCreator;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHAT_POLL_INTERVAL = 3000;
const VIEWER_POLL_INTERVAL = 10000;
const MAX_STREAM_DURATION_MS = 20 * 60 * 1000; // 20 minutes

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

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatCountdown(remainingMs: number): string {
  if (remainingMs <= 0) return "0:00";
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface StreamClientProps {
  readonly streamId: string;
}

export default function StreamClient({ streamId }: StreamClientProps) {
  // ---- Core state ----
  const [stream, setStream] = useState<StreamData | null>(null);
  const [messages, setMessages] = useState<readonly ChatMessageData[]>([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [chatInput, setChatInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---- LiveKit state ----
  const [livekitToken, setLivekitToken] = useState<string | null>(null);
  const [livekitUrl, setLivekitUrl] = useState<string | null>(null);
  const [isCreator, setIsCreator] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [purchasedAt, setPurchasedAt] = useState<string | null>(null);
  const [viewerExpired, setViewerExpired] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);

  // ---- Fetch stream data + auto-join ----
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
        if (cancelled) return;

        const s: StreamData = data.data ?? data.stream ?? data;
        setStream(s);
        setIsSubscribed(s.is_subscribed ?? data.is_subscribed ?? false);

        const creatorFlag = s.is_creator ?? !!s.stream_key;
        setIsCreator(creatorFlag);
        setLoading(false);

        // Auto-join if creator or already paid
        if (s.status === "live" && (creatorFlag || s.has_paid)) {
          autoJoin(creatorFlag);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to connect. Please try again.");
          setLoading(false);
        }
      }
    }

    async function autoJoin(creatorJoining: boolean) {
      try {
        const res = await fetch(`/api/streams/${streamId}/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        if (res.ok && !cancelled) {
          const data = await res.json();
          setLivekitToken(data.token);
          setLivekitUrl(data.livekit_url);
          setIsCreator(creatorJoining || !!data.is_creator);
          setPurchasedAt(data.purchased_at ?? null);
          setHasJoined(true);
          setViewerExpired(false);
        }
      } catch {
        // Silent failure on auto-join; user can retry manually
      }
    }

    fetchStream();
    return () => { cancelled = true; };
  }, [streamId]);

  // ---- Poll chat messages ----
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
      } catch { /* retry next interval */ }
    }

    fetchMessages();
    const interval = setInterval(fetchMessages, CHAT_POLL_INTERVAL);
    return () => { cancelled = true; clearInterval(interval); };
  }, [streamId, stream?.status, stream?.chat_enabled]);

  // ---- Poll viewer count ----
  useEffect(() => {
    if (!stream || stream.status !== "live") return;
    let cancelled = false;

    async function fetchViewers() {
      try {
        const res = await fetch(`/api/streams/${streamId}/viewers`);
        if (res.ok && !cancelled) {
          const json = await res.json();
          const vd = json.data ?? json;
          setViewerCount(vd.viewer_count ?? vd.count ?? 0);
        }
      } catch { /* retry next interval */ }
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

  // ---- Send chat message ----
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
        const refreshRes = await fetch(`/api/streams/${streamId}/chat`);
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          const refreshed = data.data ?? data.messages ?? data;
          setMessages(Array.isArray(refreshed) ? refreshed : []);
        }
      }
    } catch { /* user can retry */ } finally {
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

  // ---- Pay & Join ----
  const handlePayAndWatch = useCallback(async () => {
    if (isJoining) return;
    setIsJoining(true);
    setJoinError(null);

    try {
      const res = await fetch(`/api/streams/${streamId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (!res.ok) {
        setJoinError(data.error ?? "Failed to join stream");
        setIsJoining(false);
        return;
      }

      setLivekitToken(data.token);
      setLivekitUrl(data.livekit_url);
      setPurchasedAt(data.purchased_at ?? new Date().toISOString());
      setHasJoined(true);
      setViewerExpired(false);
    } catch {
      setJoinError("Network error. Please try again.");
    } finally {
      setIsJoining(false);
    }
  }, [isJoining, streamId]);

  // ---- End Stream (creator only) ----
  const handleEndStream = useCallback(async () => {
    try {
      const res = await fetch(`/api/streams/${streamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ended" }),
      });
      if (res.ok) {
        setStream((prev) =>
          prev ? { ...prev, status: "ended", ended_at: new Date().toISOString() } : prev,
        );
        setLivekitToken(null);
        setHasJoined(false);
      }
    } catch { /* swallow */ }
  }, [streamId]);

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
  const showPaymentGate =
    stream.status === "live" && !isCreator && !hasJoined && !showSubscribeGate;

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
          ) : showPaymentGate ? (
            <PaymentGate
              creator={stream.creator}
              title={stream.title}
              ticketPrice={stream.ticket_price ?? 500}
              isJoining={isJoining}
              joinError={joinError}
              onPayAndWatch={handlePayAndWatch}
              isRenew={viewerExpired}
            />
          ) : hasJoined && livekitToken && livekitUrl ? (
            <LiveKitStreamView
              token={livekitToken}
              serverUrl={livekitUrl}
              isCreator={isCreator}
              creator={stream.creator}
              streamId={streamId}
              startedAt={stream.started_at}
              purchasedAt={purchasedAt}
              onEndStream={handleEndStream}
              onViewerTimeUp={() => {
                setViewerExpired(true);
                setLivekitToken(null);
                setHasJoined(false);
              }}
            />
          ) : (
            <ViewerLiveView creator={stream.creator} title={stream.title} />
          )}
        </div>

        {/* Stream info bar */}
        <div className="flex items-center gap-3 border-t border-white/10 px-4 py-3">
          <Link href={`/${stream.creator.username}`} className="flex-shrink-0">
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
              {stream.status === "live" && <LiveBadge size="sm" />}
            </div>
            <p className="truncate text-xs text-gray-400">{stream.title}</p>
          </div>

          {stream.status === "live" && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Users className="h-4 w-4" />
              <span className="tabular-nums">{viewerCount.toLocaleString()}</span>
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
// Payment Gate
// ---------------------------------------------------------------------------

function PaymentGate({
  creator,
  title,
  ticketPrice,
  isJoining,
  joinError,
  onPayAndWatch,
  isRenew = false,
}: {
  readonly creator: StreamCreator;
  readonly title: string;
  readonly ticketPrice: number;
  readonly isJoining: boolean;
  readonly joinError: string | null;
  readonly onPayAndWatch: () => void;
  readonly isRenew?: boolean;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 bg-gradient-to-b from-gray-900 to-black p-6">
      {/* Creator avatar */}
      {creator.avatar_url ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={creator.avatar_url}
          alt={creator.display_name}
          className="h-20 w-20 rounded-full object-cover ring-4 ring-[#00AFF0]/30"
        />
      ) : (
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#00AFF0] ring-4 ring-[#00AFF0]/30">
          <span className="text-2xl font-bold text-white">
            {avatarInitial(creator.display_name)}
          </span>
        </div>
      )}

      {/* Stream info */}
      <div className="text-center">
        <h2 className="text-lg font-semibold text-white">{creator.display_name}</h2>
        <p className="mt-1 text-sm text-gray-400">{title}</p>
      </div>

      {/* LIVE badge */}
      <div className="flex items-center gap-2 rounded-full bg-red-500/20 px-4 py-1.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
        </span>
        <span className="text-xs font-semibold text-red-400">LIVE NOW</span>
      </div>

      {/* Price + Pay button */}
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm text-gray-300">
          {isRenew ? (
            <>
              Your 20 minutes are up! Pay{" "}
              <span className="font-bold text-white">{formatCents(ticketPrice)}</span>{" "}
              for another 20 minutes
            </>
          ) : (
            <>
              Pay{" "}
              <span className="font-bold text-white">{formatCents(ticketPrice)}</span>{" "}
              to watch this live stream (20 min)
            </>
          )}
        </p>

        <button
          onClick={onPayAndWatch}
          disabled={isJoining}
          className={cn(
            "flex items-center gap-2 rounded-lg px-8 py-3 text-sm font-semibold text-white transition-all",
            "bg-[#00AFF0] hover:bg-[#009dd8] hover:scale-105",
            "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100",
          )}
        >
          {isJoining ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <DollarSign className="h-4 w-4" />
              Pay & Watch
            </>
          )}
        </button>

        {joinError && (
          <p className="max-w-sm text-center text-sm text-red-400">{joinError}</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// LiveKit Stream View
// ---------------------------------------------------------------------------

function LiveKitStreamView({
  token,
  serverUrl,
  isCreator,
  creator,
  streamId,
  startedAt,
  purchasedAt,
  onEndStream,
  onViewerTimeUp,
}: {
  readonly token: string;
  readonly serverUrl: string;
  readonly isCreator: boolean;
  readonly creator: StreamCreator;
  readonly streamId: string;
  readonly startedAt: string | null;
  readonly purchasedAt: string | null;
  readonly onEndStream: () => void;
  readonly onViewerTimeUp: () => void;
}) {
  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect={true}
      audio={isCreator}
      video={isCreator}
      className="relative h-full w-full"
    >
      <RoomAudioRenderer />
      <LiveKitInner
        isCreator={isCreator}
        creator={creator}
        streamId={streamId}
        startedAt={startedAt}
        purchasedAt={purchasedAt}
        onEndStream={onEndStream}
        onViewerTimeUp={onViewerTimeUp}
      />
    </LiveKitRoom>
  );
}

function LiveKitInner({
  isCreator,
  creator,
  streamId,
  startedAt,
  purchasedAt,
  onEndStream,
  onViewerTimeUp,
}: {
  readonly isCreator: boolean;
  readonly creator: StreamCreator;
  readonly streamId: string;
  readonly startedAt: string | null;
  readonly purchasedAt: string | null;
  readonly onEndStream: () => void;
  readonly onViewerTimeUp: () => void;
}) {
  const connectionState = useConnectionState();
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.Microphone, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );
  const { localParticipant } = useLocalParticipant();

  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);

  // Find the creator's video track
  const creatorVideoTrack = isCreator
    ? tracks.find(
        (t) =>
          t.source === Track.Source.Camera &&
          t.participant.identity === localParticipant?.identity,
      )
    : tracks.find(
        (t) =>
          t.source === Track.Source.Camera &&
          t.participant.identity !== localParticipant?.identity,
      );

  const toggleCamera = useCallback(async () => {
    if (!localParticipant) return;
    try {
      await localParticipant.setCameraEnabled(!cameraOn);
      setCameraOn((prev) => !prev);
    } catch { /* toggle failed */ }
  }, [localParticipant, cameraOn]);

  const toggleMic = useCallback(async () => {
    if (!localParticipant) return;
    try {
      await localParticipant.setMicrophoneEnabled(!micOn);
      setMicOn((prev) => !prev);
    } catch { /* toggle failed */ }
  }, [localParticipant, micOn]);

  // Connecting state
  if (connectionState === ConnectionState.Connecting) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-[#00AFF0]" />
        <p className="text-sm text-gray-400">Connecting to stream...</p>
      </div>
    );
  }

  if (connectionState === ConnectionState.Disconnected) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-gray-950">
        <PhoneOff className="h-8 w-8 text-gray-500" />
        <p className="text-sm text-gray-400">Disconnected from stream</p>
      </div>
    );
  }

  const hasVideoTrack =
    creatorVideoTrack?.publication &&
    !creatorVideoTrack.publication.isMuted &&
    creatorVideoTrack.publication.track;

  return (
    <div className="relative h-full w-full bg-black">
      {/* Video display */}
      {hasVideoTrack ? (
        <VideoTrack
          trackRef={creatorVideoTrack}
          className="h-full w-full object-cover"
          style={isCreator ? { transform: "scaleX(-1)" } : undefined}
        />
      ) : (
        <CreatorAvatarFallback creator={creator} />
      )}

      {/* Viewer countdown timer (creator has no timer — they stay live) */}
      {!isCreator && purchasedAt && (
        <ViewerCountdownTimer
          purchasedAt={purchasedAt}
          onTimeUp={onViewerTimeUp}
        />
      )}

      {/* Creator controls */}
      {isCreator && (
        <>
          {/* YOU ARE LIVE indicator */}
          <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            <span className="text-xs font-semibold text-white">YOU ARE LIVE</span>
          </div>

          {/* Camera / Mic / End controls */}
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3">
            <button
              onClick={toggleCamera}
              className={cn(
                "rounded-full p-3 transition-colors",
                cameraOn
                  ? "bg-white/20 text-white hover:bg-white/30"
                  : "bg-red-500 text-white hover:bg-red-600",
              )}
              aria-label={cameraOn ? "Turn off camera" : "Turn on camera"}
            >
              {cameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </button>

            <button
              onClick={toggleMic}
              className={cn(
                "rounded-full p-3 transition-colors",
                micOn
                  ? "bg-white/20 text-white hover:bg-white/30"
                  : "bg-red-500 text-white hover:bg-red-600",
              )}
              aria-label={micOn ? "Mute microphone" : "Unmute microphone"}
            >
              {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </button>

            <button
              onClick={onEndStream}
              className="rounded-full bg-red-600 p-3 text-white transition-colors hover:bg-red-700"
              aria-label="End stream"
            >
              <PhoneOff className="h-5 w-5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Countdown Timer
// ---------------------------------------------------------------------------

function ViewerCountdownTimer({
  purchasedAt,
  onTimeUp,
}: {
  readonly purchasedAt: string;
  readonly onTimeUp: () => void;
}) {
  const [remainingMs, setRemainingMs] = useState<number>(MAX_STREAM_DURATION_MS);
  const hasExpiredRef = useRef(false);

  useEffect(() => {
    const purchaseTime = new Date(purchasedAt).getTime();

    function tick() {
      const elapsed = Date.now() - purchaseTime;
      const remaining = Math.max(0, MAX_STREAM_DURATION_MS - elapsed);
      setRemainingMs(remaining);

      if (remaining <= 0 && !hasExpiredRef.current) {
        hasExpiredRef.current = true;
        onTimeUp();
      }
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [purchasedAt, onTimeUp]);

  const isWarning = remainingMs <= 5 * 60 * 1000;
  const isCritical = remainingMs <= 60 * 1000;

  return (
    <div
      className={cn(
        "absolute top-3 right-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold tabular-nums transition-colors",
        isCritical
          ? "animate-pulse bg-red-600/90 text-white"
          : isWarning
            ? "bg-yellow-500/90 text-black"
            : "bg-black/60 text-white",
      )}
    >
      <Clock className="h-3.5 w-3.5" />
      {formatCountdown(remainingMs)}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Creator Avatar Fallback (no video track yet)
// ---------------------------------------------------------------------------

function CreatorAvatarFallback({ creator }: { readonly creator: StreamCreator }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-gradient-to-b from-gray-900 to-black">
      {creator.avatar_url ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={creator.avatar_url}
          alt={creator.display_name}
          className="h-24 w-24 rounded-full object-cover ring-4 ring-[#00AFF0]/30"
        />
      ) : (
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#00AFF0] ring-4 ring-[#00AFF0]/30">
          <span className="text-3xl font-bold text-white">
            {avatarInitial(creator.display_name)}
          </span>
        </div>
      )}
      <p className="text-sm text-gray-400">{creator.display_name}</p>
      <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
      <p className="text-xs text-gray-500">Waiting for video...</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Viewer placeholder (scheduled / no payment gate)
// ---------------------------------------------------------------------------

function ViewerLiveView({
  creator,
  title,
}: {
  readonly creator: StreamCreator;
  readonly title: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-gradient-to-b from-gray-900 to-black p-6">
      {creator.avatar_url ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={creator.avatar_url}
          alt={creator.display_name}
          className="h-24 w-24 rounded-full object-cover ring-4 ring-[#00AFF0]/30"
        />
      ) : (
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#00AFF0] ring-4 ring-[#00AFF0]/30">
          <span className="text-3xl font-bold text-white">
            {(creator.display_name || "?")[0].toUpperCase()}
          </span>
        </div>
      )}
      <div className="text-center">
        <h2 className="text-lg font-semibold text-white">{creator.display_name}</h2>
        <p className="mt-1 text-sm text-gray-400">{title}</p>
      </div>
      <div className="flex items-center gap-2 rounded-full bg-red-500/20 px-4 py-1.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
        </span>
        <span className="text-xs font-semibold text-red-400">LIVE NOW</span>
      </div>
      <p className="max-w-sm text-center text-xs text-gray-500">
        Join the live chat below to interact with {creator.display_name}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Subscribe Overlay
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

// ---------------------------------------------------------------------------
// Stream Ended Overlay
// ---------------------------------------------------------------------------

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
          <p className="mt-0.5 text-xs text-gray-500">Duration: {duration}</p>
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
