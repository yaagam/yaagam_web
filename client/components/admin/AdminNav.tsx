"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

type AdminNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type AdminNavProps = {
  items: AdminNavItem[];
  variant: "sidebar" | "mobile";
};

function getPathFromHref(href: string) {
  return href.split("#")[0] || href;
}

function isActiveItem(pathname: string, href: string) {
  const hrefPath = getPathFromHref(href);

  if (hrefPath === "/admin") return pathname === "/admin";

  return pathname === hrefPath || pathname.startsWith(`${hrefPath}/`);
}

export function AdminNav({ items, variant }: AdminNavProps) {
  const pathname = usePathname();

  if (variant === "mobile") {
    return (
      <nav
        aria-label="Admin mobile navigation"
        className="flex gap-2 overflow-x-auto border-t border-black/10 px-4 py-2 lg:hidden"
      >
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = isActiveItem(pathname, item.href);

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-extrabold ${
                isActive
                  ? "bg-saffron text-white"
                  : "bg-white text-text-primary/70 hover:text-saffron"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav aria-label="Admin navigation" className="flex-1 space-y-1 p-3">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = isActiveItem(pathname, item.href);

        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-extrabold transition-colors ${
              isActive
                ? "bg-saffron text-white shadow-sm"
                : "text-text-primary/70 hover:bg-orange-50 hover:text-saffron"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="min-w-0 text-wrap-safe">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
