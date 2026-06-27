import { AdminShell } from "@/components/admin/AdminShell";
import { ADMIN_NAV_ITEMS } from "@/constants/admin-nav.const";


export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AdminShell navItems={ADMIN_NAV_ITEMS}>{children}</AdminShell>;
}
