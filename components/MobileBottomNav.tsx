"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Compass,
  PlusSquare,
  MessageSquare,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

type UserData = {
  username: string;
  role: string;
};

type NavTab = {
  href: string;
  label: string;
  icon: typeof Home;
};

function buildTabs(username: string | null): NavTab[] {
  return [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/explore", label: "Explore", icon: Compass },
    { href: "/dashboard/posts/new", label: "Post", icon: PlusSquare },
    { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
    {
      href: username ? `/${username}` : "/dashboard/settings",
      label: "Profile",
      icon: User,
    },
  ];
}

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<UserData | null>(null);
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  // Fetch user on mount
  useEffect(() => {
    let cancelled = false;
    async function loadUser() {
      try {
        const res = await fetch("/api/me");
        if (res.ok) {
          const json = await res.json();
          if (!cancelled && json.data) {
            setUser({
              username: json.data.username,
              role: json.data.role,
            });
          }
        }
      } catch {
        // Not logged in or network error — hide nav
      }
    }
    loadUser();
    return () => {
      cancelled = true;
    };
  }, []);

  // Hide on scroll down, show on scroll up
  const handleScroll = useCallback(() => {
    if (ticking.current) return;
    ticking.current = true;

    requestAnimationFrame(() => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY.current;

      // Only react to significant scroll (> 10px)
      if (delta > 10) {
        setVisible(false);
      } else if (delta < -10) {
        setVisible(true);
      }

      // Always show at top of page
      if (currentScrollY < 50) {
        setVisible(true);
      }

      lastScrollY.current = currentScrollY;
      ticking.current = false;
    });
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Don't render if user is not logged in
  if (!user) return null;

  const tabs = buildTabs(user.username);

  const isActive = (href: string): boolean => {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href.startsWith("/dashboard/posts/new"))
      return pathname === "/dashboard/posts/new";
    return pathname.startsWith(href);
  };

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-md lg:hidden",
        "transition-transform duration-300 ease-out",
        visible ? "translate-y-0" : "translate-y-full"
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Mobile navigation"
    >
      <div className="flex h-14 items-stretch">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-0.5",
                "min-h-[48px] min-w-[48px]",
                "transition-colors duration-150",
                "active:bg-gray-100",
                active
                  ? "text-[#00AFF0]"
                  : "text-gray-500 hover:text-gray-700"
              )}
              aria-current={active ? "page" : undefined}
            >
              {active && (
                <span className="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-b-full bg-[#00AFF0]" />
              )}
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0",
                  active && "stroke-[2.5px]"
                )}
              />
              <span className="text-[10px] font-medium leading-tight">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
