"use client";

import { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export default function PWAInstallPrompt() {
  const { isInstallable, isInstalled, isIOS, promptInstall, dismissPrompt } =
    usePWAInstall();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isInstallable && !isInstalled) {
      // Small delay so the slide-up animation is visible on mount
      const timer = setTimeout(() => setVisible(true), 500);
      return () => clearTimeout(timer);
    }
    setVisible(false);
  }, [isInstallable, isInstalled]);

  const handleDismiss = () => {
    setVisible(false);
    // Wait for the slide-out animation to finish before cleaning up state
    setTimeout(() => dismissPrompt(), 300);
  };

  const handleInstall = async () => {
    if (isIOS) {
      // On iOS we can only show instructions; nothing else to do
      return;
    }
    await promptInstall();
  };

  if (isInstalled || !isInstallable) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="mx-auto max-w-lg px-4 pb-4">
        <div className="relative rounded-2xl bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.12)] border border-gray-100 p-4">
          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            aria-label="Dismiss install prompt"
            className="absolute top-3 right-3 rounded-full p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>

          <div className="flex items-start gap-3 pr-6">
            {/* Icon */}
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: "#00AFF0" }}
            >
              <Download size={20} className="text-white" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">
                Install OpenFans for the best experience
              </p>

              {isIOS ? (
                <p className="mt-1 text-xs text-gray-500 flex items-center gap-1 flex-wrap">
                  Tap{" "}
                  <Share size={14} className="inline-block text-[#007AFF]" />{" "}
                  <span className="font-medium">Share</span> then{" "}
                  <span className="font-medium">Add to Home Screen</span>
                </p>
              ) : (
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={handleInstall}
                    className="rounded-lg px-4 py-1.5 text-sm font-medium text-white transition-colors hover:brightness-110 active:brightness-95"
                    style={{ backgroundColor: "#00AFF0" }}
                  >
                    Install
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Not now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
