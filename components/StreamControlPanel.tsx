"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Clock,
  TrendingUp,
  Wifi,
  WifiOff,
  Pin,
  Trash2,
  StopCircle,
  Loader2,
  AlertCircle,
  MessageSquare,
} from "lucide-react";

interface StreamStats {
  viewer_count: number;
  peak_viewers: number;
  duration_seconds: number;
  stream_health: "excellent" | "good" | "poor" | "unknown";
}

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  pinned: boolean;
  created_at: string;
}

interface StreamControlPanelProps {
  readonly streamId: string;
  readonly onStreamEnded: () => void;
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

function getHealthColor(health: StreamStats["stream_health"]): string {
  switch (health) {
    case "excellent":
      return "text-green-500";
    case "good":
      return "text-yellow-500";
    case "poor":
      return "text-red-500";
    default:
      return "text-gray-400";
  }
}

function getHealthLabel(health: StreamStats["stream_health"]): string {
  switch (health) {
    case "excellent":
      return "Excellent";
    case "good":
      return "Good";
    case "poor":
      return "Poor";
    default:
      return "Unknown";
  }
}

export default function StreamControlPanel({ streamId, onStreamEnded }: StreamControlPanelProps) {
  const [stats, setStats] = useState<StreamStats>({
    viewer_count: 0,
    peak_viewers: 0,
    duration_seconds: 0,
    stream_health: "unknown",
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [endingStream, setEndingStream] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moderatingId, setModeratingId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll stream stats every 5 seconds
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`/api/streams/${streamId}`);
        if (res.ok) {
          const json = await res.json();
          const data = json.data ?? json;
          setStats({
            viewer_count: data.viewer_count ?? 0,
            peak_viewers: data.peak_viewers ?? 0,
            duration_seconds: data.duration_seconds ?? 0,
            stream_health: data.stream_health ?? "unknown",
          });
        }
      } catch {
        // Silently handle polling failures
      }
    }

    fetchStats();
    pollRef.current = setInterval(fetchStats, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [streamId]);

  // Increment local duration counter between polls
  useEffect(() => {
    durationRef.current = setInterval(() => {
      setStats((prev) => ({ ...prev, duration_seconds: prev.duration_seconds + 1 }));
    }, 1000);

    return () => {
      if (durationRef.current) clearInterval(durationRef.current);
    };
  }, []);

  // Fetch chat messages (poll every 5s)
  useEffect(() => {
    async function fetchMessages() {
      try {
        const res = await fetch(`/api/streams/${streamId}/chat`);
        if (res.ok) {
          const json = await res.json();
          setMessages(json.data ?? []);
        }
      } catch {
        // Silently handle polling failures
      }
    }

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [streamId]);

  const handleEndStream = useCallback(async () => {
    if (!confirmEnd) {
      setConfirmEnd(true);
      return;
    }

    setEndingStream(true);
    setError(null);

    try {
      const res = await fetch(`/api/streams/${streamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ended" }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error ?? "Failed to end stream.");
      }

      onStreamEnded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to end stream.");
      setEndingStream(false);
      setConfirmEnd(false);
    }
  }, [confirmEnd, streamId, onStreamEnded]);

  const handlePinMessage = useCallback(async (messageId: string) => {
    setModeratingId(messageId);
    try {
      await fetch(`/api/streams/${streamId}/chat/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: true }),
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, pinned: true } : m))
      );
    } catch {
      // Silently handle moderation failures
    } finally {
      setModeratingId(null);
    }
  }, [streamId]);

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    setModeratingId(messageId);
    try {
      await fetch(`/api/streams/${streamId}/chat/${messageId}`, {
        method: "DELETE",
      });
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch {
      // Silently handle moderation failures
    } finally {
      setModeratingId(null);
    }
  }, [streamId]);

  const cancelEnd = useCallback(() => {
    setConfirmEnd(false);
  }, []);

  const healthColor = getHealthColor(stats.stream_health);
  const healthLabel = getHealthLabel(stats.stream_health);

  return (
    <div className="space-y-4">
      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Live stats bar */}
      <Card className="border-red-200 bg-red-50/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
              </span>
              <span className="text-sm font-semibold text-red-700">LIVE</span>
            </div>
            <Badge variant="outline" className={`${healthColor} border-current`}>
              {stats.stream_health !== "unknown" ? (
                <Wifi className="h-3 w-3 mr-1" />
              ) : (
                <WifiOff className="h-3 w-3 mr-1" />
              )}
              {healthLabel}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                <Users className="h-4 w-4" />
                <span className="text-xs">Viewers</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.viewer_count}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs">Peak</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.peak_viewers}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-xs">Duration</span>
              </div>
              <p className="text-2xl font-bold text-foreground font-mono">
                {formatDuration(stats.duration_seconds)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chat moderation */}
      <Card>
        <div className="flex items-center gap-2 border-b border-gray-200 p-4 pb-3">
          <MessageSquare className="h-4 w-4 text-[#00AFF0]" />
          <h3 className="text-sm font-semibold text-foreground">Chat Moderation</h3>
          <Badge variant="secondary" className="ml-auto text-xs">
            {messages.length} messages
          </Badge>
        </div>
        <CardContent className="p-0">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">No chat messages yet</p>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-gray-50 ${
                    msg.pinned ? "bg-yellow-50/50" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">
                        {msg.username}
                      </span>
                      {msg.pinned && (
                        <Pin className="h-3 w-3 text-yellow-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 break-words">
                      {msg.message}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!msg.pinned && (
                      <button
                        onClick={() => handlePinMessage(msg.id)}
                        disabled={moderatingId === msg.id}
                        className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-yellow-100 hover:text-yellow-700 disabled:opacity-50"
                        aria-label="Pin message"
                        title="Pin message"
                      >
                        <Pin className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      disabled={moderatingId === msg.id}
                      className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-red-100 hover:text-red-600 disabled:opacity-50"
                      aria-label="Delete message"
                      title="Delete message"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* End stream */}
      <Card className="border-gray-200">
        <CardContent className="p-4">
          {confirmEnd ? (
            <div className="space-y-3">
              <p className="text-sm text-foreground font-medium">
                Are you sure you want to end this stream?
              </p>
              <p className="text-xs text-muted-foreground">
                This action cannot be undone. All viewers will be disconnected.
              </p>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={cancelEnd}
                  disabled={endingStream}
                >
                  Keep Streaming
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleEndStream}
                  disabled={endingStream}
                >
                  {endingStream ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Ending...
                    </>
                  ) : (
                    <>
                      <StopCircle className="mr-2 h-4 w-4" />
                      End Stream
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleEndStream}
            >
              <StopCircle className="mr-2 h-4 w-4" />
              End Stream
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
