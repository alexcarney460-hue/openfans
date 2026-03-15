"use client";

import { useEffect, useState, useRef } from "react";

export default function ServiceWorkerRegistration() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const waitingWorkerRef = useRef<ServiceWorker | null>(null);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV === "development"
    ) {
      return;
    }

    let intervalId: ReturnType<typeof setInterval> | null = null;

    async function register() {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              waitingWorkerRef.current = newWorker;
              setUpdateAvailable(true);
            }
          });
        });

        // Periodically check for updates (every 60 minutes)
        intervalId = setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      } catch (error) {
        console.error("Service worker registration failed:", error);
      }
    }

    register();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  function handleUpdate() {
    const worker = waitingWorkerRef.current;
    if (!worker) return;

    worker.postMessage({ type: "SKIP_WAITING" });

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      () => { window.location.reload(); },
      { once: true },
    );

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
        onClick={() => setUpdateAvailable(false)}
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
