"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import Script from "next/script";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Button } from "@/components/ui/button";

import { APP_ROUTES } from "@/constants/route.const";

type ConsentChoice = "accepted" | "rejected" | null;
type ConsentContextValue = { analyticsAllowed: boolean; mediaAllowed: boolean };
const CONSENT_KEY = "yaagam-cookie-consent-v1";
const OPEN_EVENT = "yaagam-open-cookie-settings";
const ConsentContext = createContext<ConsentContextValue>({ analyticsAllowed: false, mediaAllowed: false });

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [choice, setChoice] = useState<ConsentChoice>(null);
  const [ready, setReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const initializeConsent = window.setTimeout(() => {
      const saved = window.localStorage.getItem(CONSENT_KEY);
      setChoice(saved === "accepted" || saved === "rejected" ? saved : null);
      setReady(true);
    }, 0);
    const open = () => setSettingsOpen(true);
    window.addEventListener(OPEN_EVENT, open);
    return () => {
      window.clearTimeout(initializeConsent);
      window.removeEventListener(OPEN_EVENT, open);
    };
  }, []);

  function save(next: Exclude<ConsentChoice, null>) {
    window.localStorage.setItem(CONSENT_KEY, next);
    setChoice(next);
    setSettingsOpen(false);
  }

  const value = useMemo(() => ({ analyticsAllowed: choice === "accepted", mediaAllowed: choice === "accepted" }), [choice]);
  const measurementId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID?.trim();

  return (
    <ConsentContext.Provider value={value}>
      {children}
      {choice === "accepted" && <><Analytics /><SpeedInsights />{measurementId && <>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`} strategy="afterInteractive" />
        <Script id="yaagam-google-analytics" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${measurementId}',{anonymize_ip:true});`}</Script>
      </>}</>}
      {ready && (choice === null || settingsOpen) && <section role="dialog" aria-modal="true" aria-labelledby="cookie-title" className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-3xl rounded-2xl border border-black/10 bg-white p-5 text-text-primary shadow-2xl md:bottom-6 md:p-6">
        <h2 id="cookie-title" className="text-lg font-extrabold">Your privacy choices</h2>
        <p className="mt-2 text-sm leading-6 text-text-primary/75">We use essential storage for login, security, language and checkout. With your permission, we also use analytics to improve YAAGAM and load third-party media such as YouTube. You can change this choice later from Cookie settings in the footer.</p>
        <Link href={APP_ROUTES.privacyPolicy} className="mt-2 inline-block text-sm font-medium text-saffron underline underline-offset-2">Read the Privacy & Cookie Policy</Link>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => save("rejected")}>Essential only</Button><Button type="button" onClick={() => save("accepted")}>Accept optional cookies</Button></div>
      </section>}
    </ConsentContext.Provider>
  );
}

export function useCookieConsent() { return useContext(ConsentContext); }
export function openCookieSettings() { if (typeof window !== "undefined") window.dispatchEvent(new Event(OPEN_EVENT)); }