"use client";

import Image from "next/image";
import { LocalizedLink as Link } from "@/components/ui/localized-link";
import {
  CalendarDays,
  Check,
  Clock,
  Home,
  IdCard,
  ListChecks,
  Sparkles,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { APP_ROUTES } from "@/constants/route.const";

type PaymentSession = {
  bookingReference: string;
  transactionReference: string;
  priceBreakdown: {
    grandTotal: number;
  };
};

type BookingSummary = {
  title: string;
  templeName: string;
  templePlace: string;
  poojaTime?: string;
  nextDate: string;
  planName: string;
  image: string;
};

type BookingSuccessText = {
  bookingConfirmed: string;
  bookingSummary: string;
  poojaDay: string;
  poojaTime: string;
  planType: string;
  bookingId: string;
  amount: string;
  currencyPrefix: string;
  viewMorePoojas: string;
};

type BookingSuccessModalProps = {
  open: boolean;
  summary: BookingSummary;
  paymentSession: PaymentSession | null;
  text: BookingSuccessText;
  formatAmount: (value: string | number) => string;
};

export function BookingSuccessModal({
  open,
  summary,
  paymentSession,
  text,
  formatAmount,
}: BookingSuccessModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4 py-8 backdrop-blur-sm">
      <style jsx>{`
        @keyframes success-pop {
          0% {
            transform: scale(0.35) rotate(-10deg);
            opacity: 0;
          }
          70% {
            transform: scale(1.14) rotate(3deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(0);
            opacity: 1;
          }
        }

        @keyframes success-halo {
          0% {
            transform: scale(0.75);
            opacity: 0.65;
          }
          100% {
            transform: scale(1.55);
            opacity: 0;
          }
        }

        @keyframes check-draw {
          from {
            stroke-dashoffset: 42;
          }
          to {
            stroke-dashoffset: 0;
          }
        }

        .success-pop {
          animation: success-pop 560ms cubic-bezier(0.2, 0.9, 0.3, 1.3) both;
        }

        .success-halo {
          animation: success-halo 900ms 180ms ease-out both;
        }

        .check-draw {
          stroke-dasharray: 42;
          stroke-dashoffset: 42;
          animation: check-draw 480ms 280ms ease-out forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .success-pop,
          .success-halo,
          .check-draw {
            animation-duration: 1ms;
            animation-delay: 0ms;
          }
        }
      `}</style>

      <section className="relative w-full max-w-[470px] rounded-xl bg-white px-5 pb-5 pt-6 text-center shadow-2xl">
        <Link
          href={APP_ROUTES.poojas}
          aria-label="Close success modal"
          className="absolute right-3 top-3 rounded-full p-1 text-[#6680a8] transition hover:bg-[#f2f6ff] hover:text-[#061b4d]"
        >
          <X className="h-4 w-4" />
        </Link>

        <div className="mx-auto mb-4 flex h-20 w-24 items-center justify-center">
          <div className="success-pop relative flex h-16 w-16 items-center justify-center rounded-full bg-[#22c55e] text-white shadow-[0_0_0_8px_rgba(34,197,94,0.14)]">
            <span className="success-halo pointer-events-none absolute inset-0 rounded-full border-2 border-[#22c55e]" />
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
          </div>
        </div>

        <h1 className="text-xl font-extrabold text-[#172337]">
          Pooja Confirmed
        </h1>
        <p className="mt-1 text-xs font-semibold text-[#667085]">
          Your booking was completed successfully.
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
                {[summary.templeName, summary.templePlace]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
          </div>

          <div className="mt-3 space-y-2 text-[9px] font-bold text-[#6f7890]">
            <p className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {text.poojaDay}
              </span>
              <span className="text-right text-[#1c4ed8]">
                {summary.nextDate}
              </span>
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
                {paymentSession?.bookingReference}
              </span>
            </p>
            <p className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" />
                {text.amount}
              </span>
              <span className="text-[#ef7d1a]">
                {text.currencyPrefix}
                {formatAmount(paymentSession?.priceBreakdown.grandTotal ?? 0)}
              </span>
            </p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <Button
            asChild
            variant="outline"
            className="h-11 rounded-md border-[#2874f0] text-xs font-extrabold text-[#2874f0] hover:bg-[#f2f7ff] hover:text-[#2874f0]"
          >
            <Link href={APP_ROUTES.poojas}>
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              More Poojas
            </Link>
          </Button>

          <Button
            asChild
            className="h-11 rounded-md bg-[#fb641b] text-xs font-extrabold text-white hover:bg-[#e85b16]"
          >
            <Link href={APP_ROUTES.userMyPoojas}>
              <ListChecks className="mr-1.5 h-3.5 w-3.5" />
              My Poojas
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
