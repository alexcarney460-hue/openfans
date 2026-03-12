"use client";

import { Search } from "lucide-react";

interface SearchBarProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative w-full max-w-xl">
      <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search creators..."
        aria-label="Search creators"
        className="h-12 w-full rounded-xl border border-white/10 bg-white/5 pl-12 pr-4 text-sm text-white placeholder:text-white/40 outline-none transition-all focus:border-purple-500/50 focus:bg-white/[0.07] focus:ring-1 focus:ring-purple-500/30"
      />
    </div>
  );
}
