"use client";

import { ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SortOption = "popular" | "new" | "earnings";

const SORT_LABELS: Record<SortOption, string> = {
  popular: "Popular",
  new: "Newest",
  earnings: "Top Earners",
} as const;

interface SortSelectProps {
  readonly value: SortOption;
  readonly onChange: (value: SortOption) => void;
}

export function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <div className="relative inline-flex items-center gap-1.5">
      <ArrowUpDown className="h-4 w-4 text-gray-400" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        aria-label="Sort creators"
        className={cn(
          "appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-2 pr-8 text-sm font-medium text-gray-700",
          "outline-none transition-all focus:border-[#00AFF0]/50 focus:ring-1 focus:ring-[#00AFF0]/30",
          "cursor-pointer hover:border-gray-300",
        )}
      >
        {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(
          ([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ),
        )}
      </select>
    </div>
  );
}
