import type { MyPoojaDisplayStatus } from "@/lib/api/user/my-poojas.api";

export const MY_POOJAS_PAGE_SIZE = 20;

export const MY_POOJA_STATUS_STYLES: Record<MyPoojaDisplayStatus, string> = {
  "Payment Pending": "bg-amber-50 text-amber-700",
  "Payment Failed": "bg-red-50 text-red-700",
  Booked: "bg-[#e9f1ff] text-[#2463d5]",
  Scheduled: "bg-[#fff1dc] text-[#e67e22]",
  Completed: "bg-[#e7f8ee] text-[#1f9b52]",
  Cancelled: "bg-slate-100 text-slate-600",
  Refunded: "bg-violet-50 text-violet-700",
};

export const MY_POOJA_FALLBACK_IMAGES = [
  "/nava_graha.png",
  "/guru_graha.png",
  "/shani_graha.png",
  "/chandra_graha.png",
];
