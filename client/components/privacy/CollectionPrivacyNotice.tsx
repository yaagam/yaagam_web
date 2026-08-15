"use client";

import { useState } from "react";
import Link from "next/link";

import { APP_ROUTES } from "@/constants/route.const";

export function CollectionPrivacyNotice({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="text-xs leading-5 text-text-primary/60">
      <p>
        {children}{" "}
        <Link className="font-semibold text-saffron underline underline-offset-2" href={APP_ROUTES.privacyPolicy}>Privacy Policy</Link>
        {!expanded && "."}
      </p>
      {expanded && (
        <p className="mt-1">
          You may withdraw consent or request access, correction or deletion through the Privacy Policy or support@yaagam.in.
        </p>
      )}
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)} className="mt-1 font-semibold text-saffron underline underline-offset-2">
        {expanded ? "Less" : "More"}
      </button>
    </div>
  );
}