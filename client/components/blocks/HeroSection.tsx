"use client";

import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BadgeCheck,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";

const BANNER_IMAGES = [
  {
    src: "/banner.png",
    alt: "Traditional temple ritual illuminated by warm lamps",
  },
  {
    src: "/budha_graha.png",
    alt: "Sacred Hindu temple prepared for worship",
  },
  {
    src: "/shani_graha.png",
    alt: "Devotional temple ceremony in India",
  },
  {
    src: "/shukra_graha.png",
    alt: "Temple lamps glowing during a sacred ceremony",
  },
];

export function HeroSection() {
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveImage((current) => (current + 1) % BANNER_IMAGES.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <section className="relative flex min-h-160 w-full items-center overflow-hidden bg-[#1D1107] md:min-h-170 lg:min-h-[min(720px,100svh)]">
      <div className="absolute inset-0 h-full w-full">
        {BANNER_IMAGES.map((image, index) => (
          <div
            key={image.src}
            role="img"
            aria-label={image.alt}
            style={{ backgroundImage: `url(${image.src})` }}
            className={`absolute inset-0 bg-cover bg-fixed bg-position-[62%_center] bg-no-repeat transition-opacity duration-700 ease-in-out md:bg-center ${
              index === activeImage ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-linear-to-r from-black/90 via-black/55 to-black/5" />
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-black/15" />
      </div>

      <div className="relative z-10 w-full px-4 pb-20 pt-24 text-white sm:px-5 md:px-7 md:pb-20 md:pt-28 lg:px-15">
        <div className="max-w-3xl">
          <p className="mb-3 flex items-center gap-2 text-sm font-bold tracking-wide text-white/60 sm:text-base">
            <BadgeCheck className="h-4 w-4 shrink-0 text-saffron sm:h-5 sm:w-5" />
            Trusted temple rituals, made accessible
          </p>
          <h1 className="mb-5 max-w-3xl text-[2.35rem] font-extrabold leading-[1.04] tracking-[-0.035em] sm:text-[2.8rem] md:text-[3.25rem] lg:text-[3.75rem]">
            <span className="block">Bring devotion home.</span>
            <span className="mt-1.5 block text-white/85">Book poojas with</span>
            <span className="yaagam-glow mt-1.5 block w-fit text-saffron">
              YAAGAM.
            </span>
          </h1>
          
          <p className="mb-6 max-w-xl text-sm leading-6 text-white/65 sm:text-base md:max-w-2xl md:text-lg md:leading-7">
            Join authentic rituals performed by trusted Vedic pandits at sacred temples across India.
          </p>

          <a href="#upcoming-poojas">
            <Button variant="default" className="mb-7 h-12 rounded-full bg-saffron px-7 text-base font-bold text-white shadow-lg shadow-black/20 hover:bg-[#c96c1a]">
              Explore Poojas
              <ArrowRight className="h-4 w-4" />
            </Button>
          </a>

          <div className="grid max-w-3xl gap-3 border-t border-white/15 pt-5 text-white/65 sm:grid-cols-3">
            <div className="flex items-center gap-3">
               <BadgeCheck className="h-5 w-5 shrink-0 text-saffron" />
               <span className="text-sm leading-5">Authentic rituals by Vedic pandits</span>
            </div>
            <div className="flex items-center gap-3">
               <MapPin className="h-5 w-5 shrink-0 text-saffron" />
               <span className="text-sm leading-5">Sacred temples across India</span>
            </div>
            <div className="flex items-center gap-3">
               <ShieldCheck className="h-5 w-5 shrink-0 text-saffron" />
               <span className="text-sm leading-5">Trusted and secure booking</span>
            </div>
          </div>
        </div>
      </div>

      <div
        className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-0.5 md:bottom-7"
        aria-label="Select banner image"
      >
        {BANNER_IMAGES.map((image, index) => (
          <button
            key={image.src}
            type="button"
            onClick={() => setActiveImage(index)}
            aria-label={`Show banner image ${index + 1}`}
            aria-current={index === activeImage ? "true" : undefined}
            className="group flex h-10 w-9 items-center justify-center"
          >
            <span
              className={`block h-1.5 rounded-full transition-all duration-300 group-hover:bg-saffron ${
                index === activeImage
                  ? "w-7 bg-saffron shadow-[0_0_10px_rgba(230,126,34,0.8)]"
                  : "w-4 bg-white/55"
              }`}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
