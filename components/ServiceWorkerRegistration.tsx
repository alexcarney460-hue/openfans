"use client";

import { useEffect, useState } from "react";

export default function ServiceWorkerRegistration() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(
    null
  );

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV === "development"
    ) {
      return;
    }

    registerServiceWorker();
  }, []);

  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      // Check for updates on registration
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          // A new SW is installed and waiting to activate
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            setWaitingWorker(newWorker);
            setUpdateAvailable(true);
          }
        });
      });

      // Periodically check for updates (every 60 minutes)
      setInterval(
        () => {
          registration.update();
        },
        60 * 60 * 1000
      );
    } catch (error) {
      console.error("Service worker registration failed:", error);
    }
  }

  function handleUpdate() {
    if (!waitingWorker) return;

    waitingWorker.postMessage({ type: "SKIP_WAITING" });

    // Reload once the new SW takes over
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });

    setUpdateAvailable(false);
  }

  function handleDismiss() {
    setUpdateAvailable(false);
  }

  if (!updateAvailable) return null;

  return (
    <div
      role="alert"
      style={{
        position: "fixed",
        bottom: "1.5rem",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        background: "#18181b",
        border: "1px solid rgba(0, 175, 240, 0.3)",
        borderRadius: "0.75rem",
        padding: "0.875rem 1.25rem",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
        maxWidth: "calc(100vw - 2rem)",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: "0.875rem",
        color: "#e4e4e7",
      }}
    >
      <span>A new version of OpenFans is available.</span>
      <button
        onClick={handleUpdate}
        style={{
          background: "#00aff0",
          color: "#fff",
          border: "none",
          borderRadius: "0.5rem",
          padding: "0.375rem 0.875rem",
          fontWeight: 600,
          fontSize: "0.8125rem",
          cursor: "pointer",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        Update
      </button>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss"
        style={{
          background: "transparent",
          color: "#71717a",
          border: "none",
          fontSize: "1.125rem",
          cursor: "pointer",
          padding: "0 0.25rem",
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        &times;
      </button>
    </div>
  );
}
