"use client";

import { useState, useCallback } from "react";

const SHARE_TEXT =
  "Check out OpenFans — the creator platform that pays more. Keep 95% of your earnings, get paid instantly in crypto. No restrictions. 🚀";

const SHARE_URL = "https://openfans.online";

interface ShareChannel {
  readonly name: string;
  readonly slug: string;
  readonly color: string;
  readonly hoverColor: string;
  readonly icon: React.ReactNode;
  readonly getUrl: () => string;
}

const CHANNELS: readonly ShareChannel[] = [
  {
    name: "WhatsApp",
    slug: "whatsapp",
    color: "#25D366",
    hoverColor: "#1ebe57",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
      </svg>
    ),
    getUrl: () =>
      `https://wa.me/?text=${encodeURIComponent(`${SHARE_TEXT}\n\n${SHARE_URL}`)}`,
  },
  {
    name: "Messenger",
    slug: "messenger",
    color: "#0084FF",
    hoverColor: "#0070db",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
        <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.3 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8.2l3.131 3.26L19.752 8.2l-6.561 6.763z" />
      </svg>
    ),
    getUrl: () =>
      `https://www.facebook.com/dialog/send?link=${encodeURIComponent(SHARE_URL)}&app_id=0&redirect_uri=${encodeURIComponent(SHARE_URL)}`,
  },
  {
    name: "Instagram",
    slug: "instagram",
    color: "#E4405F",
    hoverColor: "#d62e4c",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
    getUrl: () =>
      `https://www.instagram.com/`,
  },
  {
    name: "SMS",
    slug: "sms",
    color: "#34C759",
    hoverColor: "#2db84e",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12zM7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z" />
      </svg>
    ),
    getUrl: () =>
      `sms:?body=${encodeURIComponent(`${SHARE_TEXT}\n\n${SHARE_URL}`)}`,
  },
] as const;

export function ShareBanners() {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(SHARE_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }, []);

  return (
    <section className="border-t border-gray-200 bg-gradient-to-b from-white to-gray-50 py-20 lg:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Share <span className="text-[#00AFF0]">OpenFans</span> with friends
          </h2>
          <p className="mt-3 text-base text-gray-500">
            Invite your audience to join you on the platform that pays more.
          </p>
        </div>

        {/* Share Cards Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CHANNELS.map((channel) => (
            <a
              key={channel.slug}
              href={channel.getUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex flex-col items-center overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
            >
              {/* Colored accent bar */}
              <div
                className="absolute inset-x-0 top-0 h-1 transition-all duration-200 group-hover:h-1.5"
                style={{ backgroundColor: channel.color }}
              />

              {/* Icon */}
              <div
                className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-white transition-transform duration-200 group-hover:scale-110"
                style={{ backgroundColor: channel.color }}
              >
                {channel.icon}
              </div>

              {/* Label */}
              <h3 className="text-base font-bold text-gray-900">
                {channel.name}
              </h3>
              <p className="mt-1 text-xs text-gray-400">
                {channel.slug === "instagram"
                  ? "Copy link & share in Stories"
                  : `Tap to share via ${channel.name}`}
              </p>

              {/* Share arrow */}
              <div
                className="mt-4 flex h-9 w-9 items-center justify-center rounded-full text-white transition-all duration-200 group-hover:scale-105"
                style={{ backgroundColor: channel.color }}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                  />
                </svg>
              </div>
            </a>
          ))}
        </div>

        {/* Copy Link Bar */}
        <div className="mx-auto mt-8 flex max-w-lg items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#00AFF0]/10 text-[#00AFF0]">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.54a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.97 8.597"
              />
            </svg>
          </div>
          <span className="flex-1 truncate font-mono text-sm text-gray-500">
            openfans.online
          </span>
          <button
            onClick={handleCopyLink}
            className="flex-shrink-0 rounded-lg bg-[#00AFF0] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#009ad6]"
          >
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </div>

        {/* Referral Banner Preview */}
        <div className="mx-auto mt-10 max-w-2xl overflow-hidden rounded-2xl border border-gray-200 shadow-lg">
          <div className="relative bg-gradient-to-r from-[#00AFF0] to-[#0077B6] px-8 py-10 text-center text-white sm:px-12">
            {/* Decorative circles */}
            <div className="pointer-events-none absolute -left-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute right-1/4 top-4 h-12 w-12 rounded-full bg-white/5" />

            <div className="relative">
              <h3 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                Join me on <span className="underline decoration-white/50 decoration-2 underline-offset-4">OpenFans</span>
              </h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/80 sm:text-base">
                The creator platform where I keep 95% of my earnings.
                Subscribe to my exclusive content and support me directly.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-[#00AFF0] shadow-lg">
                <span>openfans.online</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white px-6 py-3 text-center">
            <p className="text-xs text-gray-400">
              Share this banner on your social media to invite fans
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
