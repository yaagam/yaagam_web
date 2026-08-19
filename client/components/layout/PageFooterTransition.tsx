"use client";

import { usePathname } from "next/navigation";

import { APP_ROUTES } from "@/constants/route.const";
import { stripLocalePrefix } from "@/translations/locales";

export function PageFooterTransition() {
  const pathname = usePathname();
  const currentPathname = stripLocalePrefix(pathname).pathnameWithoutLocale;

  if (currentPathname === APP_ROUTES.home) return null;

  return (
    <div
      aria-hidden="true"
      className="-mt-6 h-14 bg-gradient-to-b from-white/0 via-[#fffbf5] to-[#fff8e8] sm:-mt-8 sm:h-16"
    />
  );
}