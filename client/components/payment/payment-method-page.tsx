"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  CreditCard,
  LockKeyhole,
  QrCode,
  ShieldCheck,
} from "lucide-react";

import { PaymentExperience } from "@/components/payment/payment-experience";
import type { PaymentSession } from "@/types/payment";

type Props = {
  session: PaymentSession;
  isProcessingPayment: boolean;
  onBack: () => void;
  onComplete: () => void;
};

function UnavailableMethod({
  icon: Icon,
  label,
}: {
  icon: typeof CreditCard;
  label: string;
}) {
  return (
    <button
      type="button"
      disabled
      className="flex min-h-16 w-full cursor-not-allowed items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-left opacity-70"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 text-sm font-bold text-slate-600">
        {label}
      </span>
      <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-600">
        Coming soon
      </span>
    </button>
  );
}

export function PaymentMethodPage({
  session,
  isProcessingPayment,
  onBack,
  onComplete,
}: Props) {
  const [showQr, setShowQr] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateMobile = () => setIsMobile(mediaQuery.matches);
    updateMobile();
    mediaQuery.addEventListener("change", updateMobile);
    return () => mediaQuery.removeEventListener("change", updateMobile);
  }, []);

  if (isMobile === null) {
    return <div className="min-h-[calc(100dvh-5rem)] bg-slate-50" />;
  }

  if (session.kind === "subscription" || showQr || isMobile) {
    return (
      <div className="min-h-[calc(100dvh-5rem)] w-full bg-slate-50 py-3 sm:py-6">
        <div className="mx-auto w-full max-w-6xl">
          <PaymentExperience
            session={session}
            isProcessingPayment={isProcessingPayment}
            onBack={
              session.kind === "subscription" || isMobile
                ? onBack
                : () => setShowQr(false)
            }
            onExpired={onBack}
            onComplete={onComplete}
          />
        </div>
      </div>
    );
  }

  return (
    <section className="min-h-[calc(100dvh-5rem)] w-full bg-[#fdfcf9] px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-lg">
        <header className="mb-7 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-extrabold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
          </button>
          <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-500">
            <LockKeyhole
              className="h-4 w-4 text-emerald-600"
              aria-hidden="true"
            />{" "}
            Secure payment
          </span>
        </header>

        <div className="mb-7">
          <h1 className="text-2xl font-black tracking-tight text-[#10203f]">
            Choose how to pay
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Your payment is created and verified securely through Yaagam.
          </p>
        </div>

        <div className="space-y-7">
          <div>
            <h2 className="mb-3 w-fit border-b-2 border-orange-500 pb-1.5 text-sm font-extrabold text-[#10203f]">
              Recommended UPI
            </h2>
            <button
              type="button"
              onClick={() => setShowQr(true)}
              className="group flex min-h-16 w-full items-center gap-3 rounded-xl border border-slate-300 bg-white px-3.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-300 bg-white text-slate-600 group-hover:border-orange-300 group-hover:text-orange-600">
                <QrCode className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-[#10203f]">
                  Pay using QR Code
                </span>
                <span className="mt-0.5 block text-[11px] font-medium text-slate-500">
                  Scan with any UPI app
                </span>
              </span>
              <ChevronRight
                className="h-5 w-5 text-slate-800 transition group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </button>
          </div>

          <div>
            <h2 className="mb-3 w-fit border-b-2 border-orange-500 pb-1.5 text-sm font-extrabold text-[#10203f]">
              Credit &amp; Debit Cards
            </h2>
            <UnavailableMethod icon={CreditCard} label="Pay using Card" />
          </div>

          <div>
            <h2 className="mb-3 w-fit border-b-2 border-orange-500 pb-1.5 text-sm font-extrabold text-[#10203f]">
              Net Banking
            </h2>
            <UnavailableMethod icon={Building2} label="Pay using Net Banking" />
          </div>
        </div>

        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-xs font-semibold leading-5 text-emerald-800">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p>
            Payment status is verified by our server. Yaagam never asks for or
            stores your UPI PIN.
          </p>
        </div>
      </div>
    </section>
  );
}
