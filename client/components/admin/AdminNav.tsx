"use client";

import { LocalizedLink as Link } from "@/components/ui/localized-link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_ICONS } from "@/constants/admin-nav.const";
import { APP_ROUTES } from "@/constants/route.const";
import { stripLocalePrefix } from "@/translations/locales";


export type AdminNavIcon = keyof typeof ADMIN_NAV_ICONS;

export type AdminNavItem = {
  label: string;
  href: string;
  icon: AdminNavIcon;
};

type AdminNavProps = {
  isCollapsed?: boolean;
  items: readonly AdminNavItem[];
  variant: "sidebar" | "mobile";
  notificationItemHrefs?: readonly string[];
};

function getPathFromHref(href: string) {
  return href.split("#")[0] || href;
}

function isActiveItem(pathname: string, href: string) {
  const activePathname = stripLocalePrefix(pathname).pathnameWithoutLocale;
  const hrefPath = getPathFromHref(href);

  if (hrefPath === APP_ROUTES.admin) return activePathname === APP_ROUTES.admin;

  return activePathname === hrefPath || activePathname.startsWith(`${hrefPath}/`);
}

export function AdminNav({
  isCollapsed = false,
  items,
  notificationItemHrefs = [],
  variant,
}: AdminNavProps) {
  const pathname = usePathname();

  if (variant === "mobile") {
    return (
      <nav
        aria-label="Admin mobile navigation"
        className="flex gap-2 overflow-x-auto border-t border-black/10 px-4 py-2 lg:hidden"
      >
        {items.map((item) => {
          const Icon = ADMIN_NAV_ICONS[item.icon];
          const isActive = isActiveItem(pathname, item.href);
          const hasNotification = notificationItemHrefs.includes(
            getPathFromHref(item.href),
          );

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`relative inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-extrabold ${
                isActive
                  ? "bg-saffron text-white"
                  : "bg-white text-text-primary/70 hover:text-saffron"
              }`}
            >
              <span className="relative inline-flex">
                <Icon className="h-4 w-4" />
                {hasNotification && (
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-600" />
                )}
              </span>
              {item.label}
              {hasNotification && (
                <span className="sr-only">Unresolved support tickets</span>
              )}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav
      aria-label="Admin navigation"
      className={`flex-1 space-y-1 p-3 ${isCollapsed ? "px-3" : ""}`}
    >
      {items.map((item) => {
        const Icon = ADMIN_NAV_ICONS[item.icon];
        const isActive = isActiveItem(pathname, item.href);
        const hasNotification = notificationItemHrefs.includes(
          getPathFromHref(item.href),
        );

        return (
          <Link
            key={item.label}
            href={item.href}
            title={isCollapsed ? item.label : undefined}
            aria-label={isCollapsed ? item.label : undefined}
            className={`relative flex min-h-11 items-center rounded-lg py-2 text-sm font-extrabold transition-colors ${
              isCollapsed ? "justify-center px-2" : "gap-3 px-3"
            } ${
              isActive
                ? "bg-saffron text-white shadow-sm"
                : "text-text-primary/70 hover:bg-orange-50 hover:text-saffron"
            }`}
          >
            <span className="relative inline-flex shrink-0">
              <Icon className="h-4 w-4" />
              {hasNotification && (
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-600" />
              )}
            </span>
            {!isCollapsed && (
              <span className="min-w-0 text-wrap-safe">{item.label}</span>
            )}
            {hasNotification && (
              <span className="sr-only">Unresolved support tickets</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
