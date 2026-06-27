import type { MyPoojaDisplayStatus } from "@/lib/api/user/my-poojas.api";

export const MY_POOJAS_PAGE_SIZE = 20;

export type StatusFilter = "all" | "Booked" | "Scheduled" | "Processing" | "Completed";

export const MY_POOJA_FILTERS: Array<{ id: StatusFilter; label: string }> = [
  { id: "all", label: "All Poojas" },
  { id: "Booked", label: "Booked" },
  { id: "Scheduled", label: "Scheduled" },
  { id: "Processing", label: "Processing" },
  { id: "Completed", label: "Completed" },
];

export const MY_POOJA_STATUS_STYLES: Record<MyPoojaDisplayStatus, string> = {
  Booked: "bg-[#e9f1ff] text-[#2463d5]",
  Scheduled: "bg-[#fff1dc] text-[#e67e22]",
  Processing: "bg-[#f4e8ff] text-[#9b45df]",
  Completed: "bg-[#e7f8ee] text-[#1f9b52]",
};

export const MY_POOJA_FALLBACK_IMAGES = [
  "/nava_graha.png",
  "/guru_graha.png",
  "/shani_graha.png",
  "/chandra_graha.png",
];