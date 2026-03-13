"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import {
  type LanguageCode,
  DEFAULT_LANGUAGE,
  STORAGE_KEY,
  getLanguage,
} from "./languages";
import translations from "./translations";
import type { TranslationKey } from "./translations";

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------
type LanguageContextValue = {
  readonly language: LanguageCode;
  readonly setLanguage: (code: LanguageCode) => void;
  readonly t: (key: TranslationKey) => string;
  readonly dir: "ltr" | "rtl";
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(DEFAULT_LANGUAGE);
  const [mounted, setMounted] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
      if (stored && translations[stored]) {
        setLanguageState(stored);
      }
    } catch {
      // localStorage unavailable (SSR / incognito edge-cases)
    }
    setMounted(true);
  }, []);

  // Persist selection & update <html> attributes
  const setLanguage = useCallback((code: LanguageCode) => {
    setLanguageState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // silent
    }
    const lang = getLanguage(code);
    document.documentElement.lang = code;
    document.documentElement.dir = lang.dir;
  }, []);

  // Apply dir/lang on initial mount too
  useEffect(() => {
    if (!mounted) return;
    const lang = getLanguage(language);
    document.documentElement.lang = language;
    document.documentElement.dir = lang.dir;
  }, [mounted, language]);

  const t = useCallback(
    (key: TranslationKey): string => {
      return translations[language]?.[key] ?? translations.en[key] ?? key;
    },
    [language],
  );

  const dir = getLanguage(language).dir;

  const value = useMemo<LanguageContextValue>(
    () => ({ language, setLanguage, t, dir }),
    [language, setLanguage, t, dir],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a <LanguageProvider>");
  }
  return ctx;
}
