"use client";

import Link from "next/link";
import { Calendar, Flower, Menu, X } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { WhatsAppLoginModal } from "@/components/auth/WhatsAppLoginModal";
import { LanguageSelector } from "@/components/ui/language-selector";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function Navbar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const isHomePage = pathname === "/";
  const isTransparent = isHomePage && !isScrolled;

  useEffect(() => {
    const updateNavbar = () => setIsScrolled(window.scrollY > 16);

    updateNavbar();
    window.addEventListener("scroll", updateNavbar, { passive: true });

    return () => window.removeEventListener("scroll", updateNavbar);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;

    function closeOnOutsideClick(event: PointerEvent) {
      if (!mobileMenuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsMenuOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isMenuOpen]);

  return (
    <header
      className={`top-0 z-50 flex h-20 w-full items-center transition-colors duration-300 ${
        isHomePage ? "fixed" : "sticky"
      } ${
        isTransparent
          ? "border-b border-transparent bg-transparent"
          : "border-b border-black/10 bg-white/75 shadow-sm shadow-black/5 backdrop-blur-xl"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between gap-3 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3 md:gap-8">
          <Link
            href="/"
            aria-label="Yaagam home"
            className="flex h-12 shrink-0 items-center gap-2 text-saffron"
          >
            <Image src="/logo_png.png" width="80" height="80" alt={'yaagam_logo'} />
          </Link>

          <nav
            aria-label={t.nav.mainNavigation}
            className={`hidden items-center gap-1 text-base font-bold transition-colors duration-300 md:flex md:gap-2 ${
              isTransparent ? "text-white" : "text-text-primary"
            }`}
          >
            <Link
              href="#poojas"
              className="flex h-12 items-center gap-2 px-2 transition-colors hover:text-saffron md:px-3"
            >
              <span className="hidden sm:inline-flex">
                <Flower />
              </span>
              {t.nav.poojas}
            </Link>
            <Link
              href="#panchang"
              className="hidden h-12 items-center gap-2 px-3 transition-colors hover:text-saffron lg:flex"
            >
              <Calendar className="h-5 w-5" />
              {t.nav.panchang}
            </Link>
          </nav>
        </div>

        <div className="hidden shrink-0 items-center gap-2 md:flex md:gap-3">
          <LanguageSelector className={isTransparent ? "text-white" : "text-text-primary"} />

          <WhatsAppLoginModal />
        </div>

        <div ref={mobileMenuRef} className="relative md:hidden">
          <button
            type="button"
            aria-label={isMenuOpen ? t.nav.closeMenu : t.nav.openMenu}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setIsMenuOpen((current) => !current)}
            className={`flex h-11 w-11 items-center justify-center rounded-full border transition-colors ${
              isTransparent && !isMenuOpen
                ? "border-saffron bg-black/10 text-white hover:bg-white/15"
                : "border-black/10 bg-white text-text-primary shadow-sm hover:text-saffron hover:border-saffron"
            }`}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          <div
            id="mobile-navigation"
            aria-hidden={!isMenuOpen}
            className={`absolute right-0 top-[calc(100%+0.75rem)] w-[min(19rem,calc(100vw-2rem))] rounded-2xl border border-black/10 bg-white p-3 text-text-primary shadow-2xl shadow-black/20 transition-all duration-200 ${
              isMenuOpen
                ? "visible translate-y-0 scale-100 opacity-100"
                : "pointer-events-none invisible -translate-y-2 scale-95 opacity-0"
            }`}
          >
            <nav aria-label={t.nav.mobileNavigation} className="space-y-1">
              <Link
                href="#poojas"
                onClick={() => setIsMenuOpen(false)}
                className="flex h-12 items-center gap-3 rounded-xl px-4 text-base font-bold transition-colors hover:bg-orange-50 hover:text-saffron"
              >
                <Flower className="h-5 w-5" />
                {t.nav.poojas}
              </Link>
              <Link
                href="#panchang"
                onClick={() => setIsMenuOpen(false)}
                className="flex h-12 items-center gap-3 rounded-xl px-4 text-base font-bold transition-colors hover:bg-orange-50 hover:text-saffron"
              >
                <Calendar className="h-5 w-5" />
                {t.nav.panchang}
              </Link>
              <LanguageSelector
                className="w-full justify-start rounded-xl px-4 hover:bg-orange-50"
                menuClassName="left-0 right-auto top-[calc(100%+0.25rem)] w-full"
                onSelect={() => setIsMenuOpen(false)}
              />
            </nav>

            <div className="mt-3 border-t border-black/10 pt-3">
              <WhatsAppLoginModal
                triggerClassName="w-full rounded-xl md:px-7"
                onTriggerClick={() => setIsMenuOpen(false)}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
