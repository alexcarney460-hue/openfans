"use client";

interface DateSeparatorProps {
  readonly dateIso: string;
}

function formatDateLabel(dateIso: string): string {
  const date = new Date(dateIso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export default function DateSeparator({ dateIso }: DateSeparatorProps) {
  return (
    <div className="my-4 flex items-center justify-center">
      <div className="flex-1 border-t border-gray-100" />
      <span className="px-3 text-[11px] font-medium text-gray-400">
        {formatDateLabel(dateIso)}
      </span>
      <div className="flex-1 border-t border-gray-100" />
    </div>
  );
}
