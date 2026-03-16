"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Loader2,
  Download,
  RefreshCw,
  PenSquare,
  ImageIcon,
  Zap,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// -- Types --

interface GenerationResult {
  readonly url: string;
  readonly prompt: string;
  readonly style: string | null;
  readonly aspect_ratio: string;
  readonly mode: string;
}

interface HistoryItem {
  readonly id: string;
  readonly prompt: string;
  readonly style: string | null;
  readonly result_url: string | null;
  readonly status: string;
  readonly created_at: string;
}

type Style = "photorealistic" | "anime" | "digital_art" | "fashion" | "portrait";
type AspectRatio = "1:1" | "4:5" | "16:9" | "9:16";

const STYLES: readonly {
  readonly value: Style;
  readonly label: string;
  readonly description: string;
  readonly emoji: string;
}[] = [
  { value: "photorealistic", label: "Photo", description: "Ultra realistic", emoji: "" },
  { value: "anime", label: "Anime", description: "Japanese style", emoji: "" },
  { value: "digital_art", label: "Digital Art", description: "Concept art", emoji: "" },
  { value: "fashion", label: "Fashion", description: "Editorial", emoji: "" },
  { value: "portrait", label: "Portrait", description: "Headshots", emoji: "" },
] as const;

const ASPECT_RATIOS: readonly {
  readonly value: AspectRatio;
  readonly label: string;
  readonly icon: string;
}[] = [
  { value: "1:1", label: "Square", icon: "1:1" },
  { value: "4:5", label: "Portrait", icon: "4:5" },
  { value: "16:9", label: "Landscape", icon: "16:9" },
  { value: "9:16", label: "Story", icon: "9:16" },
] as const;

// -- Component --

export default function AIStudioPage() {
  const router = useRouter();

  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<Style>("photorealistic");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [history, setHistory] = useState<readonly HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Load generation history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/ai-generate/image?history=true&limit=20");
      if (res.ok) {
        const json = await res.json();
        setHistory(json.data ?? []);
      }
    } catch {
      // Silently fail on history load
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      setError("Please describe the image you want to create.");
      return;
    }

    setGenerating(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/ai-generate/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          style: selectedStyle,
          aspect_ratio: aspectRatio,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Generation failed. Please try again.");
        return;
      }

      setResult(json.data);
      setRemaining(json.remaining ?? null);

      // Refresh history
      loadHistory();
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setGenerating(false);
    }
  }, [prompt, selectedStyle, aspectRatio, loadHistory]);

  const handleUseAsPost = useCallback(() => {
    if (!result) return;
    // Navigate to post creation with the generated image URL as query param
    const params = new URLSearchParams({
      ai_image: result.url,
      ai_prompt: result.prompt,
    });
    router.push(`/dashboard/posts/new?${params.toString()}`);
  }, [result, router]);

  const handleDownload = useCallback(async () => {
    if (!result) return;
    try {
      const response = await fetch(result.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ai-generated-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab
      window.open(result.url, "_blank");
    }
  }, [result]);

  const handleRegenerate = useCallback(() => {
    handleGenerate();
  }, [handleGenerate]);

  const handleHistoryClick = useCallback((item: HistoryItem) => {
    if (item.result_url) {
      setResult({
        url: item.result_url,
        prompt: item.prompt,
        style: item.style,
        aspect_ratio: "1:1",
        mode: "history",
      });
      setPrompt(item.prompt);
      if (item.style && STYLES.some((s) => s.value === item.style)) {
        setSelectedStyle(item.style as Style);
      }
    }
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            <Sparkles className="h-6 w-6 text-[#00AFF0]" />
            AI Content Studio
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate stunning images for your profile with AI.
          </p>
        </div>
        {remaining !== null && (
          <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2">
            <Zap className="h-4 w-4 text-[#00AFF0]" />
            <span className="text-sm font-medium text-foreground">
              {remaining}
            </span>
            <span className="text-xs text-muted-foreground">
              credits left
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left column: Controls */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-gray-200 bg-white">
            <CardContent className="space-y-5 p-5">
              {/* Prompt */}
              <div className="space-y-2">
                <Label
                  htmlFor="ai-prompt"
                  className="text-sm font-medium text-foreground"
                >
                  Describe your image
                </Label>
                <textarea
                  id="ai-prompt"
                  rows={4}
                  placeholder="A stunning sunset over a calm ocean with vibrant orange and purple hues..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  maxLength={2000}
                  className="w-full resize-none rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00AFF0]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                />
                <p className="text-right text-xs text-muted-foreground">
                  {prompt.length}/2000
                </p>
              </div>

              {/* Style selector */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  Style
                </Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
                  {STYLES.map((style) => (
                    <button
                      key={style.value}
                      type="button"
                      onClick={() => setSelectedStyle(style.value)}
                      className={cn(
                        "flex flex-col items-center rounded-lg border-2 px-3 py-2.5 text-center transition-all",
                        selectedStyle === style.value
                          ? "border-[#00AFF0] bg-[#00AFF0]/10"
                          : "border-gray-200 bg-transparent hover:border-gray-300",
                      )}
                      aria-pressed={selectedStyle === style.value}
                    >
                      <span className="text-sm font-semibold text-foreground">
                        {style.label}
                      </span>
                      <span className="mt-0.5 text-[10px] text-muted-foreground">
                        {style.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect ratio */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  Aspect Ratio
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {ASPECT_RATIOS.map((ar) => (
                    <button
                      key={ar.value}
                      type="button"
                      onClick={() => setAspectRatio(ar.value)}
                      className={cn(
                        "flex flex-col items-center rounded-lg border-2 px-2 py-2 text-center transition-all",
                        aspectRatio === ar.value
                          ? "border-[#00AFF0] bg-[#00AFF0]/10"
                          : "border-gray-200 bg-transparent hover:border-gray-300",
                      )}
                      aria-pressed={aspectRatio === ar.value}
                    >
                      <span className="text-xs font-bold text-foreground">
                        {ar.icon}
                      </span>
                      <span className="mt-0.5 text-[10px] text-muted-foreground">
                        {ar.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate button */}
              <Button
                onClick={handleGenerate}
                disabled={generating || !prompt.trim()}
                className="w-full bg-[#00AFF0] text-white hover:bg-[#0099d6] disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Image
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Result + History */}
        <div className="space-y-6 lg:col-span-3">
          {/* Generated result */}
          {result ? (
            <Card className="overflow-hidden border-gray-200 bg-white">
              <div className="relative">
                <img
                  src={result.url}
                  alt={result.prompt}
                  className="w-full object-cover"
                  style={{ maxHeight: 500 }}
                />
                {result.mode === "placeholder" && (
                  <div className="absolute left-3 top-3 rounded-full bg-amber-500/90 px-2.5 py-1 text-[10px] font-semibold text-white">
                    Demo Mode
                  </div>
                )}
              </div>
              <CardContent className="space-y-3 p-4">
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {result.prompt}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={handleUseAsPost}
                    className="bg-[#00AFF0] text-white hover:bg-[#0099d6]"
                    size="sm"
                  >
                    <PenSquare className="mr-1.5 h-3.5 w-3.5" />
                    Use as Post
                  </Button>
                  <Button
                    onClick={handleDownload}
                    variant="outline"
                    size="sm"
                    className="border-gray-200"
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    Download
                  </Button>
                  <Button
                    onClick={handleRegenerate}
                    variant="outline"
                    size="sm"
                    disabled={generating}
                    className="border-gray-200"
                  >
                    <RefreshCw
                      className={cn(
                        "mr-1.5 h-3.5 w-3.5",
                        generating && "animate-spin",
                      )}
                    />
                    Regenerate
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-gray-200 bg-white">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <div className="mb-4 rounded-full bg-[#00AFF0]/10 p-4">
                  <ImageIcon className="h-8 w-8 text-[#00AFF0]" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Create something amazing
                </h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  Describe the image you want to generate and select a style. Your AI-generated image will appear here.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Recent generations */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              Recent Generations
              {!loadingHistory && history.length > 0 && (
                <span className="text-xs font-normal text-muted-foreground">
                  ({history.length})
                </span>
              )}
            </h3>

            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : history.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No generations yet. Create your first image above.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                {history.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleHistoryClick(item)}
                    className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100 transition-all hover:border-[#00AFF0] hover:shadow-md"
                  >
                    {item.result_url ? (
                      <img
                        src={item.result_url}
                        alt={item.prompt}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <p className="truncate text-[9px] text-white">
                        {item.prompt}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
