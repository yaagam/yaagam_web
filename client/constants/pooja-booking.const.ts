import { State } from "country-state-city";
import { Camera, Heart, Lock, MapPin } from "lucide-react";

import type { PoojaTranslation } from "@/lib/api/admin/pooja/poojas.api";

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

export const NAKSHATRAS = [
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

export const NAAL_OPTIONS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const INDIAN_STATES = State.getStatesOfCountry("IN");

export const SESSION_EXPIRED_ERROR = "Session Expired";

export const BOOKING_TRUST_ITEM_ICONS = [Lock, MapPin, Camera, Heart];

export const DEFAULT_BOOKING_FORM = {
  name: "",
  whatsappNumber: "",
  state: "",
  nakshatra: "",
  naal: "",
  sankalpa: "",
  wantsPrasad: false,
  houseNo: "",
  streetName: "",
  pincode: "",
  district: "",
  phoneNumber: "",
};