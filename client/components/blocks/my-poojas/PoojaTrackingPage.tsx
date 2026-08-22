"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleHelp,
  Download,
  Gift,
  HandCoins,
  Loader2,
  MapPin,
  Phone,
  ReceiptIndianRupee,
  UserRound,
} from "lucide-react";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { LocalizedLink as Link } from "@/components/ui/localized-link";
import { MY_POOJA_FALLBACK_IMAGES } from "@/constants/my-poojas.const";
import { APP_ROUTES } from "@/constants/route.const";
import {
  downloadBookingInvoiceApi,
  getMyPoojaTrackingApi,
  type BookingStatus,
  type MyPoojaItem,
} from "@/lib/api/user/my-poojas.api";
import { removePlanTerm } from "@/lib/option-label";

const DB_LANGUAGE = {
  en: "EN",
  ml: "ML",
  hi: "HI",
  mr: "MR",
  ta: "TA",
} as const;
const SUPPORT_PHONE = "+918593948881";

function readablePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("91")
    ? `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`
    : value;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(value);
}
function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function completedStep(status: BookingStatus, step: number) {
  const rank: Record<BookingStatus, number> = {
    PENDING_PAYMENT: 0,
    PAYMENT_FAILED: 0,
    CONFIRMED: 1,
    SCHEDULED: 2,
    COMPLETED: 3,
    CANCELLED: 0,
    REFUNDED: 0,
  };
  return rank[status] >= step;
}

export function PoojaTrackingPage({
  bookingNumber,
}: {
  bookingNumber: string;
}) {
  const { language } = useLanguage();
  const [booking, setBooking] = useState<MyPoojaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getMyPoojaTrackingApi(bookingNumber)
      .then((item) => {
        if (!active) return;
        setBooking(item);
        setError(item ? "" : "This booking could not be found.");
      })
      .catch(
        () =>
          active && setError("Unable to load this booking. Please try again."),
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [bookingNumber]);

  const instructions = useMemo(() => {
    if (!booking) return null;
    const requested = DB_LANGUAGE[language];
    return (
      booking.pooja.instructionTranslations?.find(
        (item) => item.language === requested,
      ) ??
      booking.pooja.instructionTranslations?.find(
        (item) => item.language === "EN",
      ) ??
      booking.pooja.instructionTranslations?.[0] ??
      null
    );
  }, [booking, language]);

  if (loading) {
    return (
      <main className="flex min-h-[560px] items-center justify-center bg-[#fffaf4]">
        <Loader2 className="h-8 w-8 animate-spin text-[#ef7d1a]" />
      </main>
    );
  }

  if (error || !booking) {
    return (
      <main className="min-h-[560px] bg-[#fffaf4] px-4 py-12">
        <div className="mx-auto max-w-xl text-center">
          <h1 className="text-2xl font-extrabold text-[#082968]">
            Booking not available
          </h1>
          <p className="mt-3 text-sm text-[#68758d]">{error}</p>
          <Button asChild className="mt-6">
            <Link href={APP_ROUTES.userMyPoojas}>Back to My Poojas</Link>
          </Button>
        </div>
      </main>
    );
  }

  async function downloadInvoice() {
    if (!booking) return;
    const invoice = await downloadBookingInvoiceApi(booking.bookingNumber);
    const url = URL.createObjectURL(invoice.content);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = invoice.filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const imageUrl = booking.pooja.imageUrls?.[0] || MY_POOJA_FALLBACK_IMAGES[0];
  const steps = [
    {
      title: "Booking confirmed",
      text: "Payment completed successfully.",
      date: formatDate(booking.bookingDate),
      done: completedStep(booking.status, 1),
    },
    {
      title: "Pooja scheduled",
      text: `Scheduled for ${formatDate(booking.poojaDate)}.`,
      done: completedStep(booking.status, 2),
    },
    {
      title: "Pooja completed",
      text: "The temple has completed your Pooja.",
      done: completedStep(booking.status, 3),
    },
  ];
  const hasInstructions = Boolean(
    instructions?.mantra ||
    instructions?.dos?.length ||
    instructions?.donts?.length,
  );

  return (
    <main className="flex-1 bg-[#fffaf4] px-4 py-8 md:px-6 md:py-12">
      <div className="mx-auto w-full max-w-[1100px]">
        <Link
          href={APP_ROUTES.userMyPoojas}
          className="inline-flex items-center gap-2 text-sm font-bold text-[#16447f] hover:text-[#ef7d1a]"
        >
          <ArrowLeft className="h-4 w-4" />
          My Poojas
        </Link>

        <header className="mt-6">
          <p className="text-xs font-extrabold uppercase tracking-widest text-[#ef7d1a]">
            Booking details
          </p>
          <h1 className="mt-2 text-2xl font-extrabold text-[#082968] md:text-3xl">
            {booking.pooja.name}
          </h1>
          <p className="mt-1 text-sm font-semibold text-[#68758d]">
            Booking ID: {booking.bookingNumber}
          </p>
        </header>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <section aria-labelledby="status-heading">
              <h2
                id="status-heading"
                className="text-xl font-extrabold text-[#082968]"
              >
                Pooja status
              </h2>
              <div className="mt-5">
                {steps.map((step, index) => (
                  <div
                    key={step.title}
                    className="relative flex gap-4 pb-7 last:pb-0"
                  >
                    {index < steps.length - 1 && (
                      <span
                        className={`absolute left-[15px] top-8 h-[calc(100%-2rem)] w-0.5 ${step.done ? "bg-[#22b56b]" : "bg-[#e4e7ed]"}`}
                      />
                    )}
                    <span
                      className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${step.done ? "bg-[#22b56b] text-white" : "bg-[#e9ecf2] text-[#8b95aa]"}`}
                    >
                      {step.done ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-current" />
                      )}
                    </span>
                    <div className="pt-0.5">
                      <h3 className="font-extrabold text-[#082968]">
                        {step.title}
                      </h3>
                      <p className="mt-1 text-sm text-[#68758d]">{step.text}</p>
                      {step.date && (
                        <p className="mt-1 text-xs font-semibold text-[#8b95aa]">
                          {step.date}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section aria-labelledby="instructions-heading">
              <h2
                id="instructions-heading"
                className="text-xl font-extrabold text-[#082968]"
              >
                Pooja instructions
              </h2>
              <div className="mt-5 border-l-2 border-[#ffd3a7] pl-5">
                {!hasInstructions ? (
                  <p className="text-sm text-[#68758d]">
                    Instructions will be shared here when they are available.
                  </p>
                ) : (
                  <div className="space-y-6">
                    {instructions?.mantra && (
                      <div>
                        <h3 className="font-extrabold text-[#082968]">
                          Mantra
                        </h3>
                        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#52627b]">
                          {instructions.mantra}
                        </p>
                      </div>
                    )}
                    {instructions?.dos?.length ? (
                      <div>
                        <h3 className="font-extrabold text-[#082968]">
                          Before the Pooja
                        </h3>
                        <ul className="mt-2 space-y-2 text-sm text-[#52627b]">
                          {instructions.dos.map((item) => (
                            <li key={item} className="flex gap-2">
                              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#22b56b]" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {instructions?.donts?.length ? (
                      <div>
                        <h3 className="font-extrabold text-[#082968]">
                          Please avoid
                        </h3>
                        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-[#52627b]">
                          {instructions.donts.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </section>

            {booking.status === "COMPLETED" && (
              <section className="flex gap-4 bg-[#effcf5] p-5 md:p-6">
                <CheckCircle2 className="h-6 w-6 shrink-0 text-[#22b56b]" />
                <div>
                  <h2 className="font-extrabold text-[#12643b]">
                    Your Pooja is complete
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-[#367457]">
                    Photos, videos, and completion details will be sent to the
                    shared WhatsApp number{" "}
                    {readablePhone(booking.whatsappNumber)}.
                  </p>
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-8">
            <section aria-labelledby="summary-heading">
              <div className="flex items-center justify-between gap-4">
                <h2
                  id="summary-heading"
                  className="text-xl font-extrabold text-[#082968]"
                >
                  Booking summary
                </h2>
                {booking.status === "COMPLETED" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={downloadInvoice}
                    className="shrink-0 gap-2 border-[#16447f] text-[#16447f] hover:bg-white"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Download invoice</span>
                    <span className="sm:hidden">Invoice</span>
                  </Button>
                )}
              </div>
              <div className="mt-5 space-y-5">
                <div className="grid grid-cols-[88px_1fr] gap-4">
                  <div className="relative h-20 overflow-hidden rounded-xl bg-[#f4ede5]">
                    <Image
                      src={imageUrl}
                      alt={booking.pooja.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-extrabold leading-5 text-[#082968]">
                      {booking.pooja.name}
                    </h3>
                    <p className="mt-1 text-sm text-[#52627b]">
                      {booking.temple.name}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[#ef7d1a]">
                      {removePlanTerm(booking.displayType)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 text-sm">
                  <CalendarDays className="h-5 w-5 shrink-0 text-[#ef7d1a]" />
                  <div>
                    <p className="font-bold text-[#082968]">Pooja date</p>
                    <p className="mt-1 text-[#52627b]">
                      {formatDate(booking.poojaDate)}
                    </p>
                  </div>
                </div>{" "}
                <div className="flex gap-3 text-sm">
                  <ReceiptIndianRupee className="h-5 w-5 shrink-0 text-[#ef7d1a]" />
                  <div className="flex min-w-0 flex-1 justify-between gap-4">
                    <p className="font-bold text-[#082968]">Pooja amount</p>
                    <p className="shrink-0 font-semibold text-[#52627b]">
                      {formatMoney(booking.amount.pooja)}
                    </p>
                  </div>
                </div>{" "}
                {booking.offerings?.length > 0 && (
                  <div className="flex gap-3 text-sm">
                    <Gift className="h-5 w-5 shrink-0 text-[#ef7d1a]" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-[#082968]">Offerings</p>
                      <div className="mt-2 space-y-2 text-[#52627b]">
                        {booking.offerings.map((offering, index) => (
                          <div
                            key={`${offering.name}-${index}`}
                            className="flex justify-between gap-4"
                          >
                            <span>
                              {offering.name} × {offering.quantity}
                            </span>
                            <span className="shrink-0 font-semibold">
                              {formatMoney(offering.total)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {booking.dakshinaAmount > 0 && (
                  <div className="flex gap-3 text-sm">
                    <HandCoins className="h-5 w-5 shrink-0 text-[#ef7d1a]" />
                    <div className="flex min-w-0 flex-1 justify-between gap-4">
                      <p className="font-bold text-[#082968]">Dakshina</p>
                      <p className="shrink-0 font-semibold text-[#52627b]">
                        {formatMoney(booking.dakshinaAmount)}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex gap-3 text-sm">
                  <UserRound className="h-5 w-5 shrink-0 text-[#ef7d1a]" />
                  <div>
                    <p className="font-bold text-[#082968]">Devotee details</p>
                    <div className="mt-1 space-y-1 text-[#52627b]">
                      {booking.devotees?.length ? (
                        booking.devotees.map((devotee, index) => (
                          <p key={`${devotee.name}-${index}`}>
                            {devotee.name}
                            {devotee.naal ? ` · ${devotee.naal}` : ""}
                          </p>
                        ))
                      ) : (
                        <p>Not provided</p>
                      )}
                    </div>
                  </div>
                </div>
                {booking.address && (
                  <div className="flex gap-3 text-sm">
                    <MapPin className="h-5 w-5 shrink-0 text-[#ef7d1a]" />
                    <div>
                      <p className="font-bold text-[#082968]">
                        Prasadam delivery address
                      </p>
                      <p className="mt-1 leading-6 text-[#52627b]">
                        {[
                          booking.address.houseNo,
                          booking.address.streetName,
                          booking.address.district,
                          booking.address.state,
                          booking.address.pincode,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                      <p className="mt-1 text-[#52627b]">
                        {booking.address.phoneNumber}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section
              aria-labelledby="help-heading"
              className="bg-[#fff1df] p-5 md:p-6"
            >
              <div className="flex gap-3">
                <CircleHelp className="h-6 w-6 shrink-0 text-[#ef7d1a]" />
                <div>
                  <h2
                    id="help-heading"
                    className="font-extrabold text-[#082968]"
                  >
                    Help &amp; Support
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-[#52627b]">
                    Questions about this booking? Our support team is ready to
                    help.
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <Button
                  asChild
                  className="gap-2 bg-[#22a866] hover:bg-[#188c54]"
                >
                  <a
                    href={`https://wa.me/${SUPPORT_PHONE.replace("+", "")}?text=${encodeURIComponent(`Hello Yaagam, I need help with booking ${booking.bookingNumber}.`)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <WhatsAppIcon className="h-4 w-4" />
                    Chat with us
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="gap-2 border-[#ef7d1a] text-[#ef7d1a] hover:bg-white"
                >
                  <a href={`tel:${SUPPORT_PHONE}`}>
                    <Phone className="h-4 w-4" />
                    Call us
                  </a>
                </Button>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
