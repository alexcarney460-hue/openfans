"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Users,
  DollarSign,
  Shield,
  Menu,
  X,
  ChevronLeft,
  LogOut,
  Home,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/auth/actions";

const NAV_ITEMS = [
  { href: "/admin", label: "Analytics", icon: BarChart3 },
  { href: "/admin/payouts", label: "Payouts", icon: Wallet },
] as const;

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAdmin() {
      try {
        const res = await fetch("/api/me");
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const json = await res.json();
        if (json.data?.role !== "admin") {
          router.push("/dashboard");
          return;
        }
        setIsAdmin(true);
      } catch {
        router.push("/login");
      }
    }
    checkAdmin();
  }, [router]);

  if (isAdmin === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#00AFF0]" />
      </div>
    );
  }

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
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
          collapsed ? "w-[68px]" : "w-56",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-gray-200 px-4">
          {!collapsed && (
            <span className="text-sm font-bold text-gray-900">Admin Panel</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="hidden text-gray-400 hover:text-gray-900 lg:flex"
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-gray-900 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map((item) => {
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
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                )}
              >
                <Icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-[#00AFF0]")} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-200 p-3 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          >
            <Home className="h-4 w-4" />
            {!collapsed && <span>Back to Site</span>}
          </Link>
          <button
            onClick={() => logout()}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-gray-100"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className={cn("flex flex-1 flex-col transition-all duration-200", collapsed ? "lg:pl-[68px]" : "lg:pl-56")}>
        <header className="sticky top-0 z-30 flex h-14 items-center border-b border-gray-200 bg-white/80 px-4 backdrop-blur-md lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-gray-900 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="ml-2 text-sm font-semibold text-gray-900 lg:ml-0">OpenFans Admin</span>
        </header>

        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
