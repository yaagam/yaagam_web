"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarCheck,
  CircleDollarSign,
  FileClock,
  Gauge,
  Gift,
  Headphones,
  LogOut,
  PackageOpen,
  Repeat2,
  Settings,
  Shield,
  Sparkles,
  UserCircle,
  UsersRound,
} from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useOpsLogout } from "@/hooks/use-ops-logout";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/subscriptions", label: "Subscriptions", icon: Repeat2 },
  { href: "/support", label: "Support", icon: Headphones },
  { href: "/temples", label: "Temples", icon: Shield },
  { href: "/poojas", label: "Poojas", icon: Sparkles },
  { href: "/benefits", label: "Benefits", icon: Gift },
  { href: "/offerings", label: "Offerings", icon: PackageOpen },
  { href: "/users", label: "Users", icon: UsersRound },
  { href: "/finance", label: "Finance", icon: CircleDollarSign },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/audit-logs", label: "Audit Logs", icon: FileClock },
  { href: "/profile", label: "Profile", icon: UserCircle },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();
  const logout = useOpsLogout();
  const [confirmLogout, setConfirmLogout] = useState(false);

  return (
    <aside className="hidden min-h-screen border-r border-border bg-card lg:block">
      <div className="sticky top-0 flex h-screen flex-col">
        <div className="flex h-16 items-center gap-3 border-b border-border px-5">
          <Image src="/logo_png.png" alt="Yaagam" width={38} height={38} />
          <div>
            <p className="font-semibold leading-5">Yaagam</p>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Ops
            </p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                isActivePath(pathname, item.href) && "bg-muted text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <button
            onClick={() => setConfirmLogout(true)}
            className="flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
      <ConfirmDialog
        open={confirmLogout}
        title="Log out?"
        description="This will end your operator session on this device."
        confirmLabel="Logout"
        destructive
        onCancel={() => setConfirmLogout(false)}
        onConfirm={logout}
      />
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="flex gap-2 overflow-x-auto border-b border-border bg-card px-3 py-2 lg:hidden">
      {navItems.slice(0, 8).map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium",
            isActivePath(pathname, item.href) && "bg-muted text-foreground",
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
    </div>
  );
}
