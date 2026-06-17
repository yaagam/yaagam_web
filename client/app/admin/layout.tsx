import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  CalendarClock,
  ClipboardList,
  LayoutDashboard,
  Landmark,
  PackageCheck,
  Settings,
  Users,
  WalletCards,
} from "lucide-react";

import { AdminNav } from "@/components/admin/AdminNav";

const adminNavItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Temples", href: "/admin/temples", icon: Landmark },
  { label: "Bookings", href: "/admin#booking-queue", icon: ClipboardList },
  { label: "Schedule", href: "/admin#schedule", icon: CalendarClock },
  { label: "Dispatch", href: "/admin#dispatch", icon: PackageCheck },
  { label: "Devotees", href: "/admin#devotees", icon: Users },
  { label: "Reports", href: "/admin#reports", icon: BarChart3 },
  { label: "Payouts", href: "/admin#payouts", icon: WalletCards },
  { label: "Settings", href: "/admin#settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[#f6f7fb] text-text-primary">
      <div className="grid min-h-screen lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="hidden border-r border-black/10 bg-white lg:block">
          <div className="sticky top-0 flex h-screen flex-col">
            <div className="flex h-20 items-center gap-3 border-b border-black/10 px-5">
              <Image src="/logo_png.png" width={52} height={52} alt="Yaagam" />
              <div className="min-w-0">
                <p className="text-lg font-extrabold leading-6">Yaagam</p>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-saffron">
                  Admin
                </p>
              </div>
            </div>

            <AdminNav items={adminNavItems} variant="sidebar" />

            <div className="border-t border-black/10 p-4">
              <Link
                href="/"
                className="flex min-h-10 items-center justify-center rounded-full border border-black/10 px-4 py-2 text-sm font-extrabold text-text-primary transition-colors hover:border-saffron hover:text-saffron"
              >
                Open website
              </Link>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-40 border-b border-black/10 bg-white/90 backdrop-blur-xl">
            <div className="flex min-h-16 items-center justify-between gap-4 px-4 md:px-8">
              <div className="min-w-0">
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-saffron">
                  Admin Panel
                </p>
                <h1 className="text-lg font-extrabold leading-6 text-text-primary md:text-xl">
                  Operations Dashboard
                </h1>
              </div>

              <Link
                href="/"
                className="hidden min-h-10 items-center rounded-full border border-black/10 px-4 py-2 text-sm font-extrabold text-text-primary transition-colors hover:border-saffron hover:text-saffron sm:inline-flex"
              >
                Open website
              </Link>
            </div>

            <AdminNav items={adminNavItems.slice(0, 5)} variant="mobile" />
          </header>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
