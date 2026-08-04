import type { Metadata } from "next";
import { Cinzel, Outfit } from "next/font/google";
import { notFound } from "next/navigation";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

import { ScrollProgressIndicator } from "@/components/layout/ScrollProgressIndicator";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { getSeoAlternates } from "@/translations/metadata";
import { isLanguage, languages, type Language } from "@/translations/locales";
import "../globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});
const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "") ||
      "https://yaagam.in",
  ),
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
    <html lang={language} className={`${outfit.variable} ${cinzel.variable} ${outfit.className} antialiased`}>
      <body suppressHydrationWarning className="font-sans flex flex-col min-h-screen">
        <LanguageProvider initialLanguage={language}>
          <AuthProvider>
            <ToastProvider>
              <ScrollProgressIndicator />
              {children}
              <SpeedInsights />
              <Analytics />
            </ToastProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}