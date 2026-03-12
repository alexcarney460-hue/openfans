"use client";

import { DollarSign, Image as ImageIcon, Send, X } from "lucide-react";
import { useState, useCallback, useRef, type KeyboardEvent } from "react";

interface MessageInputProps {
  readonly onSendMessage: (text: string, tipAmount?: number) => void;
  readonly onAttachment?: () => void;
}

export default function MessageInput({
  onSendMessage,
  onAttachment,
}: MessageInputProps) {
  const [text, setText] = useState("");
  const [showTipInput, setShowTipInput] = useState(false);
  const [tipAmount, setTipAmount] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const parsedTip = showTipInput ? parseFloat(tipAmount) : undefined;
    const validTip =
      parsedTip != null && !isNaN(parsedTip) && parsedTip > 0
        ? parsedTip
        : undefined;

    onSendMessage(trimmed, validTip);
    setText("");
    setTipAmount("");
    setShowTipInput(false);
    inputRef.current?.focus();
  }, [text, tipAmount, showTipInput, onSendMessage]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setText(e.target.value);
    },
    []
  );

  const handleTipAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (val === "" || /^\d*\.?\d{0,2}$/.test(val)) {
        setTipAmount(val);
      }
    },
    []
  );

  const toggleTipInput = useCallback(() => {
    setShowTipInput((prev) => {
      if (prev) setTipAmount("");
      return !prev;
    });
  }, []);

  return (
    <div className="border-t border-[#1a1a1a] bg-[#0a0a0a] p-4">
      {showTipInput && (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 px-3 py-2">
          <DollarSign className="h-4 w-4 text-[#8b5cf6]" />
          <input
            type="text"
            inputMode="decimal"
            placeholder="Tip amount (USDC)"
            value={tipAmount}
            onChange={handleTipAmountChange}
            className="flex-1 bg-transparent text-sm text-white placeholder-[#666] outline-none"
            aria-label="Tip amount in USDC"
          />
          <button
            onClick={toggleTipInput}
            className="rounded-md p-1 text-[#666] transition-colors hover:text-white"
            aria-label="Cancel tip"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={onAttachment}
          className="flex-shrink-0 rounded-xl p-2.5 text-[#666] transition-colors hover:bg-[#1a1a1a] hover:text-white"
          aria-label="Attach image"
        >
          <ImageIcon className="h-5 w-5" />
        </button>

        <button
          onClick={toggleTipInput}
          className={`
            flex-shrink-0 rounded-xl p-2.5 transition-colors
            ${
              showTipInput
                ? "bg-[#8b5cf6]/20 text-[#8b5cf6]"
                : "text-[#666] hover:bg-[#1a1a1a] hover:text-white"
            }
          `}
          aria-label="Send tip"
        >
          <DollarSign className="h-5 w-5" />
        </button>

        <input
          ref={inputRef}
          type="text"
          placeholder="Type a message..."
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          className="min-w-0 flex-1 rounded-xl bg-[#141414] border border-[#262626] px-4 py-2.5 text-sm text-white placeholder-[#666] outline-none transition-colors focus:border-[#8b5cf6]/50 focus:ring-1 focus:ring-[#8b5cf6]/25"
          aria-label="Message text"
        />

        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="flex-shrink-0 rounded-xl gradient-bg p-2.5 text-white transition-opacity hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Send message"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
