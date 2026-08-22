export const APP_ROUTES = {
  home: "/",
  aboutUs: "/about-us",
  poojas: "/poojas",
  temples: "/temples",
  templeDetails: (id: string) => `/temples/${id}`,
  poojaDetails: (id: string) => `/poojas/${id}`,
  poojaBooking: (id: string, plan?: string, selectedPoojaDate?: string) => {
    const searchParams = new URLSearchParams();
    if (plan) searchParams.set("plan", plan);
    if (selectedPoojaDate)
      searchParams.set("selectedPoojaDate", selectedPoojaDate);
    const query = searchParams.toString();
    return `/poojas/${id}/booking${query ? `?${query}` : ""}`;
  },
  user: "/user",
  userMyPoojas: "/user/my-poojas",
  poojaTracking: (bookingNumber: string) =>
    `/user/my-poojas/${encodeURIComponent(bookingNumber)}`,
  privacyPolicy: "/privacy-policy",
  termsAndConditions: "/terms-and-conditions",
  refundCancellationPolicy: "/refund-cancellation-policy",
  grievanceRedressal: "/grievance-redressal",
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
