import Image from "next/image";
import { ArrowLeft } from "lucide-react";

import { LocalizedLink } from "@/components/ui/localized-link";

export default function NotFound() {
  return (
    <section className="flex flex-1 items-center justify-center px-6 py-12 sm:py-16">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
        <Image
          src="/404.jpeg"
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
            We couldn&apos;t find the page you were looking for. Let&apos;s
            guide you back to Yaagam.
          </p>
        </div>

        <LocalizedLink
          href="/"
          className="group mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-saffron px-6 py-3 font-semibold text-white shadow-lg shadow-orange-200 transition-colors hover:bg-gradient-end"
        >
          <ArrowLeft aria-hidden="true" className="motion-arrow-left size-5" />
          Back to home
        </LocalizedLink>
      </div>
    </section>
  );
}
