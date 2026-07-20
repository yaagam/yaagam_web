import { State } from "country-state-city";
import { Camera, Heart, Lock, MapPin } from "lucide-react";

import type { PoojaTranslation } from "@/lib/api/pooja/poojas.api";

export type BookingDbLanguage = PoojaTranslation["language"];

export const DB_LANGUAGE_BY_APP_LANGUAGE: Record<string, BookingDbLanguage> = {
  en: "EN",
  ml: "ML",
  hi: "HI",
  mr: "MR",
  ta: "TA",
};

export const SOUTH_INDIAN_STATES = new Set([
  "Andhra Pradesh",
  "Karnataka",
  "Kerala",
  "Lakshadweep",
  "Puducherry",
  "Tamil Nadu",
  "Telangana",
]);

export const SOUTH_INDIAN_STATE_CODES = new Set([
  "AP",
  "KA",
  "KL",
  "LD",
  "PY",
  "TN",
  "TG",
]);

export const NAALS_NORTH = [
  "Ashwini",
  "Bharani",
  "Krittika",
  "Rohini",
  "Mrigashirsha",
  "Ardra",
  "Punarvasu",
  "Pushya",
  "Ashlesha",
  "Magha",
  "Purva Phalguni",
  "Uttara Phalguni",
  "Hasta",
  "Chitra",
  "Swati",
  "Vishakha",
  "Anuradha",
  "Jyeshtha", 
  "Mula",
  "Purva Ashadha",
  "Uttara Ashadha",
  "Shravana",
  "Dhanishta",
  "Shatabhisha",
  "Purva Bhadrapada",
  "Uttara Bhadrapada",
  "Revati",
];

export const NAALS_SOUTH = [
  "Aswathi",
  "Bharani",
  "Karthigai",
  "Rohini",
  "Mrigaseerisham",
  "Thiruvathirai",
  "Punarpoosam",
  "Poosam",
  "Ayilyam",
  "Magam",
  "Pooram",
  "Uthiram",
  "Hastham",
  "Chithirai",
  "Swathi",
  "Visakam",
  "Anusham",
  "Kettai",
  "Moolam",
  "Pooradam",
  "Uthradam",
  "Thiruvonam",
  "Avittam",
  "Sathayam",
  "Poorattathi",
  "Uthirattathi",
  "Revathi",
];

export const INDIAN_STATES = State.getStatesOfCountry("IN");

export const SESSION_EXPIRED_ERROR = "Session Expired";

export const BOOKING_TRUST_ITEM_ICONS = [Lock, MapPin, Camera, Heart];

export const DEFAULT_BOOKING_FORM = {
  name: "",
  whatsappNumber: "",
  state: "",
  naal: "",
  sankalpa: "",
  wantsPrasad: false,
  houseNo: "",
  streetName: "",
  pincode: "",
  district: "",
  phoneNumber: "",
};