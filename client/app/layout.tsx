import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-nunito-sans",
});

export const metadata: Metadata = {
  title: "Yaagam - Authentic Vedic Poojas",
  description: "Book authentic Vedic Poojas with Yaagam. Experience the blessings of divined rituals from sacred temples.",
  icons: {
    icon: "/logo_png.png",
    shortcut: "/logo_png.png",
    apple: "/logo_png.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nunitoSans.variable} antialiased`}>
      <body className="font-sans flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 w-full flex flex-col">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
