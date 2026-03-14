"use client";

import { MessageSquare } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-200 bg-gray-100">
        <MessageSquare className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="mb-1 text-base font-medium text-gray-500">
        Select a conversation
      </h3>
      <p className="max-w-xs text-sm text-gray-400">
        Choose someone from the left to start chatting, or start a new
        conversation with the + button.
      </p>
    </div>
  );
}
