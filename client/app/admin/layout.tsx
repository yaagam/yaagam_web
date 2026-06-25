import { AdminShell } from "@/components/admin/AdminShell";
import { APP_ROUTES } from "@/constants/route.const";

const adminNavItems = [
  { label: "Dashboard", href: APP_ROUTES.admin, icon: "dashboard" },
  { label: "Temples", href: APP_ROUTES.adminTemples, icon: "temples" },
  { label: "Benifits", href: APP_ROUTES.adminBenifits, icon: "benifits" },
  { label: "Poojas", href: APP_ROUTES.adminPoojas, icon: "poojas" },
  { label: "Users", href: APP_ROUTES.adminUsers, icon: "users" },
  { label: "Bookings", href: APP_ROUTES.adminBookings, icon: "bookings" },
] as const;

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AdminShell navItems={adminNavItems}>{children}</AdminShell>;
}
