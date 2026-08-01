"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackToTopButtonProps {
  targetId?: string;
  className?: string;
}

export function BackToTopButton({ targetId, className }: BackToTopButtonProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button after scrolling down 300px
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTarget = () => {
    if (targetId) {
      const element = document.getElementById(targetId);
      if (element) {
        // Adding a slight offset for the header if needed, but standard scrollIntoView works best for sections
        element.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    
    // Default fallback to top
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <button
      onClick={scrollToTarget}
      aria-label="Back to top"
      className={cn(
        "fixed right-4 z-[90] flex h-12 w-12 items-center justify-center rounded-full bg-[#0d296e] text-white shadow-lg shadow-[#0d296e]/30 transition-all hover:bg-[#0a205a] hover:scale-105 active:scale-95 animate-in fade-in zoom-in duration-300 md:right-8",
        // Default positioning assuming mobile bottom nav is around 88px tall.
        // We place this slightly above it.
        "bottom-28 md:bottom-8",
        className
      )}
    >
      <ArrowUp className="h-6 w-6" />
    </button>
  );
}
