"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Check, Clock, Home, IdCard, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { APP_ROUTES } from "@/constants/route.const";

type PaymentSession = {
  bookingId: string;
  transactionId: string;
};

type BookingSummary = {
  title: string;
  templeName: string;
  templePlace: string;
  poojaTime?: string;
  nextDate: string;
  planName: string;
  amount: string | number;
  image: string;
};

type BookingSuccessText = {
  bookingConfirmed: string;
  bookingConfirmedText: string;
  bookingSummary: string;
  poojaDay: string;
  poojaTime: string;
  planType: string;
  bookingId: string;
  amount: string;
  currencyPrefix: string;
  photosVideoWhatsapp: string;
  viewMorePoojas: string;
};

type BookingSuccessModalProps = {
  open: boolean;
  summary: BookingSummary;
  paymentSession: PaymentSession | null;
  whatsappNumber: string;
  text: BookingSuccessText;
  onClose: () => void;
  formatAmount: (value: string | number) => string;
};

export function BookingSuccessModal({
  open,
  summary,
  paymentSession,
  whatsappNumber,
  text,
  onClose,
  formatAmount,
}: BookingSuccessModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4 py-8 backdrop-blur-sm">
      <style jsx>{`
        @keyframes success-pop {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.12); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }

        @keyframes check-draw {
          from { stroke-dashoffset: 42; }
          to { stroke-dashoffset: 0; }
        }

        .success-pop {
          animation: success-pop 420ms ease-out both;
        }

        .check-draw {
          stroke-dasharray: 42;
          stroke-dashoffset: 42;
          animation: check-draw 520ms 220ms ease-out forwards;
        }
      `}</style>

      <section className="relative w-full max-w-[470px] rounded-md border-2 border-[#1f96ff] bg-white px-5 pb-5 pt-4 text-center shadow-2xl">
        <button
          type="button"
          aria-label="Close success modal"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1 text-[#6680a8] transition hover:bg-[#f2f6ff] hover:text-[#061b4d]"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mx-auto mb-3 flex h-16 w-24 items-center justify-center">
          <div className="success-pop relative flex h-12 w-12 items-center justify-center rounded-full bg-[#22c55e] text-white shadow-[0_0_0_8px_rgba(34,197,94,0.14)]">
            <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
              <path
                d="M8.5 16.5 13.5 21.5 24 10.5"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3.5"
                className="check-draw"
              />
            </svg>
            <span className="absolute -left-5 top-0 text-[11px] text-[#f5b91f]">☆</span>
            <span className="absolute -right-5 top-1 text-[10px] text-[#f5b91f]">☆</span>
            <span className="absolute -top-4 right-2 text-[9px] text-[#ef7d1a]">✧</span>
          </div>
        </div>

        <h1 className="text-[18px] font-extrabold text-[#149149]">
          {text.bookingConfirmed}!
        </h1>
        <p className="mt-1 text-[11px] font-extrabold text-[#061b4d]">
          Your pooja has been successfully booked.
        </p>
        <p className="mx-auto mt-1 max-w-[320px] text-[10px] font-semibold leading-4 text-[#7d86a0]">
          We will perform your pooja with devotion and send photos & videos on WhatsApp.
        </p>

        <div className="mt-4 rounded-md border border-[#e5eaf3] bg-white p-3 text-left">
          <h2 className="text-[11px] font-extrabold text-[#061b4d]">
            Booking Details
          </h2>
          <div className="mt-3 grid grid-cols-[76px_1fr] gap-3">
            <div className="relative h-[74px] overflow-hidden rounded-sm bg-[#f4f4f4]">
              <Image
                src={summary.image}
                alt={summary.title}
                fill
                unoptimized={summary.image.startsWith("http")}
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <h3 className="line-clamp-2 text-[11px] font-extrabold leading-4 text-[#061b4d]">
                {summary.title}
              </h3>
              <p className="mt-1 text-[9px] font-bold leading-3 text-[#6b748c]">
                {[summary.templeName, summary.templePlace].filter(Boolean).join(", ")}
              </p>
            </div>
          </div>

          <div className="mt-3 space-y-2 text-[9px] font-bold text-[#6f7890]">
            <p className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {text.poojaDay}
              </span>
              <span className="text-right text-[#1c4ed8]">{summary.nextDate}</span>
            </p>
            {summary.poojaTime && (
              <p className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {text.poojaTime}
                </span>
                <span className="text-right text-[#1c4ed8]">
                  {summary.poojaTime}
                </span>
              </p>
            )}
            <p className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5">
                <Home className="h-3.5 w-3.5" />
                {text.planType}
              </span>
              <span className="text-[#ef7d1a]">{summary.planName}</span>
            </p>
            <p className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5">
                <IdCard className="h-3.5 w-3.5" />
                {text.bookingId}
              </span>
              <span className="break-all text-right text-[#1c4ed8]">
                {paymentSession?.bookingId}
              </span>
            </p>
            <p className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" />
                {text.amount}
              </span>
              <span className="text-[#ef7d1a]">
                {text.currencyPrefix}{formatAmount(summary.amount)}
              </span>
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-md border border-[#dff5e5] bg-[#f4fff6] p-3 text-center">
          <p className="text-[10px] font-bold text-[#6f7890]">
            {text.photosVideoWhatsapp}
          </p>
          {whatsappNumber && (
            <p className="mt-2 text-[13px] font-extrabold text-[#149149]">
              +91 {whatsappNumber}
            </p>
          )}
          <p className="mt-1 text-[9px] font-semibold text-[#55a36d]">
            once the pooja is completed.
          </p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <Button
            asChild
            variant="outline"
            className="h-10 rounded-md border-[#d9e0ed] text-[11px] font-extrabold"
          >
            <Link href={APP_ROUTES.home}>
              <Home className="mr-1.5 h-3.5 w-3.5" />
              Go to Home
            </Link>
          </Button>
          <Button
            asChild
            className="h-10 rounded-md bg-[#ef7d1a] text-[11px] font-extrabold text-white hover:bg-[#d96e13]"
          >
            <Link href={APP_ROUTES.poojas}>{text.viewMorePoojas}</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
