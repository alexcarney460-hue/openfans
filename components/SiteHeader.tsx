"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useLanguage } from "@/utils/i18n/context";
import { LanguageSelector } from "@/components/LanguageSelector";
import type { TranslationKey } from "@/utils/i18n/translations";

const NAV_LINKS: readonly { href: string; labelKey: TranslationKey }[] = [
  { href: "/", labelKey: "nav.home" },
  { href: "/explore", labelKey: "nav.explore" },
  { href: "/pricing", labelKey: "nav.pricing" },
] as const;

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setIsLoggedIn(!!user);
      } catch {
        setIsLoggedIn(false);
      }
    }
    checkAuth();
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-xl" style={{ overflow: "visible" }}>
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1" aria-label="OpenFans home">
          <img src="/logo.png" alt="OpenFans" className="h-10" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.labelKey}
              href={link.href}
              className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
            >
              {t(link.labelKey)}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 md:flex" style={{ overflow: "visible" }}>
          <LanguageSelector />
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="rounded-full bg-[#00AFF0] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              {t("nav.dashboard")}
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
              >
                {t("nav.login")}
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-[#00AFF0] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                {t("nav.signup")}
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:text-gray-900 md:hidden"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="border-t border-gray-200 bg-white/95 backdrop-blur-xl md:hidden">
          <nav className="flex flex-col gap-1 px-4 py-3" aria-label="Mobile navigation">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.labelKey}
                href={link.href}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                onClick={() => setMobileOpen(false)}
              >
                {t(link.labelKey)}
              </Link>
            ))}

            {/* Language selector in mobile menu */}
            <div className="px-3 py-2">
              <LanguageSelector compact={false} />
            </div>

            <hr className="my-2 border-gray-200" />
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="mt-1 block rounded-full bg-[#00AFF0] px-5 py-2.5 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
                onClick={() => setMobileOpen(false)}
              >
                {t("nav.dashboard")}
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                  onClick={() => setMobileOpen(false)}
                >
                  {t("nav.login")}
                </Link>
                <Link
                  href="/signup"
                  className="mt-1 block rounded-full bg-[#00AFF0] px-5 py-2.5 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  onClick={() => setMobileOpen(false)}
                >
                  {t("nav.signup")}
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
