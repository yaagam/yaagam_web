import type { Metadata } from "next";
import {
  Anek_Devanagari,
  Anek_Latin,
  Anek_Malayalam,
  Anek_Tamil,
  Cinzel,
} from "next/font/google";
import { notFound } from "next/navigation";

import { ScrollProgressIndicator } from "@/components/layout/ScrollProgressIndicator";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { CookieConsentProvider } from "@/components/providers/CookieConsentProvider";
import { isLanguage, languages, type Language } from "@/translations/locales";
import { getSiteUrl } from "@/translations/metadata";
import "../globals.css";

const anekLatin = Anek_Latin({
  subsets: ["latin"],
  variable: "--font-anek-latin",
});
const anekDevanagari = Anek_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-anek-devanagari",
});
const anekMalayalam = Anek_Malayalam({
  subsets: ["malayalam"],
  variable: "--font-anek-malayalam",
});
const anekTamil = Anek_Tamil({
  subsets: ["tamil"],
  variable: "--font-anek-tamil",
});
const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "Yaagam - Authentic Vedic Poojas",
  description:
    "Book authentic Vedic Poojas with Yaagam. Experience the blessings of divined rituals from sacred temples.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export function generateStaticParams() {
  return languages.map((lang) => ({ lang }));
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;
  if (!isLanguage(lang)) notFound();

  const language: Language = lang;

  return (
    <html
      lang={language}
      data-scroll-behavior="smooth"
      className={`${anekLatin.variable} ${anekDevanagari.variable} ${anekMalayalam.variable} ${anekTamil.variable} ${cinzel.variable} antialiased`}
    >
      <body suppressHydrationWarning className="font-sans flex flex-col min-h-screen">
        <LanguageProvider key={language} initialLanguage={language}>
          <AuthProvider>
            <CookieConsentProvider>
              <ToastProvider>
                <ScrollProgressIndicator />
                {children}
              </ToastProvider>
            </CookieConsentProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}