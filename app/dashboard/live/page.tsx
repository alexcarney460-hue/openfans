"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Video,
  Calendar,
  Radio,
  Loader2,
  Users,
  Clock,
  TrendingUp,
  MoreVertical,
  Pencil,
  Trash2,
  AlertCircle,
  PlayCircle,
} from "lucide-react";
import ScheduleStreamModal from "@/components/ScheduleStreamModal";
import StreamControlPanel from "@/components/StreamControlPanel";

interface Stream {
  id: string;
  title: string;
  description?: string;
  status: "live" | "scheduled" | "ended";
  scheduled_at?: string;
  started_at?: string;
  ended_at?: string;
  viewer_count?: number;
  peak_viewers?: number;
  duration_seconds?: number;
  subscriber_only?: boolean;
  chat_enabled?: boolean;
  created_at: string;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const target = new Date(dateStr);
  const diffMs = target.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `in ${diffMins}m`;
  if (diffHours < 24) return `in ${diffHours}h`;
  return `in ${diffDays}d`;
}

export default function LiveStreamDashboard() {
  const router = useRouter();
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [goingLive, setGoingLive] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchStreams = useCallback(async () => {
    try {
      const res = await fetch("/api/streams");
      if (res.ok) {
        const json = await res.json();
        setStreams(json.data ?? []);
      }
    } catch {
      setError("Failed to load streams.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStreams();
  }, [fetchStreams]);

  const activeStream = streams.find((s) => s.status === "live");
  const scheduledStreams = streams
    .filter((s) => s.status === "scheduled")
    .sort((a, b) => new Date(a.scheduled_at ?? "").getTime() - new Date(b.scheduled_at ?? "").getTime());
  const pastStreams = streams
    .filter((s) => s.status === "ended")
    .sort((a, b) => new Date(b.ended_at ?? b.created_at).getTime() - new Date(a.ended_at ?? a.created_at).getTime());

  const handleGoLive = useCallback(async () => {
    setGoingLive(true);
    setError(null);

    try {
      const res = await fetch("/api/streams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Live Stream",
          status: "live",
          chat_enabled: true,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error ?? "Failed to start stream.");
      }

      const json = await res.json();
      const streamId = json.data?.id ?? json.id;
      router.push(`/dashboard/live/${streamId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start stream.");
      setGoingLive(false);
    }
  }, [router]);

  const handleCancelStream = useCallback(async (streamId: string) => {
    setCancellingId(streamId);
    setMenuOpenId(null);

    try {
      const res = await fetch(`/api/streams/${streamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ended" }),
      });

      if (!res.ok) {
        throw new Error("Failed to cancel stream.");
      }

      setStreams((prev) => prev.filter((s) => s.id !== streamId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel stream.");
    } finally {
      setCancellingId(null);
    }
  }, []);

  const handleStreamEnded = useCallback(() => {
    fetchStreams();
  }, [fetchStreams]);

  const handleEditStream = useCallback((streamId: string) => {
    setMenuOpenId(null);
    router.push(`/dashboard/live/${streamId}/edit`);
  }, [router]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Live Streaming</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Go live or schedule upcoming streams for your subscribers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setScheduleOpen(true)}
            disabled={goingLive}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Schedule Stream
          </Button>
          <Button
            className="bg-red-600 text-white hover:bg-red-700"
            onClick={handleGoLive}
            disabled={goingLive || !!activeStream}
          >
            {goingLive ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Going Live...
              </>
            ) : (
              <>
                <Radio className="mr-2 h-4 w-4" />
                Go Live
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
            aria-label="Dismiss error"
          >
            &times;
          </button>
        </div>
      )}

      {/* Active stream control panel */}
      {activeStream && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
            <h2 className="text-lg font-semibold text-foreground">
              Currently Live: {activeStream.title}
            </h2>
          </div>
          <StreamControlPanel
            streamId={activeStream.id}
            onStreamEnded={handleStreamEnded}
          />
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 w-48 bg-gray-200 rounded" />
                  <div className="h-3 w-32 bg-gray-100 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Scheduled streams */}
      {!loading && scheduledStreams.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#00AFF0]" />
            Upcoming Streams
          </h2>
          <div className="space-y-3">
            {scheduledStreams.map((stream) => (
              <Card key={stream.id} className="transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-foreground truncate">
                          {stream.title}
                        </h3>
                        <Badge variant="secondary" className="shrink-0 text-xs bg-[#00AFF0]/10 text-[#00AFF0]">
                          Scheduled
                        </Badge>
                        {stream.subscriber_only && (
                          <Badge variant="outline" className="shrink-0 text-xs">
                            Subscribers
                          </Badge>
                        )}
                      </div>
                      {stream.description && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {stream.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {stream.scheduled_at ? formatDate(stream.scheduled_at) : "TBD"}
                        </span>
                        {stream.scheduled_at && (
                          <span className="text-[#00AFF0] font-medium">
                            {getRelativeTime(stream.scheduled_at)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions menu */}
                    <div className="relative shrink-0">
                      <button
                        onClick={() => setMenuOpenId(menuOpenId === stream.id ? null : stream.id)}
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-gray-100 hover:text-foreground"
                        aria-label="Stream actions"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {menuOpenId === stream.id && (
                        <div className="absolute right-0 top-full mt-1 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg z-10">
                          <button
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-gray-100 hover:text-foreground"
                            onClick={() => handleEditStream(stream.id)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                            onClick={() => handleCancelStream(stream.id)}
                            disabled={cancellingId === stream.id}
                          >
                            {cancellingId === stream.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Past streams */}
      {!loading && pastStreams.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-muted-foreground" />
            Past Streams
          </h2>
          <div className="space-y-3">
            {pastStreams.map((stream) => (
              <Card key={stream.id} className="bg-gray-50/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground truncate mb-1">
                        {stream.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(stream.ended_at ?? stream.created_at)}
                        </span>
                        {typeof stream.peak_viewers === "number" && (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Peak: {stream.peak_viewers}
                          </span>
                        )}
                        {typeof stream.duration_seconds === "number" && stream.duration_seconds > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(stream.duration_seconds)}
                          </span>
                        )}
                        {typeof stream.viewer_count === "number" && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {stream.viewer_count} viewers
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !activeStream && scheduledStreams.length === 0 && pastStreams.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-[#00AFF0]/10 p-4 mb-4">
              <Video className="h-8 w-8 text-[#00AFF0]" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              No streams yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              Start your first live stream or schedule one for later. Your subscribers will be notified.
            </p>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setScheduleOpen(true)}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Schedule
              </Button>
              <Button
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={handleGoLive}
                disabled={goingLive}
              >
                <Radio className="mr-2 h-4 w-4" />
                Go Live Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule stream modal */}
      <ScheduleStreamModal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        onCreated={fetchStreams}
      />
    </div>
  );
}
