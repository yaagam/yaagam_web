import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

import "./globals.css";

export const metadata: Metadata = {
  title: "Page Not Found | Yaagam",
  description: "The requested page could not be found.",
};

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body className="font-sans min-h-dvh bg-black text-white">
        <main
          className="relative isolate min-h-dvh overflow-hidden bg-cover bg-[position:center_top] bg-no-repeat sm:bg-center"
          style={{ backgroundImage: "url('/404.webp')" }}
        >
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/60 via-black/5 to-black/90 sm:from-black/55 sm:to-black/85" />

          <div className="flex min-h-dvh flex-col px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-10 sm:py-8">
            <form action="/" method="get" className="mx-auto">
              <button
                type="submit"
                className="group inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-full border border-orange-300/60 bg-black/50 px-5 py-2.5 text-sm font-semibold text-orange-200 shadow-xl backdrop-blur-md transition hover:border-orange-200 hover:bg-black/65 hover:text-white sm:min-h-12 sm:px-6 sm:py-3 sm:text-base"
              >
                <ArrowLeft
                  aria-hidden="true"
                  className="motion-arrow-left size-5"
                />
                Go back
              </button>
            </form>

            <section className="mx-auto mt-auto w-full max-w-3xl text-center sm:pb-6">
              <p className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm leading-relaxed text-white/90 shadow-lg backdrop-blur-sm sm:bg-transparent sm:px-0 sm:py-0 sm:text-base sm:shadow-none sm:backdrop-blur-none">
                The page you&apos;re looking for doesn&apos;t exist or may
                have moved. Return home and continue your spiritual journey.
              </p>
            </section>
          </div>
        </main>
      </body>
    </html>
  );
}