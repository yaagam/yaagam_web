"use client";

import Image from "next/image";
import { LocalizedLink as Link } from "@/components/ui/localized-link";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { AdminNav, type AdminNavItem } from "@/components/admin/AdminNav";
import { APP_ROUTES } from "@/constants/route.const";
import { getHasUnresolvedSupportTicketsApi } from "@/lib/api/admin/management/admin-management.api";

type AdminShellProps = {
  children: ReactNode;
  navItems: readonly AdminNavItem[];
};

export function AdminShell({ children, navItems }: AdminShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [hasUnresolvedSupportTickets, setHasUnresolvedSupportTickets] =
    useState(false);
  const ToggleIcon = isSidebarOpen ? PanelLeftClose : PanelLeftOpen;
  const notificationItemHrefs = hasUnresolvedSupportTickets
    ? [APP_ROUTES.adminSupportTickets]
    : [];

  useEffect(() => {
    let isActive = true;

    async function loadSupportNotification() {
      try {
        const hasUnresolvedTickets = await getHasUnresolvedSupportTicketsApi();
        if (isActive) setHasUnresolvedSupportTickets(hasUnresolvedTickets);
      } catch {
        if (isActive) setHasUnresolvedSupportTickets(false);
      }
    }

    void loadSupportNotification();
    const interval = window.setInterval(loadSupportNotification, 60_000);

    return () => {
      isActive = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-text-primary">
      <div
        className={`grid min-h-screen transition-[grid-template-columns] duration-300 ${
          isSidebarOpen
            ? "lg:grid-cols-[17rem_minmax(0,1fr)]"
            : "lg:grid-cols-[5rem_minmax(0,1fr)]"
        }`}
      >
        <aside className="hidden border-r border-black/10 bg-white lg:block">
          <div className="sticky top-0 flex h-screen flex-col">
            <div className="flex h-20 items-center gap-3 border-b border-black/10 px-4">
              <Image src="/logo_png.png" width={52} height={52} alt="Yaagam" />
              {isSidebarOpen && (
                <div className="min-w-0">
                  <p className="text-lg font-extrabold leading-6">Yaagam</p>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-saffron">
                    Admin
                  </p>
                </div>
              )}
            </div>

            <AdminNav
              items={navItems}
              isCollapsed={!isSidebarOpen}
              notificationItemHrefs={notificationItemHrefs}
              variant="sidebar"
            />

            <div className="border-t border-black/10 p-4">
              <Link
                href={APP_ROUTES.home}
                aria-label="Open website"
                title="Open website"
                className={`flex min-h-10 items-center justify-center rounded-full border border-black/10 px-4 py-2 text-sm font-extrabold text-text-primary transition-colors hover:border-saffron hover:text-saffron ${
                  isSidebarOpen ? "" : "px-2"
                }`}
              >
                {isSidebarOpen ? "Open website" : "Web"}
              </Link>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-40 border-b border-black/10 bg-white/90 backdrop-blur-xl">
            <div className="flex min-h-16 items-center justify-between gap-4 px-4 md:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                  aria-pressed={isSidebarOpen}
                  title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                  onClick={() => setIsSidebarOpen((current) => !current)}
                  className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10 text-text-primary transition-colors hover:border-saffron hover:text-saffron lg:inline-flex"
                >
                  <ToggleIcon className="h-5 w-5" />
                </button>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-saffron">
                    Admin Panel
                  </p>
                  <h1 className="text-lg font-extrabold leading-6 text-text-primary md:text-xl">
                    Operations Dashboard
                  </h1>
                </div>
              </div>

              <Link
                href={APP_ROUTES.home}
                className="hidden min-h-10 items-center rounded-full border border-black/10 px-4 py-2 text-sm font-extrabold text-text-primary transition-colors hover:border-saffron hover:text-saffron sm:inline-flex"
              >
                Open website
              </Link>
            </div>

            <AdminNav
              items={navItems}
              notificationItemHrefs={notificationItemHrefs}
              variant="mobile"
            />
          </header>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
