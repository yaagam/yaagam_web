export const APP_ROUTES = {
  home: "/",
  aboutUs: "/about-us",
  poojas: "/poojas",
  temples: "/temples",
  templeDetails: (id: string) => `/temples/${id}`,
  poojaDetails: (id: string) => `/poojas/${id}`,
  poojaBooking: (id: string, plan?: string) =>
    `/poojas/${id}/booking${plan ? `?plan=${plan}` : ""}`,
  user: "/user",
  userMyPoojas: "/user/my-poojas",
  privacyPolicy: "/privacy-policy",
  termsAndConditions: "/terms-and-conditions",
  refundCancellationPolicy: "/refund-cancellation-policy",
  servicePartnerVendorCode: "/service-partner-vendor-code-of-conduct",
} as const;

export const SECTION_ROUTES = {
  poojas: "#poojas",
  panchang: "#panchang",
  upcomingPoojas: "#upcoming-poojas",
} as const;

export const EXTERNAL_ROUTES = {
  supportEmail: "mailto:support@yaagam.in",
} as const;

export const PLACEHOLDER_ROUTE = "#";