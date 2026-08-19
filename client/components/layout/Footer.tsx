"use client";

import { LocalizedLink as Link } from "@/components/ui/localized-link";
import NextLink from "next/link";
import Image from "next/image";
import { PublicSvgIcon } from "@/components/ui/public-svg-icon";
import { useLanguage } from "@/components/providers/LanguageProvider";
import {
  APP_ROUTES,
  EXTERNAL_ROUTES,
  PLACEHOLDER_ROUTE,
  SECTION_ROUTES,
} from "@/constants/route.const";
import { cn } from "@/lib/utils";
import { openCookieSettings } from "@/components/providers/CookieConsentProvider";

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
            <div className="flex w-fit min-w-[12rem] items-center justify-start gap-2">
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

            <div className="flex w-fit gap-4">
              <Link href={PLACEHOLDER_ROUTE} aria-label="Instagram" className="rounded-full transition-transform hover:scale-105">
                <PublicSvgIcon name="instagram" width={36} height={28} />
              </Link>
              <Link href={PLACEHOLDER_ROUTE} aria-label="Facebook" className="rounded-full transition-transform hover:scale-105">
                <PublicSvgIcon name="facebook" width={36} height={28} />
              </Link>
              <Link href={PLACEHOLDER_ROUTE} aria-label="X" className="rounded-full transition-transform hover:scale-105">
                <PublicSvgIcon name="x" width={36} height={28} />
              </Link>
              <Link href={PLACEHOLDER_ROUTE} aria-label="LinkedIn" className="rounded-full transition-transform hover:scale-105">
                <PublicSvgIcon name="linkedin" width={36} height={28} />
              </Link>
            </div>

          </div>

          <div className="flex flex-col space-y-4">
            <h4 className="mb-2 flex items-center gap-2 text-wrap-safe font-bold uppercase tracking-wide text-text-primary">
              {t.footer.quickLinks}
              <PublicSvgIcon name="quickLinks" width={24} height={18} />
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
            <h4 className="mb-2 flex items-center gap-2 text-wrap-safe font-bold uppercase tracking-wide text-text-primary">
              {t.footer.contact}
              <PublicSvgIcon name="contact" width={20} height={20} />
            </h4>
            <Link
              href={EXTERNAL_ROUTES.supportEmail}
              className="text-wrap-safe transition-colors hover:text-saffron"
            >
              support@yaagam.in
            </Link>
            <Link
              href={PLACEHOLDER_ROUTE}
              className="text-wrap-safe transition-colors hover:text-saffron"
            >
              {t.footer.grievance}
            </Link>
            <Link
              href={APP_ROUTES.aboutUs}
              className="text-wrap-safe transition-colors hover:text-saffron"
            >
              {t.footer.about}
            </Link>
          </div>

          <div className="flex flex-col space-y-4">
            <h4 className="mb-2 flex items-center gap-2 text-wrap-safe font-bold uppercase tracking-wide text-text-primary">
              {t.footer.company}
              <PublicSvgIcon name="company" width={20} height={20} />
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
          <NextLink
            href={APP_ROUTES.privacyPolicy}
            className="text-wrap-safe transition-colors hover:text-saffron"
          >
            Privacy Policy
          </NextLink>
          <NextLink
            href={APP_ROUTES.termsAndConditions}
            className="text-wrap-safe transition-colors hover:text-saffron"
          >
            {termsLabel ?? "Terms and Conditions"}
          </NextLink>
          <NextLink
            href={APP_ROUTES.refundCancellationPolicy}
            className="text-wrap-safe transition-colors hover:text-saffron"
          >
            {refundLabel ?? "Refund & Cancelation Policy"}
          </NextLink>
          <NextLink
            href={APP_ROUTES.servicePartnerVendorCode}
            className="text-wrap-safe transition-colors hover:text-saffron"
          >
            Service Partner & Vendor Code
          </NextLink>
          <button
            type="button"
            onClick={openCookieSettings}
            className="text-wrap-safe transition-colors hover:text-saffron"
          >
            Cookie settings
          </button>
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
