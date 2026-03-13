"use client";

import { useState, useRef, useEffect } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { LANGUAGES } from "@/utils/i18n/languages";
import { useLanguage } from "@/utils/i18n/context";
import { cn } from "@/lib/utils";

type LanguageSelectorProps = {
  /** Compact mode hides the language name on small screens */
  compact?: boolean;
  className?: string;
};

export function LanguageSelector({
  compact = false,
  className,
}: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900",
          open && "bg-gray-100 text-gray-900",
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Select language"
      >
        <Globe className="h-4 w-4 shrink-0" />
        {!compact && (
          <span className="hidden sm:inline">{currentLang.nativeName}</span>
        )}
        <ChevronDown
          className={cn(
            "h-3 w-3 shrink-0 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-1.5 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl"
          role="listbox"
          aria-label="Available languages"
        >
          {LANGUAGES.map((lang) => {
            const isSelected = lang.code === language;
            return (
              <button
                key={lang.code}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={cn(
                  "flex w-full items-center justify-between px-3.5 py-2 text-sm transition-colors hover:bg-gray-50",
                  isSelected
                    ? "font-semibold text-[#00AFF0]"
                    : "text-gray-700 hover:text-gray-900",
                )}
                onClick={() => {
                  setLanguage(lang.code);
                  setOpen(false);
                }}
              >
                <span className="flex items-center gap-2.5">
                  <span className="text-gray-900">{lang.nativeName}</span>
                  <span className="text-xs text-gray-400">{lang.name}</span>
                </span>
                {isSelected && (
                  <Check className="h-4 w-4 shrink-0 text-[#00AFF0]" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
