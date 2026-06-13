"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, Flower, Languages } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const isHomePage = pathname === "/";
  const isTransparent = isHomePage && !isScrolled;

  useEffect(() => {
    const updateNavbar = () => setIsScrolled(window.scrollY > 16);

    updateNavbar();
    window.addEventListener("scroll", updateNavbar, { passive: true });

    return () => window.removeEventListener("scroll", updateNavbar);
  }, []);

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
      <div className="container mx-auto flex items-center justify-between gap-3 px-4 md:px-8">
        <div className="flex min-w-0 items-center gap-3 md:gap-8">
          <Link
            href="/"
            aria-label="Yaagam home"
            className="flex h-12 shrink-0 items-center gap-2 text-saffron"
          >
            <Image src="/logo_png.png" width="80" height="80" alt={'yaagam_logo'} />
          </Link>

          <nav
            aria-label="Main navigation"
            className={`flex items-center gap-1 text-base font-bold transition-colors duration-300 md:gap-2 ${
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
              Poojas
            </Link>
            <Link
              href="#panchang"
              className="hidden h-12 items-center gap-2 px-3 transition-colors hover:text-saffron lg:flex"
            >
              <Calendar className="h-5 w-5" />
              Panchang
            </Link>
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2 md:gap-3">
          <button
            type="button"
            aria-label="Select language"
            className={`hidden h-12 items-center gap-2 px-3 text-base font-bold transition-colors hover:text-saffron md:flex ${
              isTransparent ? "text-white" : "text-text-primary"
            }`}
          >
            <Languages className="h-5 w-5" />
            English
          </button>

          <Button
            variant="default"
            className="h-12 rounded-full bg-saffron px-5 text-base font-bold hover:bg-[#c96c1a] md:px-7"
          >
            Login
          </Button>
        </div>
      </div>
    </header>
  );
}
