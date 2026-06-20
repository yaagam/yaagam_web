export const APP_ROUTES = {
  home: "/",
  poojas: "/poojas",
  poojaDetails: (id: string) => `/poojas/${id}`,
  user: "/user",
  userMyPoojas: "/user/my-poojas",
  admin: "/admin",
  adminTemples: "/admin/temples",
  adminTempleCreate: "/admin/temples/create",
  adminTempleDetails: (id: string) => `/admin/temples/${id}`,
  adminBenifits: "/admin/benifits",
  adminBenifitCreate: "/admin/benifits/create",
  adminBenifitDetails: (id: string) => `/admin/benifits/${id}`,
  adminPoojas: "/admin/poojas",
  adminPoojaCreate: "/admin/poojas/create",
  adminPoojaDetails: (id: string) => `/admin/poojas/${id}`,
  superAdmin: "/superadmin",
} as const;

export const SECTION_ROUTES = {
  poojas: "#poojas",
  panchang: "#panchang",
  upcomingPoojas: "#upcoming-poojas",
  adminBookingQueue: `${APP_ROUTES.admin}#booking-queue`,
  adminSchedule: `${APP_ROUTES.admin}#schedule`,
  adminDispatch: `${APP_ROUTES.admin}#dispatch`,
  adminDevotees: `${APP_ROUTES.admin}#devotees`,
  adminReports: `${APP_ROUTES.admin}#reports`,
  adminPayouts: `${APP_ROUTES.admin}#payouts`,
  adminSettings: `${APP_ROUTES.admin}#settings`,
} as const;

export const EXTERNAL_ROUTES = {
  supportEmail: "mailto:support@yaagamvapp.in",
} as const;

export const PLACEHOLDER_ROUTE = "#";
