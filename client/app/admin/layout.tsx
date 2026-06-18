import { AdminShell } from "@/components/admin/AdminShell";
import { APP_ROUTES, SECTION_ROUTES } from "@/constants/route.const";

const adminNavItems = [
  { label: "Dashboard", href: APP_ROUTES.admin, icon: "dashboard" },
  { label: "Temples", href: APP_ROUTES.adminTemples, icon: "temples" },
  { label: "Bookings", href: SECTION_ROUTES.adminBookingQueue, icon: "bookings" },
  { label: "Schedule", href: SECTION_ROUTES.adminSchedule, icon: "schedule" },
  { label: "Dispatch", href: SECTION_ROUTES.adminDispatch, icon: "dispatch" },
  { label: "Devotees", href: SECTION_ROUTES.adminDevotees, icon: "devotees" },
  { label: "Reports", href: SECTION_ROUTES.adminReports, icon: "reports" },
  { label: "Payouts", href: SECTION_ROUTES.adminPayouts, icon: "payouts" },
  { label: "Settings", href: SECTION_ROUTES.adminSettings, icon: "settings" },
] as const;

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AdminShell navItems={adminNavItems}>{children}</AdminShell>;
}
