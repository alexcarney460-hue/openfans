"use client";

import type { Message } from "@/app/dashboard/messages/mock-data";
import { DollarSign } from "lucide-react";

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
          max-w-[75%] sm:max-w-[65%] rounded-2xl px-4 py-2.5
          ${
            isSent
              ? "bg-[#00AFF0] text-white rounded-br-md"
              : "bg-gray-100 text-gray-900 border border-gray-200 rounded-bl-md"
          }
        `}
      >
        {message.mediaUrl && (
          <div className="mb-2 overflow-hidden rounded-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={message.mediaUrl}
              alt="Shared media"
              className="w-full max-w-[280px] h-auto object-cover rounded-lg"
              loading="lazy"
            />
          </div>
        )}

        {message.text && (
          <p className="text-sm leading-relaxed break-words">{message.text}</p>
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

        <p
          className={`
            mt-1 text-[10px]
            ${isSent ? "text-white/50 text-right" : "text-gray-400"}
          `}
        >
          {message.timestamp}
        </p>
      </div>
    </div>
  );
}
