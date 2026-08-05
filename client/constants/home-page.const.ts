import { BookOpenText, CalendarDays, Landmark, Sparkles } from "lucide-react";

import type { PoojaLanguage } from "@/lib/api/pooja/poojas.api";
import type { Language } from "@/translations/locales";

export type HomeDbLanguage = PoojaLanguage;

export const UPCOMING_POOJAS_LIMIT = 6;

export const HOME_DB_LANGUAGE_BY_UI_LANGUAGE: Record<Language, HomeDbLanguage> = {
  en: "EN",
  hi: "HI",
  ml: "ML",
  mr: "MR",
  ta: "TA",
};

export const DAY_INDEX_BY_NAME: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

export const GUIDE_ICONS = [CalendarDays, Sparkles, BookOpenText, Landmark];
export const DEVOTEE_AVATAR_BASE_URL = "/users";
export const DEVOTEE_AVATAR_URLS = Array.from(
  { length: 14 },
  (_, index) => `${DEVOTEE_AVATAR_BASE_URL}/${index + 1}.avif`,
);

export const TESTIMONIALS = [
  {
    name: "Paresh Nikita",
    location: "Mumbai, Maharashtra",
    rating: 5,
    review:
      "Very well organised. We could participate in the pooja easily from home and received every update on time.",
    image: DEVOTEE_AVATAR_URLS[0],
  },
  {
    name: "Nanda Mittra",
    location: "Lucknow, Uttar Pradesh",
    rating: 5,
    review:
      "The pooja was offered in my name and gotra. The process was simple, clear, and deeply satisfying.",
    image: DEVOTEE_AVATAR_URLS[3],
  },
  {
    name: "B Sivaraman",
    location: "Hyderabad, Telangana",
    rating: 5,
    review:
      "Excellent service and a very peaceful experience. The updates made us feel part of the ceremony.",
    image: DEVOTEE_AVATAR_URLS[6],
  },
  {
    name: "Sharmela Yalisetty",
    location: "Hyderabad, Telangana",
    rating: 5,
    review:
      "A genuine service with timely communication. Receiving the prasad at home was very special.",
    image: DEVOTEE_AVATAR_URLS[9],
  },
];