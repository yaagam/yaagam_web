"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import Script from "next/script";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Button } from "@/components/ui/button";
import { APP_ROUTES } from "@/constants/route.const";

type Preferences = { analytics: boolean; advertising: boolean; media: boolean };
type ConsentContextValue = {
  analyticsAllowed: boolean;
  advertisingAllowed: boolean;
  mediaAllowed: boolean;
};

const NONE: Preferences = { analytics: false, advertising: false, media: false };
const ALL: Preferences = { analytics: true, advertising: true, media: true };
const CONSENT_KEY = "yaagam-cookie-consent-v2";
const LEGACY_KEY = "yaagam-cookie-consent-v1";
const OPEN_EVENT = "yaagam-open-cookie-settings";
const META_PIXEL_ID = "1748307893056580";
const ConsentContext = createContext<ConsentContextValue>({
  analyticsAllowed: false,
  advertisingAllowed: false,
  mediaAllowed: false,
});

function readPreferences(): { preferences: Preferences; hasChoice: boolean } {
  try {
    const value = JSON.parse(window.localStorage.getItem(CONSENT_KEY) ?? "");
    if (
      value?.version === 2 &&
      typeof value.analytics === "boolean" &&
      typeof value.advertising === "boolean" &&
      typeof value.media === "boolean"
    ) {
      return {
        preferences: {
          analytics: value.analytics,
          advertising: value.advertising,
          media: value.media,
        },
        hasChoice: true,
      };
    }
  } catch {
    // A missing or invalid record means optional processing remains disabled.
  }

  const legacy = window.localStorage.getItem(LEGACY_KEY);
  return {
    preferences: legacy === "accepted" ? ALL : NONE,
    hasChoice: legacy === "accepted" || legacy === "rejected",
  };
}

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(NONE);
  const [draft, setDraft] = useState<Preferences>(NONE);
  const [hasChoice, setHasChoice] = useState(false);
  const [ready, setReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const initialize = window.setTimeout(() => {
      const stored = readPreferences();
      setPreferences(stored.preferences);
      setDraft(stored.preferences);
      setHasChoice(stored.hasChoice);
      setReady(true);
    }, 0);
    const open = () => {
      const stored = readPreferences();
      setDraft(stored.hasChoice ? stored.preferences : ALL);
      setShowDetails(true);
      setSettingsOpen(true);
    };
    window.addEventListener(OPEN_EVENT, open);
    return () => {
      window.clearTimeout(initialize);
      window.removeEventListener(OPEN_EVENT, open);
    };
  }, []);

  function save(next: Preferences) {
    window.localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({ ...next, version: 2, updatedAt: new Date().toISOString() }),
    );
    window.localStorage.removeItem(LEGACY_KEY);
    setPreferences(next);
    setDraft(next);
    setHasChoice(true);
    setSettingsOpen(false);
    setShowDetails(false);
  }

  const value = useMemo(
    () => ({
      analyticsAllowed: preferences.analytics,
      advertisingAllowed: preferences.advertising,
      mediaAllowed: preferences.media,
    }),
    [preferences],
  );
  const measurementId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID?.trim();
  const choices = [
    ["analytics", "Analytics", "Measure visits, errors and performance using Google and Vercel."],
    ["advertising", "Advertising", "Measure campaigns and conversions using Meta Pixel."],
    ["media", "Third-party media", "Load YouTube videos, which may share device and viewing data with Google."],
  ] as const;

  return (
    <ConsentContext.Provider value={value}>
      {children}
      {preferences.analytics && (
        <>
          <Analytics />
          <SpeedInsights />
          {measurementId && (
            <>
              <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`} strategy="afterInteractive" />
              <Script id="yaagam-google-analytics" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${measurementId}',{anonymize_ip:true});`}</Script>
            </>
          )}
        </>
      )}
      {preferences.advertising && (
        <Script id="yaagam-meta-pixel" strategy="afterInteractive">{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`}</Script>
      )}
      {ready && (!hasChoice || settingsOpen) && (
        <section role="dialog" aria-modal="true" aria-labelledby="cookie-title" className={`fixed inset-x-3 bottom-3 z-[100] mx-auto rounded-2xl border border-saffron/25 bg-[#fffaf4] text-text-primary shadow-2xl md:bottom-6 ${showDetails ? "max-w-3xl p-5 md:p-6" : "max-w-6xl p-5 md:px-6 md:py-5"}`}>
          {!showDetails ? (
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-8">
              <div className="max-w-3xl">
                <h2 id="cookie-title" className="flex items-center gap-2 text-lg font-extrabold"><span aria-hidden="true">{"\uD83C\uDF6A"}</span> We value your privacy</h2>
                <p className="mt-2 text-sm leading-6 text-text-primary/70">
                  We use cookies and similar technologies to keep Yaagam secure, understand site usage and, with your permission, personalize advertising and load third-party media. You can customize your preferences or learn more in our{" "}
                  <Link href={APP_ROUTES.privacyPolicy} className="font-semibold text-saffron underline underline-offset-2">Privacy Policy</Link>.
                </p>
              </div>
              <div className="flex shrink-0 flex-col-reverse gap-3 sm:flex-row">
                <Button type="button" variant="outline" className="min-w-32 border-saffron/30 bg-white" onClick={() => { setDraft(ALL); setShowDetails(true); }}>Customize</Button>
                <Button type="button" className="min-w-32 bg-saffron text-white hover:bg-[#c96c1a]" onClick={() => save(ALL)}>Accept all</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 id="cookie-title" className="text-xl font-extrabold">Cookie preferences</h2>
                  <p className="mt-2 text-sm leading-6 text-text-primary/70">Choose which optional data uses you allow. You can change or withdraw your choice later from Cookie settings.</p>
                </div>
                {settingsOpen && <button type="button" aria-label="Close cookie preferences" onClick={() => { setSettingsOpen(false); setShowDetails(false); }} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/5 text-xl">{"\u00d7"}</button>}
              </div>
              <div className="mt-4 flex items-start justify-between gap-3 rounded-xl border border-black/10 p-4">
                <span><span className="block text-sm font-bold">Strictly necessary</span><span className="block text-xs leading-5 text-text-primary/65">Required for security, login, language, checkout and core website functions.</span></span>
                <input type="checkbox" checked disabled aria-label="Strictly necessary cookies are always enabled" className="mt-1 h-5 w-5" />
              </div>
              <fieldset className="mt-3 space-y-3">
                <legend className="sr-only">Optional data uses</legend>
                {choices.map(([key, label, description]) => (
                  <label key={key} className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-black/10 p-4">
                    <span><span className="block text-sm font-bold">{label}</span><span className="block text-xs leading-5 text-text-primary/65">{description}</span></span>
                    <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-saffron" checked={draft[key]} onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.checked }))} />
                  </label>
                ))}
              </fieldset>
              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => save(NONE)}>Decline all</Button>
                <Button type="button" variant="outline" onClick={() => save(draft)}>Save choices</Button>
                <Button type="button" className="min-w-32 bg-saffron text-white hover:bg-[#c96c1a]" onClick={() => save(ALL)}>Accept all</Button>
              </div>
            </>
          )}
        </section>
      )}
    </ConsentContext.Provider>
  );
}

export function useCookieConsent() { return useContext(ConsentContext); }
export function openCookieSettings() { if (typeof window !== "undefined") window.dispatchEvent(new Event(OPEN_EVENT)); }
