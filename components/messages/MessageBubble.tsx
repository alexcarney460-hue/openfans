"use client";

import type { Message } from "@/app/dashboard/messages/types";
import { DollarSign, Check, CheckCheck, AlertCircle, Megaphone } from "lucide-react";

interface MessageBubbleProps {
  readonly message: Message;
  readonly isSent: boolean;
}

export default function MessageBubble({ message, isSent }: MessageBubbleProps) {
  return (
    <div
      className={`flex ${isSent ? "justify-end" : "justify-start"} mb-3`}
      role="listitem"
    >
      <div
        className={`
          max-w-[75%] rounded-2xl px-4 py-2.5 sm:max-w-[65%]
          ${
            isSent
              ? "rounded-br-md bg-[#00AFF0] text-white"
              : "rounded-bl-md border border-gray-200 bg-gray-100 text-gray-900"
          }
          ${message.isFailed ? "opacity-60" : ""}
          ${message.isOptimistic && !message.isFailed ? "opacity-80" : ""}
        `}
      >
        {message.isBroadcast && (
          <div
            className={`mb-1.5 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide ${
              isSent ? "text-white/60" : "text-[#00AFF0]"
            }`}
          >
            <Megaphone className="h-3 w-3" />
            <span>Broadcast</span>
          </div>
        )}

        {message.mediaUrl && (
          <div className="mb-2 overflow-hidden rounded-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={message.mediaUrl}
              alt="Shared media"
              className="h-auto max-w-[280px] rounded-lg object-cover"
              loading="lazy"
            />
          </div>
        )}

        {message.text && (
          <p className="break-words text-sm leading-relaxed whitespace-pre-wrap">
            {message.text}
          </p>
        )}

        {message.tipAmount != null && message.tipAmount > 0 && (
          <div
            className={`
              mt-2 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium
              ${
                isSent
                  ? "bg-white/15 text-white"
                  : "bg-[#00AFF0]/15 text-[#33C1F5]"
              }
            `}
          >
            <DollarSign className="h-3 w-3" />
            <span>Tipped ${message.tipAmount.toFixed(2)} USDC</span>
          </div>
        )}

        <div
          className={`mt-1 flex items-center gap-1 ${
            isSent ? "justify-end" : "justify-start"
          }`}
        >
          <span
            className={`text-[10px] ${
              isSent ? "text-white/50" : "text-gray-400"
            }`}
          >
            {message.timestamp}
          </span>

          {isSent && !message.isOptimistic && !message.isFailed && (
            <span className="text-white/60">
              {message.isRead ? (
                <CheckCheck className="h-3 w-3" />
              ) : (
                <Check className="h-3 w-3" />
              )}
            </span>
          )}

          {message.isFailed && (
            <span className="flex items-center gap-0.5 text-[10px] text-red-300">
              <AlertCircle className="h-3 w-3" />
              Failed
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
