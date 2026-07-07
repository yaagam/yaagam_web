import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import { notFound } from "next/navigation";

import { AuthProvider } from "@/components/providers/AuthProvider";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { getSeoAlternates } from "@/translations/metadata";
import { isLanguage, languages, type Language } from "@/translations/locales";
import "../globals.css";

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-nunito-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "") ||
      "https://yaagam.in",
  ),
  title: "Yaagam - Authentic Vedic Poojas",
  description:
    "Book authentic Vedic Poojas with Yaagam. Experience the blessings of divined rituals from sacred temples.",
  alternates: getSeoAlternates("/"),
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
    <html lang={language} className={`${nunitoSans.variable} antialiased`}>
      <body className="font-sans flex flex-col min-h-screen">
        <LanguageProvider initialLanguage={language}>
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}