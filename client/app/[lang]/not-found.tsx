import Image from "next/image";
import { ArrowLeft } from "lucide-react";

import {
  FooterDetailsSection,
  FooterLegalSection,
} from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { SupportChatWidget } from "@/components/support/SupportChatWidget";
import { LocalizedLink } from "@/components/ui/localized-link";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <div className="flex w-full flex-1 flex-col pb-20 md:pb-0">
        <main className="flex w-full flex-1 flex-col">
          <section className="flex flex-1 items-center justify-center px-6 py-12 sm:py-16">
            <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
              <Image
                src="/404.webp"
                alt="Page not found"
                width={900}
                height={600}
                priority
                className="h-auto w-full max-w-xl object-contain"
              />

              <div className="mt-6 max-w-xl">
                <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
                  This page seems to have wandered away
                </h1>
                <p className="mt-3 text-base text-text-primary/70 sm:text-lg">
                  We couldn&apos;t find the page you were looking for.
                  Let&apos;s guide you back to Yaagam.
                </p>
              </div>

              <LocalizedLink
                href="/"
                className="group mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-saffron px-6 py-3 font-semibold text-white shadow-lg shadow-orange-200 transition-colors hover:bg-gradient-end"
              >
                <ArrowLeft
                  aria-hidden="true"
                  className="motion-arrow-left size-5"
                />
                Back to home
              </LocalizedLink>
            </div>
          </section>
        </main>
        <div className="site-layout-footer">
          <FooterDetailsSection />
          <FooterLegalSection />
        </div>
      </div>
      <SupportChatWidget />
    </>
  );
}
