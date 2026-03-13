"use client";

import { cn } from "@/lib/utils";

interface SubscribeButtonProps {
  readonly price: number;
  readonly isSubscribed?: boolean;
  readonly size?: "sm" | "default" | "lg";
  readonly className?: string;
  readonly onClick?: () => void;
  readonly onSubscribe?: () => void;
}

export function SubscribeButton({
  price,
  isSubscribed = false,
  size = "default",
  className,
  onClick,
  onSubscribe,
}: SubscribeButtonProps) {
  const sizeClasses = {
    sm: "h-8 px-4 text-xs",
    default: "h-10 px-6 text-sm",
    lg: "h-12 px-8 text-base font-semibold",
  } as const;

  if (isSubscribed) {
    return (
      <button
        disabled
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-gray-100 font-medium text-gray-400 transition-colors",
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
      onClick={onSubscribe ?? onClick}
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium text-white transition-all active:scale-[0.97]",
        "bg-[#00AFF0] hover:bg-[#009ad6] shadow-sm",
        sizeClasses[size],
        className,
      )}
      aria-label={`Subscribe for $${price.toFixed(2)} per month`}
    >
      ${price.toFixed(2)}/mo
    </button>
  );
}
