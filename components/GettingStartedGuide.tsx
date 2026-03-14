"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Camera,
  ImageIcon,
  FileText,
  PenSquare,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  X,
  Sparkles,
} from "lucide-react";

interface GettingStartedProps {
  hasAvatar: boolean;
  hasBanner: boolean;
  hasBio: boolean;
  postCount: number;
  username: string | null;
}

interface Step {
  id: string;
  label: string;
  description: string;
  done: boolean;
  href: string;
  buttonLabel: string;
  icon: React.ElementType;
}

export function GettingStartedGuide({
  hasAvatar,
  hasBanner,
  hasBio,
  postCount,
  username,
}: GettingStartedProps) {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const steps: Step[] = [
    {
      id: "avatar",
      label: "Add a profile photo",
      description:
        "Upload a photo of yourself so fans know who you are. Go to Settings and click the camera icon on your profile picture.",
      done: hasAvatar,
      href: "/dashboard/settings",
      buttonLabel: "Go to Settings",
      icon: Camera,
    },
    {
      id: "banner",
      label: "Add a banner image",
      description:
        "Your banner is the big image at the top of your profile. It's the first thing fans see! Go to Settings and upload your banner image.",
      done: hasBanner,
      href: "/dashboard/settings",
      buttonLabel: "Go to Settings",
      icon: ImageIcon,
    },
    {
      id: "bio",
      label: "Write your bio",
      description:
        "Tell fans a little about yourself and what kind of content you'll be sharing. Keep it short and fun!",
      done: hasBio,
      href: "/dashboard/settings",
      buttonLabel: "Edit Bio",
      icon: FileText,
    },
    {
      id: "post",
      label: "Create your first post",
      description:
        "Share a photo, video, or text update with your fans. You can make it free for everyone or exclusive for subscribers only.",
      done: postCount > 0,
      href: "/dashboard/posts/new",
      buttonLabel: "Create a Post",
      icon: PenSquare,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;

  if (dismissed || allDone) return null;

  const progressPercent = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="rounded-xl border border-[#00AFF0]/20 bg-gradient-to-r from-[#00AFF0]/5 via-white to-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-3 text-left"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#00AFF0]/10">
            <Sparkles className="h-5 w-5 text-[#00AFF0]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              Getting Started
            </h3>
            <p className="text-xs text-gray-500">
              {completedCount} of {steps.length} steps done
            </p>
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Dismiss guide"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mx-5 mb-1 h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-[#00AFF0] transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Steps */}
      {expanded && (
        <div className="px-5 pb-4 pt-3">
          <div className="space-y-2">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  className={`rounded-lg border p-3.5 transition-colors ${
                    step.done
                      ? "border-green-100 bg-green-50/50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {step.done ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                    ) : (
                      <Circle className="mt-0.5 h-5 w-5 shrink-0 text-gray-300" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium ${
                          step.done
                            ? "text-green-700 line-through"
                            : "text-gray-900"
                        }`}
                      >
                        {step.label}
                      </p>
                      {!step.done && (
                        <>
                          <p className="mt-1 text-xs leading-relaxed text-gray-500">
                            {step.description}
                          </p>
                          <Link
                            href={step.href}
                            className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-[#00AFF0] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#0095cc]"
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {step.buttonLabel}
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-3 text-center text-[11px] text-gray-400">
            Complete all steps to make your profile stand out! You can dismiss
            this guide anytime.
          </p>
        </div>
      )}
    </div>
  );
}
