import {
  ClipboardList,
  Flower,
  Gift,
  LayoutDashboard,
  MessageSquareText,
  Landmark,
  Users,
  type LucideIcon,
} from "lucide-react";

import { APP_ROUTES } from "@/constants/route.const";

export const ADMIN_NAV_ICONS = {
  dashboard: LayoutDashboard,
  temples: Landmark,
  benifits: Gift,
  poojas: Flower,
  users: Users,
  bookings: ClipboardList,
  support: MessageSquareText,
} satisfies Record<string, LucideIcon>;

export const ADMIN_NAV_ITEMS = [
  { label: "Dashboard", href: APP_ROUTES.admin, icon: "dashboard" },
  { label: "Temples", href: APP_ROUTES.adminTemples, icon: "temples" },
  { label: "Benifits", href: APP_ROUTES.adminBenifits, icon: "benifits" },
  { label: "Poojas", href: APP_ROUTES.adminPoojas, icon: "poojas" },
  { label: "Users", href: APP_ROUTES.adminUsers, icon: "users" },
  { label: "Bookings", href: APP_ROUTES.adminBookings, icon: "bookings" },
  { label: "Support", href: APP_ROUTES.adminSupportTickets, icon: "support" },
] as const;
