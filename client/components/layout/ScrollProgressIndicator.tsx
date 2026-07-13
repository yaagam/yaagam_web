"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { APP_ROUTES } from "@/constants/route.const";
import { stripLocalePrefix } from "@/translations/locales";

export function ScrollProgressIndicator() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [hasStartedScroll, setHasStartedScroll] = useState(false);
  const currentPathname = stripLocalePrefix(pathname).pathnameWithoutLocale;
  const isHomePage = currentPathname === APP_ROUTES.home;
  const isVisible = !isHomePage || hasStartedScroll;

  useEffect(() => {
    let frameId = 0;

    function updateProgress() {
      window.cancelAnimationFrame(frameId);

      frameId = window.requestAnimationFrame(() => {
        const scrollTop =
          window.scrollY || document.documentElement.scrollTop || 0;
        const scrollableHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        const nextProgress =
          scrollableHeight > 0
            ? Math.min(100, Math.max(0, (scrollTop / scrollableHeight) * 100))
            : 0;

        setProgress(nextProgress);
        setHasStartedScroll(scrollTop > 2);
      });
    }

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, [pathname]);

  return (
    <div
      aria-hidden="true"
      className={[
        "pointer-events-none fixed inset-x-0 top-0 z-[120] h-1 overflow-hidden bg-transparent transition-opacity duration-200",
        isVisible ? "opacity-100" : "opacity-0",
      ].join(" ")}
    >
      <div
        className="h-full rounded-r-full bg-gradient-to-r from-[#e36b00] via-[#ffb13d] to-[#e67e22] shadow-[0_0_10px_rgba(230,126,34,0.55)] transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}