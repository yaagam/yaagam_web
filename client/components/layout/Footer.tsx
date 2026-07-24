"use client";

import { LocalizedLink as Link } from "@/components/ui/localized-link";
import Image from "next/image";
import { useLanguage } from "@/components/providers/LanguageProvider";
import {
  APP_ROUTES,
  EXTERNAL_ROUTES,
  PLACEHOLDER_ROUTE,
  SECTION_ROUTES,
} from "@/constants/route.const";
import { cn } from "@/lib/utils";

type FooterLegalSectionProps = {
  className?: string;
  containerClassName?: string;
  termsLabel?: string;
  refundLabel?: string;
};

export function FooterDetailsSection() {
  const { t } = useLanguage();

  return (
    <section className="w-full border-t border-saffron/40 bg-[#f8f9fc] pb-8 pt-16 text-sm text-text-primary/90">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col space-y-6">
            <div className="flex items-center gap-2">
              <span className="flex w-fit flex-col items-center text-xl font-bold text-saffron">
                <Image
                  src="/logo_png.png"
                  width="100"
                  height="100"
                  alt="yaagam_logo"
                  className="h-16 w-auto object-contain"
                />
              </span>
            </div>

            <div className="flex gap-4">
              <Link
                href={PLACEHOLDER_ROUTE}
                className="rounded-full border p-2 text-text-primary transition-colors hover:bg-gray-100"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </Link>
              <Link
                href={PLACEHOLDER_ROUTE}
                className="rounded-full border p-2 text-text-primary transition-colors hover:bg-gray-100"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </Link>
              <Link
                href={PLACEHOLDER_ROUTE}
                className="rounded-full border p-2 text-text-primary transition-colors hover:bg-gray-100"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
              </Link>
              <Link
                href={PLACEHOLDER_ROUTE}
                className="rounded-full border p-2 text-text-primary transition-colors hover:bg-gray-100"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect width="4" height="12" x="2" y="9" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </Link>
            </div>

            <div>
              <div className="inline-flex max-w-37.5 cursor-pointer items-center gap-2 rounded-md bg-black px-3 py-2 text-white transition-colors hover:bg-black/90">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                  className="h-6 w-6 fill-current"
                >
                  <path d="M99.617 8.057a50.191 50.191 0 00-38.815-4.425C47.785 8.948 40.5 17.514 40.5 28.5v455a50.316 50.316 0 0020.3 39.815 50.165 50.165 0 0055.679 2.502L475.295 292.17a50.003 50.003 0 000-84.3L99.617 8.057zM54.5 440.164V71.836l187.319 184.164L54.5 440.164zm207.288-16.784L82.915 40.093 429.6 230.15l-167.812 193.23z" />
                </svg>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase leading-tight opacity-80">
                    {t.footer.getItOn}
                  </span>
                  <span className="text-sm font-semibold leading-tight">
                    Google Play
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-4">
            <h4 className="mb-2 text-wrap-safe font-bold uppercase tracking-wide text-text-primary">
              {t.footer.quickLinks}
            </h4>
            <Link
              href={APP_ROUTES.home}
              className="text-wrap-safe transition-colors hover:text-saffron"
            >
              {t.footer.visit}
            </Link>
            <Link
              href={SECTION_ROUTES.upcomingPoojas}
              className="text-wrap-safe transition-colors hover:text-saffron"
            >
              {t.footer.morePoojas}
            </Link>
            <Link
              href={APP_ROUTES.temples}
              className="text-wrap-safe transition-colors hover:text-saffron"
            >
              {t.nav.temples}
            </Link>
          </div>

          <div className="flex flex-col space-y-4">
            <h4 className="mb-2 text-wrap-safe font-bold uppercase tracking-wide text-text-primary">
              {t.footer.contact}
            </h4>
            <Link
              href={EXTERNAL_ROUTES.supportEmail}
              className="text-wrap-safe transition-colors hover:text-saffron"
            >
              support@yaagamvapp.in
            </Link>
            <Link
              href={PLACEHOLDER_ROUTE}
              className="text-wrap-safe transition-colors hover:text-saffron"
            >
              {t.footer.grievance}
            </Link>
            <Link
              href={PLACEHOLDER_ROUTE}
              className="text-wrap-safe transition-colors hover:text-saffron"
            >
              {t.footer.about}
            </Link>
          </div>

          <div className="flex flex-col space-y-4">
            <h4 className="mb-2 text-wrap-safe font-bold uppercase tracking-wide text-text-primary">
              {t.footer.company}
            </h4>
            <p className="text-wrap-safe font-semibold text-text-primary">
              YAAGAM DEV-TECH PVT. LTD
            </p>
            <p className="text-wrap-safe leading-relaxed opacity-80">
              10/1744, 1076, 1st FLOOR SOWBHAGYA BUILDING,
              <br />
              ATHANI, KAKKANAD, 682030, ERNAKULAM
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FooterLegalSection({
  className,
  containerClassName,
  termsLabel,
  refundLabel,
}: FooterLegalSectionProps) {
  const { t } = useLanguage();

  return (
    <footer
      className={cn("w-full border-t border-gray-200 bg-[#f8f9fc]", className)}
    >
      <div
        className={cn(
          "container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 text-center text-xs text-text-primary/60 md:flex-row md:px-8 md:text-left",
          containerClassName,
        )}
      >
        <p className="text-wrap-safe">{t.footer.rights}</p>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 md:justify-end">
          <Link
            href={APP_ROUTES.privacyPolicy}
            className="text-wrap-safe transition-colors hover:text-saffron"
          >
            Privacy Policy
          </Link>
          <Link
            href={APP_ROUTES.termsAndConditions}
            className="text-wrap-safe transition-colors hover:text-saffron"
          >
            {termsLabel ?? "Terms and Conditions"}
          </Link>
          <Link
            href={APP_ROUTES.refundCancellationPolicy}
            className="text-wrap-safe transition-colors hover:text-saffron"
          >
            {refundLabel ?? "Refund & Cancelation Policy"}
          </Link>
          {/* <Link
            href={APP_ROUTES.servicePartnerVendorCode}
            className="text-wrap-safe transition-colors hover:text-saffron"
          >
            Service Partner & Vendor Code
          </Link> */}
        </div>
      </div>
    </footer>
  );
}

export function Footer() {
  return (
    <>
      <FooterDetailsSection />
      <FooterLegalSection />
    </>
  );
}
