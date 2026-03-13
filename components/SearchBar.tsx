"use client";

import { Search } from "lucide-react";

interface SearchBarProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative w-full max-w-xl">
      <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search creators..."
        aria-label="Search creators"
        className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-12 pr-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-[#00AFF0]/50 focus:bg-white focus:ring-1 focus:ring-[#00AFF0]/30"
      />
    </div>
  );
}
