"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  prompt(): Promise<void>;
}

const DISMISS_KEY = "pwa-install-dismissed-at";
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function isDismissedRecently(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const dismissedAt = Number(raw);
    return Date.now() - dismissedAt < DISMISS_DURATION_MS;
  } catch {
    return false;
  }
}

function detectIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

function detectStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if ((navigator as unknown as Record<string, unknown>).standalone === true) return true;
  return window.matchMedia("(display-mode: standalone)").matches;
}

export interface UsePWAInstallReturn {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  promptInstall: () => Promise<void>;
  dismissPrompt: () => void;
}

export function usePWAInstall(): UsePWAInstallReturn {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    setIsInstalled(detectStandalone());
    setIsIOS(detectIOS());

    if (isDismissedRecently() || detectStandalone()) {
      return;
    }

    // On iOS there's no beforeinstallprompt, so show iOS instructions
    if (detectIOS()) {
      setIsInstallable(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    const installedHandler = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      deferredPromptRef.current = null;
    };

    window.addEventListener("appinstalled", installedHandler);

    // Listen for display-mode changes (e.g. user installs via browser menu)
    const mql = window.matchMedia("(display-mode: standalone)");
    const mqlHandler = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
        setIsInstallable(false);
      }
    };
    mql.addEventListener("change", mqlHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
      mql.removeEventListener("change", mqlHandler);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    const prompt = deferredPromptRef.current;
    if (!prompt) return;

    await prompt.prompt();
    const { outcome } = await prompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
      setIsInstallable(false);
    }

    deferredPromptRef.current = null;
  }, []);

  const dismissPrompt = useCallback(() => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* private browsing */ }
    setIsInstallable(false);
    deferredPromptRef.current = null;
  }, []);

  return { isInstallable, isInstalled, isIOS, promptInstall, dismissPrompt };
}
