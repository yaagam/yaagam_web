"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/components/providers/LanguageProvider";
import {
  APP_ROUTES,
  EXTERNAL_ROUTES,
  PLACEHOLDER_ROUTE,
  SECTION_ROUTES,
} from "@/constants/route.const";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="w-full border-t border-saffron/40 bg-[#f8f9fc] pt-16 pb-8 text-sm text-text-primary/90">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Logo & Socials */}
          <div className="flex flex-col space-y-6">
            <div className="flex items-center gap-2">
              <span className="text-saffron font-bold text-xl flex flex-col items-center w-fit">
                {/* Dummy logo representation */}
                <Image src="/logo_png.png" width="100" height="100" alt={'yaagam_logo'} />
                
              </span>
            </div>

            <div className="flex gap-4">
              <Link href={PLACEHOLDER_ROUTE} className="p-2 border rounded-full hover:bg-gray-100 transition-colors text-text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              </Link>
              <Link href={PLACEHOLDER_ROUTE} className="p-2 border rounded-full hover:bg-gray-100 transition-colors text-text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </Link>
              <Link href={PLACEHOLDER_ROUTE} className="p-2 border rounded-full hover:bg-gray-100 transition-colors text-text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
              </Link>
              <Link href={PLACEHOLDER_ROUTE} className="p-2 border rounded-full hover:bg-gray-100 transition-colors text-text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
              </Link>
            </div>

            <div>
              <div className="bg-black hover:bg-black/90 text-white rounded-md px-3 py-2 inline-flex items-center gap-2 cursor-pointer transition-colors max-w-37.5">
                {/* Dummy Play Store Button */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                  className="h-6 w-6 fill-current"
                >
                  <path d="M99.617 8.057a50.191 50.191 0 00-38.815-4.425C47.785 8.948 40.5 17.514 40.5 28.5v455a50.316 50.316 0 0020.3 39.815 50.165 50.165 0 0055.679 2.502L475.295 292.17a50.003 50.003 0 000-84.3L99.617 8.057zM54.5 440.164V71.836l187.319 184.164L54.5 440.164zm207.288-16.784L82.915 40.093 429.6 230.15l-167.812 193.23z" />
                </svg>
                <div className="flex flex-col">
                  <span className="text-[10px] leading-tight opacity-80 uppercase">
                    {t.footer.getItOn}
                  </span>
                  <span className="text-sm font-semibold leading-tight">
                    Google Play
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col space-y-4">
            <h4 className="mb-2 text-wrap-safe font-bold uppercase tracking-wide text-text-primary">
              {t.footer.quickLinks}
            </h4>
            <Link href={APP_ROUTES.home} className="text-wrap-safe hover:text-saffron transition-colors">
              {t.footer.visit}
            </Link>
            <Link href={SECTION_ROUTES.upcomingPoojas} className="text-wrap-safe hover:text-saffron transition-colors">
              {t.footer.morePoojas}
            </Link>
            <Link href={PLACEHOLDER_ROUTE} className="text-wrap-safe hover:text-saffron transition-colors">
              {t.footer.blogs}
            </Link>
          </div>

          {/* Contact Us */}
          <div className="flex flex-col space-y-4">
            <h4 className="mb-2 text-wrap-safe font-bold uppercase tracking-wide text-text-primary">
              {t.footer.contact}
            </h4>
            <Link href={EXTERNAL_ROUTES.supportEmail} className="text-wrap-safe hover:text-saffron transition-colors">
              support@yaagamvapp.in
            </Link>
            <Link href={PLACEHOLDER_ROUTE} className="text-wrap-safe hover:text-saffron transition-colors">
              {t.footer.grievance}
            </Link>
            <Link href={PLACEHOLDER_ROUTE} className="text-wrap-safe hover:text-saffron transition-colors">
              {t.footer.about}
            </Link>
          </div>

          {/* Company & Office */}
          <div className="flex flex-col space-y-4">
            <h4 className="mb-2 text-wrap-safe font-bold uppercase tracking-wide text-text-primary">
              {t.footer.company}
            </h4>
            <p className="text-wrap-safe font-semibold text-text-primary">
              Yaagam Applications Pvt. Ltd.
            </p>
            <p className="text-wrap-safe leading-relaxed opacity-80">
              Unit No. 705, Korman Space, Athani Junction,
              <br />
              Kakkanad, Ernakulam, Kerala - 700071
            </p>
            <p className="text-wrap-safe opacity-80">CIN - U72900WB2021PTC249588</p>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-8 text-center text-xs opacity-70 md:flex-row md:text-left">
          <p className="text-wrap-safe">{t.footer.rights}</p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 md:justify-end">
            <Link href={PLACEHOLDER_ROUTE} className="text-wrap-safe hover:text-saffron transition-colors">
              {t.footer.terms}
            </Link>
            <Link href={PLACEHOLDER_ROUTE} className="text-wrap-safe hover:text-saffron transition-colors">
              {t.footer.refund}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
