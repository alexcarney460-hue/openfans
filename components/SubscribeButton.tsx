"use client";

import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";

interface SubscribeButtonProps {
  readonly price: number;
  readonly isSubscribed?: boolean;
  readonly size?: "default" | "sm" | "lg";
  readonly className?: string;
  readonly onClick?: () => void;
}

export function SubscribeButton({
  price,
  isSubscribed = false,
  size = "default",
  className,
  onClick,
}: SubscribeButtonProps) {
  const sizeClasses = {
    sm: "h-9 px-4 text-sm",
    default: "h-11 px-6 text-sm",
    lg: "h-14 px-8 text-base font-semibold",
  } as const;

  if (isSubscribed) {
    return (
      <button
        disabled
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 font-medium text-white/60 transition-colors",
          sizeClasses[size],
          className,
        )}
      >
        Subscribed
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "gradient-bg inline-flex items-center justify-center gap-2 rounded-lg font-medium text-white shadow-lg shadow-purple-500/25 transition-all hover:shadow-purple-500/40 hover:brightness-110 active:scale-[0.98]",
        sizeClasses[size],
        className,
      )}
      aria-label={`Subscribe for $${price.toFixed(2)} per month`}
    >
      <Lock className="h-4 w-4" />
      Subscribe &mdash; ${price.toFixed(2)}/mo
    </button>
  );
}
