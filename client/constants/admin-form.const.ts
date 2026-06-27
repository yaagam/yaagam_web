import { State } from "country-state-city";

export const ADMIN_IMAGE_SLOT_COUNT = 4;

export const ADMIN_INDIAN_STATES = State.getStatesOfCountry("IN");

export const ADMIN_LANGUAGE_LABELS = {
  EN: "English",
  ML: "Malayalam",
  HI: "Hindi",
  MR: "Marathi",
  TA: "Tamil",
} as const;

export const POOJA_DAYS = [
  { value: "ANY", label: "Any Day" },
  { value: "SUNDAY", label: "Sunday" },
  { value: "MONDAY", label: "Monday" },
  { value: "TUESDAY", label: "Tuesday" },
  { value: "WEDNESDAY", label: "Wednesday" },
  { value: "THURSDAY", label: "Thursday" },
  { value: "FRIDAY", label: "Friday" },
  { value: "SATURDAY", label: "Saturday" },
];