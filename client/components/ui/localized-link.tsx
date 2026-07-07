"use client";

import Link from "next/link";
import React from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { localizePath } from "@/translations/locales";

type LocalizedLinkProps = React.ComponentProps<typeof Link>;

export const LocalizedLink = React.forwardRef<HTMLAnchorElement, LocalizedLinkProps>(
  ({ href, ...props }, ref) => {
    const { language } = useLanguage();
    
    let localizedHref = href;
    if (typeof href === "string" && href.startsWith("/")) {
      localizedHref = localizePath(href, language);
    }

    return <Link ref={ref} href={localizedHref} {...props} />;
  }
);
LocalizedLink.displayName = "LocalizedLink";
