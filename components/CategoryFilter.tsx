"use client";

import { cn } from "@/lib/utils";
import type { CreatorCategory } from "@/app/explore/mock-data";

interface CategoryFilterProps {
  readonly categories: readonly CreatorCategory[];
  readonly activeCategory: CreatorCategory;
  readonly onSelect: (category: CreatorCategory) => void;
}

export function CategoryFilter({
  categories,
  activeCategory,
  onSelect,
}: CategoryFilterProps) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
      role="tablist"
      aria-label="Filter creators by category"
    >
      {categories.map((category) => {
        const isActive = category === activeCategory;
        return (
          <button
            key={category}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(category)}
            className={cn(
              "shrink-0 rounded-full px-5 py-2 text-sm font-medium transition-all",
              isActive
                ? "gradient-bg text-white shadow-lg shadow-purple-500/20"
                : "border border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white/80"
            )}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
