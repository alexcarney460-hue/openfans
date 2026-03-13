import Link from "next/link";
import {
  DollarSign,
  Users,
  FileText,
  Coins,
  PenSquare,
  User,
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// -- Mock data --

const STATS = [
  {
    label: "Total Earnings",
    value: "$12,450.00",
    subtext: "USDC",
    change: "+12.5%",
    changeDir: "up" as const,
    icon: DollarSign,
    gradient: "from-[#00AFF0]/20 to-[#00AFF0]/5",
    iconColor: "text-[#00AFF0]",
  },
  {
    label: "Active Subscribers",
    value: "1,284",
    subtext: "across all tiers",
    change: "+8.2%",
    changeDir: "up" as const,
    icon: Users,
    gradient: "from-[#00AFF0]/20 to-[#00AFF0]/5",
    iconColor: "text-[#00AFF0]",
  },
  {
    label: "Total Posts",
    value: "89",
    subtext: "12 this month",
    change: "+3",
    changeDir: "up" as const,
    icon: FileText,
    gradient: "from-blue-500/20 to-blue-500/5",
    iconColor: "text-blue-400",
  },
  {
    label: "Total Tips",
    value: "$2,180.00",
    subtext: "USDC",
    change: "-2.1%",
    changeDir: "down" as const,
    icon: Coins,
    gradient: "from-amber-500/20 to-amber-500/5",
    iconColor: "text-amber-400",
  },
] as const;

const RECENT_ACTIVITY = [
  {
    id: "1",
    type: "subscription" as const,
    user: "alex_web3",
    detail: "subscribed to Premium tier",
    amount: "$19.99",
    time: "2 min ago",
  },
  {
    id: "2",
    type: "tip" as const,
    user: "crypto_fan",
    detail: "tipped on your latest post",
    amount: "$5.00",
    time: "15 min ago",
  },
  {
    id: "3",
    type: "subscription" as const,
    user: "sol_holder",
    detail: "subscribed to Basic tier",
    amount: "$9.99",
    time: "1 hr ago",
  },
  {
    id: "4",
    type: "message" as const,
    user: "nft_collector",
    detail: "sent you a message",
    amount: null,
    time: "2 hrs ago",
  },
  {
    id: "5",
    type: "tip" as const,
    user: "defi_degen",
    detail: "tipped on photo set",
    amount: "$25.00",
    time: "3 hrs ago",
  },
  {
    id: "6",
    type: "subscription" as const,
    user: "whale_watcher",
    detail: "subscribed to VIP tier",
    amount: "$49.99",
    time: "5 hrs ago",
  },
] as const;

function activityBadgeVariant(type: string) {
  switch (type) {
    case "subscription":
      return "default";
    case "tip":
      return "secondary";
    case "message":
      return "outline";
    default:
      return "secondary";
  }
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back. Here is an overview of your creator stats.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          const isUp = stat.changeDir === "up";
          return (
            <Card key={stat.label} className="border-white/[0.06] bg-[#111111]">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${stat.gradient}`}
                  >
                    <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                  </div>
                  <div
                    className={`flex items-center gap-0.5 text-xs font-medium ${
                      isUp ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {isUp ? (
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5" />
                    )}
                    {stat.change}
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {stat.subtext}
                  </p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stat.label}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Button asChild className="bg-[#00AFF0] hover:bg-[#009dd8]">
          <Link href="/dashboard/posts/new">
            <PenSquare className="mr-2 h-4 w-4" />
            New Post
          </Link>
        </Button>
        {/* TODO: replace "/alexfitness" with the real username from auth context */}
        <Button asChild variant="outline" className="border-white/[0.08]">
          <Link href="/alexfitness">
            <User className="mr-2 h-4 w-4" />
            View Profile
          </Link>
        </Button>
        <Button asChild variant="outline" className="border-white/[0.08]">
          <Link href="/dashboard/earnings">
            <Wallet className="mr-2 h-4 w-4" />
            Withdraw Funds
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Earnings chart placeholder */}
        <Card className="border-white/[0.06] bg-[#111111] lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Earnings Overview
              </CardTitle>
              <div className="flex items-center gap-1 text-xs text-emerald-400">
                <TrendingUp className="h-3.5 w-3.5" />
                +18% this month
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Chart placeholder */}
            <div className="flex h-64 items-end gap-2 rounded-lg border border-dashed border-white/[0.06] p-4">
              {[40, 55, 35, 70, 50, 80, 65, 90, 60, 75, 85, 95].map(
                (height, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-sm bg-[#00AFF0]/50 transition-all hover:bg-[#00AFF0]/70"
                    style={{ height: `${height}%` }}
                  />
                )
              )}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
              <span>Jul</span>
              <span>Aug</span>
              <span>Sep</span>
              <span>Oct</span>
              <span>Nov</span>
              <span>Dec</span>
            </div>
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card className="border-white/[0.06] bg-[#111111] lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {RECENT_ACTIVITY.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-white/[0.02]"
                >
                  {/* Avatar placeholder */}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-xs font-semibold text-muted-foreground">
                    {item.user.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground">
                        {item.user}
                      </span>
                      <Badge
                        variant={activityBadgeVariant(item.type)}
                        className="shrink-0 text-[10px]"
                      >
                        {item.type}
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.detail}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{item.time}</span>
                      {item.amount && (
                        <>
                          <span>--</span>
                          <span className="font-medium text-emerald-400">
                            {item.amount}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
