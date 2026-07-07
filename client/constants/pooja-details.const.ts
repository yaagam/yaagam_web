import {
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Gift,
  Home,
  MessageCircle,
  PlayCircle,
  Sparkles,
} from "lucide-react";

import type { PoojaTranslation } from "@/lib/api/admin/pooja/poojas.api";
import type { Language } from "@/translations/locales";

export type DetailDbLanguage = PoojaTranslation["language"];

export const DB_LANGUAGE_BY_UI_LANGUAGE: Record<Language, DetailDbLanguage> = {
  en: "EN",
  hi: "HI",
  ml: "ML",
  mr: "MR",
  ta: "TA",
};

export const PACKAGE_INCLUDES = [
  {
    title: "Puja Performed at Temple",
    description:
      "An experienced pandit performs the puja following proper Vedic rituals at the temple.",
    icon: Home,
  },
  {
    title: "Authentic Prasad Box",
    description:
      "Prasad prepared at the temple will be packed and delivered to your home.",
    icon: Gift,
  },
  {
    title: "Live WhatsApp Updates",
    description:
      "Get updates on WhatsApp for all important steps of your puja.",
    icon: MessageCircle,
  },
  {
    title: "Personalised Puja Video",
    description:
      "Full video of your puja with sankalp, chanting, and a WhatsApp link.",
    icon: PlayCircle,
  },
];

export const WORKFLOW_STEPS = [
  {
    title: "Select Pooja Plan",
    description: "You are selected a pooja plan",
    icon: Check,
    tone: "border-orange-200 bg-orange-50 text-saffron",
  },
  {
    title: "Booked",
    description: "Your pooja is booked successfully.",
    icon: CalendarDays,
    tone: "border-amber-200 bg-amber-50 text-amber-700",
  },
  {
    title: "Scheduled",
    description: "Pooja is scheduled for the upcoming Monday.",
    icon: Clock3,
    tone: "border-sky-200 bg-sky-50 text-sky-700",
  },
  {
    title: "Processing",
    description: "Pooja is in progress. Please wait for updates.",
    icon: Sparkles,
    tone: "border-violet-200 bg-violet-50 text-violet-700",
  },
  {
    title: "Completed",
    description: "Photos and videos are sent on WhatsApp.",
    icon: CheckCircle2,
    tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
];

export const WEEKDAY_INDEX_BY_NAME: Record<string, number> = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  tues: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  thurs: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
};