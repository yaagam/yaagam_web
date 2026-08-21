"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Check, Info, IndianRupee, Pencil, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";

import { PoojaDateCalendar } from "@/components/blocks/pooja-booking/PoojaDateCalendar";
import { Button } from "@/components/ui/button";
import { LocalizedLink as Link } from "@/components/ui/localized-link";
import { APP_ROUTES } from "@/constants/route.const";
import { getSelectablePoojaDates, parseIsoCalendarDate } from "@/lib/pooja-booking-date";
import { cn } from "@/lib/utils";

export type BookingFrequency = "single" | "weekly";

export type BookingFrequencyCopy = {
  title: string;
  description: string;
  oneDayTitle: string;
  oneDayDescription: string;
  everyWeekTitle: string;
  everyWeekDescription: string;
  once: string;
  perWeek: string;
  continue: string;
  benefitsTitle: string;
  videoBenefit: string;
  whatsappBenefit: string;
  prasadamBenefit: string;
  weeklyAutopayInfo: string;
  bookingDate: string;
  changeDate: string;
  dateHint: string;
  calendarTitle: string;
  calendarDescription: string;
  previousMonth: string;
  nextMonth: string;
  unavailableDate: string;
};

export interface BookingFrequencyCardProps {
  type: BookingFrequency;
  selected: boolean;
  onSelect: () => void;
  amount: string | number;
  originalAmount: string | number;
  hasDiscount: boolean;
  copy: BookingFrequencyCopy;
}

function formatAmount(value: string | number) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return String(value);
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount);
}

export function BookingFrequencyCard({
  type,
  selected,
  onSelect,
  amount,
  originalAmount,
  hasDiscount,
  copy,
}: BookingFrequencyCardProps) {
  const isWeekly = type === "weekly";
  const Icon = isWeekly ? RefreshCw : CalendarDays;
  const title = isWeekly ? copy.everyWeekTitle : copy.oneDayTitle;
  const description = isWeekly ? copy.everyWeekDescription : copy.oneDayDescription;
  const billingPeriod = isWeekly ? copy.perWeek : copy.once;

  return (
    <label
      className={cn(
        "relative flex cursor-pointer flex-col rounded-2xl border bg-white p-5 text-left shadow-sm transition duration-200 hover:border-saffron/70 focus-within:ring-2 focus-within:ring-saffron focus-within:ring-offset-2 sm:p-6",
        selected ? "border-2 border-saffron bg-[#fff8ef]" : "border-black/10",
      )}
    >
      <input
        type="radio"
        name="booking-frequency"
        value={type}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
      <AnimatePresence initial={false}>
        {selected && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.18 }}
            className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-saffron text-white"
            aria-hidden="true"
          >
            <Check className="h-4 w-4 stroke-[3]" />
          </motion.span>
        )}
      </AnimatePresence>
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-saffron/10 text-saffron">
        <Icon className="h-5 w-5" />
      </span>
      <span className="mt-5 text-lg font-extrabold text-text-primary">{title}</span>
      <span className="mt-2 min-h-12 text-sm font-medium leading-6 text-text-primary/65">
        {description}
      </span>
      <span className="mt-5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="inline-flex items-center text-xl font-extrabold text-saffron">
          <IndianRupee className="h-5 w-5" />
          {formatAmount(amount)}
        </span>
        <span className="text-sm font-semibold text-text-primary/60">/ {billingPeriod}</span>
        {hasDiscount && (
          <span className="inline-flex items-center text-sm font-semibold text-text-primary/40 line-through">
            <IndianRupee className="h-3.5 w-3.5" />
            {formatAmount(originalAmount)}
          </span>
        )}
      </span>
    </label>
  );
}

type BookingFrequencySelectorProps = {
  poojaId: string;
  poojaDay: string;
  weeklyAvailable: boolean;
  amount: string | number;
  originalAmount: string | number;
  locale: string;
  copy: BookingFrequencyCopy;
};

export function BookingFrequencySelector({
  poojaId,
  poojaDay,
  weeklyAvailable,
  amount,
  originalAmount,
  locale,
  copy,
}: BookingFrequencySelectorProps) {
  const [bookingType, setBookingType] = useState<BookingFrequency | null>(null);
  const availableDates = useMemo(() => getSelectablePoojaDates(poojaDay), [poojaDay]);
  const [selectedDate, setSelectedDate] = useState(() => availableDates[0] ?? "");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const hasDiscount = Number(amount) < Number(originalAmount);
  const benefits = [copy.videoBenefit, copy.whatsappBenefit, copy.prasadamBenefit];
  const formattedSelectedDate = selectedDate
    ? new Intl.DateTimeFormat(locale, { dateStyle: "full", timeZone: "UTC" }).format(
        parseIsoCalendarDate(selectedDate)!,
      )
    : "";

  return (
    <section id="booking-frequency" className="mx-auto max-w-7xl px-4 pt-14 md:px-8">
      <div className="text-center">
        <h2 className="text-2xl font-extrabold text-text-primary">{copy.title}</h2>
        <p className="mt-2 text-sm font-medium leading-6 text-text-primary/60">
          {copy.description}
        </p>
      </div>

      <div className="mt-7 bg-white py-4 sm:py-5">
        <h3 className="text-sm font-extrabold text-text-primary">{copy.benefitsTitle}</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {benefits.map((benefit) => (
            <p key={benefit} className="flex items-start gap-2 text-sm font-semibold leading-5 text-text-primary/70">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>{benefit}</span>
            </p>
          ))}
        </div>
      </div>

      <fieldset className="mt-6">
        <legend className="sr-only">{copy.title}</legend>
        <div className={cn("grid grid-cols-1 gap-4 md:grid-cols-2", !weeklyAvailable && "md:grid-cols-1")}>
          <BookingFrequencyCard
            type="single"
            selected={bookingType === "single"}
            onSelect={() => {
              setBookingType("single");
              if (!selectedDate) setSelectedDate(availableDates[0] ?? "");
            }}
            amount={amount}
            originalAmount={originalAmount}
            hasDiscount={hasDiscount}
            copy={copy}
          />
          {weeklyAvailable && (
            <BookingFrequencyCard
              type="weekly"
              selected={bookingType === "weekly"}
              onSelect={() => setBookingType("weekly")}
              amount={amount}
              originalAmount={originalAmount}
              hasDiscount={hasDiscount}
              copy={copy}
            />
          )}
        </div>
      </fieldset>

      <AnimatePresence initial={false}>
        {bookingType === "single" && selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="mt-5 flex flex-col gap-3 rounded-2xl bg-[#fff8ef] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
          >
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-saffron">{copy.bookingDate}</p>
              <p className="mt-1 font-extrabold text-text-primary">{formattedSelectedDate}</p>
              <p className="mt-1 text-xs font-medium text-text-primary/55">{copy.dateHint}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCalendarOpen(true)}
              className="h-11 w-full shrink-0 rounded-xl border-saffron/35 bg-white text-saffron hover:bg-saffron/10 sm:w-auto"
            >
              <Pencil className="h-4 w-4" />
              {copy.changeDate}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {bookingType === "weekly" && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="mx-auto mt-4 flex max-w-lg items-start gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm font-medium leading-5 text-blue-800"
          >
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{copy.weeklyAutopayInfo}</span>
          </motion.p>
        )}
      </AnimatePresence>

      <div className="mt-6 flex justify-center">
        {bookingType && (bookingType === "weekly" || selectedDate) ? (
          <Button asChild className="h-12 min-w-48 rounded-xl px-8 font-bold">
            <Link
              href={APP_ROUTES.poojaBooking(
                poojaId,
                bookingType,
                bookingType === "single" ? selectedDate : undefined,
              )}
            >
              {copy.continue}
            </Link>
          </Button>
        ) : (
          <Button type="button" disabled className="h-12 min-w-48 rounded-xl px-8 font-bold">
            {copy.continue}
          </Button>
        )}
      </div>

      <PoojaDateCalendar
        open={calendarOpen}
        onOpenChange={setCalendarOpen}
        availableDates={availableDates}
        selectedDate={selectedDate}
        onSelect={setSelectedDate}
        locale={locale}
        copy={{
          title: copy.calendarTitle,
          description: copy.calendarDescription,
          previousMonth: copy.previousMonth,
          nextMonth: copy.nextMonth,
          unavailable: copy.unavailableDate,
        }}
      />
    </section>
  );
}
