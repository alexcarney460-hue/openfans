"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  PenSquare,
  MessageSquare,
  Users,
  DollarSign,
  Wallet,
  BarChart3,
  Gift,
  Settings,
  Bell,
  Menu,
  X,
  ChevronLeft,
  User,
  LogOut,
  Compass,
  Heart,
  Share2,
  ShieldCheck,
  Bookmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/auth/actions";
import { useLanguage } from "@/utils/i18n/context";
import { LanguageSelector } from "@/components/LanguageSelector";
import NotificationBell from "@/components/NotificationBell";
import type { TranslationKey } from "@/utils/i18n/translations";

type NavItem = {
  href: string;
  labelKey: TranslationKey;
  icon: typeof LayoutDashboard;
  creatorOnly?: boolean;
  fanOnly?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", labelKey: "dash.home", icon: LayoutDashboard },
  { href: "/explore", labelKey: "dash.explore", icon: Compass, fanOnly: true },
  { href: "/dashboard/subscriptions", labelKey: "dash.subscriptions", icon: Heart, fanOnly: true },
  { href: "/dashboard/bookmarks", labelKey: "dash.bookmarks", icon: Bookmark },
  { href: "/dashboard/posts", labelKey: "dash.posts", icon: FileText, creatorOnly: true },
  { href: "/dashboard/posts/new", labelKey: "dash.newPost", icon: PenSquare, creatorOnly: true },
  { href: "/dashboard/messages", labelKey: "dash.messages", icon: MessageSquare },
  { href: "/dashboard/subscribers", labelKey: "dash.subscribers", icon: Users, creatorOnly: true },
  { href: "/dashboard/earnings", labelKey: "dash.earnings", icon: DollarSign, creatorOnly: true },
  { href: "/dashboard/analytics", labelKey: "dash.analytics", icon: BarChart3, creatorOnly: true },
  { href: "/dashboard/wallet", labelKey: "dash.wallet", icon: Wallet },
  { href: "/dashboard/affiliate", labelKey: "dash.affiliates", icon: Gift, creatorOnly: true },
  { href: "/dashboard/referrals", labelKey: "dash.referrals", icon: Share2, creatorOnly: true },
  { href: "/dashboard/verification", labelKey: "dash.verification", icon: ShieldCheck, creatorOnly: true },
  { href: "/dashboard/notifications", labelKey: "dash.notifications", icon: Bell },
  { href: "/dashboard/settings", labelKey: "dash.settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [sidebarUnreadCount, setSidebarUnreadCount] = useState(0);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [currentUser, setCurrentUser] = useState<{
    username: string;
    display_name: string;
    avatar_url: string | null;
    email: string;
    role: string;
  } | null>(null);

  // Fetch current user profile on mount
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/me");
        if (res.ok) {
          const json = await res.json();
          setCurrentUser(json.data);
        }
      } catch (err) {
        console.error("Failed to load user profile:", err);
      }
    }
    loadUser();
  }, []);

  // Poll unread notification count for sidebar badge
  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch("/api/notifications?count_only=true");
        if (res.ok) {
          const json = await res.json();
          setSidebarUnreadCount(json.data?.unread_count ?? 0);
        }
      } catch {
        // Silently ignore polling failures
      }
    }
    fetchCount();
    const interval = setInterval(fetchCount, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Poll unread message count for sidebar badge
  useEffect(() => {
    async function fetchMsgCount() {
      try {
        const res = await fetch("/api/messages/unread");
        if (res.ok) {
          const json = await res.json();
          setUnreadMsgCount(json.data?.count ?? 0);
        }
      } catch {
        // Silently ignore polling failures
      }
    }
    fetchMsgCount();
    const interval = setInterval(fetchMsgCount, 15_000);
    return () => clearInterval(interval);
  }, [pathname]);

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const getRoleLabel = (role: string | undefined): string => {
    if (role === "admin") return t("dash.admin");
    if (role === "creator") return t("dash.creator");
    return t("dash.fan");
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-gray-200 bg-white transition-all duration-200",
          collapsed ? "w-[68px]" : "w-64",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
        )}
      >
        {/* Sidebar header */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="OpenFans" className="h-10" />
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="hidden text-muted-foreground hover:text-foreground lg:flex"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform",
                collapsed && "rotate-180"
              )}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Dashboard navigation">
          {NAV_ITEMS.filter((item) => {
            const isCreator = currentUser?.role === "creator" || currentUser?.role === "admin";
            if (item.creatorOnly && !isCreator) return false;
            if (item.fanOnly && isCreator) return false;
            return true;
          }).map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-[#00AFF0]/15 text-gray-900"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0",
                    active && "text-[#00AFF0]"
                  )}
                />
                {!collapsed && <span>{t(item.labelKey)}</span>}
                {/* Unread badge for notifications nav item */}
                {!collapsed &&
                  item.href === "/dashboard/notifications" &&
                  sidebarUnreadCount > 0 && (
                    <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#00AFF0] px-1.5 text-[10px] font-bold text-white">
                      {sidebarUnreadCount > 99
                        ? "99+"
                        : sidebarUnreadCount}
                    </span>
                  )}
                {/* Unread badge for messages nav item */}
                {!collapsed &&
                  item.href === "/dashboard/messages" &&
                  unreadMsgCount > 0 && (
                    <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#00AFF0] px-1.5 text-[10px] font-bold text-white">
                      {unreadMsgCount > 99
                        ? "99+"
                        : unreadMsgCount}
                    </span>
                  )}
                {active && !collapsed && (() => {
                  // Don't show the active dot if a badge is already shown
                  if (item.href === "/dashboard/notifications" && sidebarUnreadCount > 0) return false;
                  if (item.href === "/dashboard/messages" && unreadMsgCount > 0) return false;
                  return true;
                })() && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[#00AFF0]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        {!collapsed && (
          <div className="border-t border-gray-200 p-4">
            <div className="rounded-lg bg-[#00AFF0]/10 p-3">
              <p className="text-xs font-medium text-muted-foreground">
                {t("dash.accountType")}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-foreground capitalize">
                {getRoleLabel(currentUser?.role)}
              </p>
            </div>
          </div>
        )}
      </aside>

      {/* Main content area */}
      <div
        className={cn(
          "flex flex-1 flex-col transition-all duration-200",
          collapsed ? "lg:pl-[68px]" : "lg:pl-64"
        )}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 px-4 backdrop-blur-md lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            {/* Language selector */}
            <LanguageSelector compact />

            {/* Notifications */}
            <NotificationBell label={t("dash.notifications")} />

            {/* User avatar with dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#00AFF0] text-sm font-bold text-white overflow-hidden"
                aria-label="User menu"
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
                onClick={() => setUserMenuOpen((prev) => !prev)}
              >
                {currentUser?.avatar_url ? (
                  <Image
                    src={currentUser.avatar_url}
                    alt={currentUser.display_name ?? "User"}
                    width={36}
                    height={36}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  (currentUser?.display_name?.[0] ?? currentUser?.username?.[0] ?? "U").toUpperCase()
                )}
              </button>
              {userMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-xl"
                  role="menu"
                  aria-label="User menu"
                >
                  <button
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-gray-100 hover:text-foreground"
                    role="menuitem"
                    onClick={() => {
                      setUserMenuOpen(false);
                      if (currentUser?.username) {
                        router.push(`/${currentUser.username}`);
                      }
                    }}
                  >
                    <User className="h-4 w-4" />
                    {t("dash.myProfile")}
                  </button>
                  <button
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-gray-100 hover:text-foreground"
                    role="menuitem"
                    onClick={() => {
                      setUserMenuOpen(false);
                      router.push("/dashboard/settings");
                    }}
                  >
                    <Settings className="h-4 w-4" />
                    {t("dash.settings")}
                  </button>
                  <div className="my-1 border-t border-gray-200" />
                  <button
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-gray-100"
                    role="menuitem"
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    {t("dash.signOut")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
