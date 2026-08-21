"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { parseIsoCalendarDate } from "@/lib/pooja-booking-date";

export type PoojaDateCalendarCopy = {
  title: string;
  description: string;
  previousMonth: string;
  nextMonth: string;
  unavailable: string;
};

type PoojaDateCalendarProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableDates: string[];
  selectedDate: string;
  onSelect: (date: string) => void;
  locale: string;
  copy: PoojaDateCalendarCopy;
};

function monthKey(date: Date) {
  return date.getUTCFullYear() * 12 + date.getUTCMonth();
}

export function PoojaDateCalendar({
  open,
  onOpenChange,
  availableDates,
  selectedDate,
  onSelect,
  locale,
  copy,
}: PoojaDateCalendarProps) {
  const availableSet = useMemo(() => new Set(availableDates), [availableDates]);
  const availableMonths = useMemo(
    () =>
      Array.from(
        new Set(
          availableDates.map((value) => {
            const date = parseIsoCalendarDate(value)!;
            return monthKey(date);
          }),
        ),
      ).sort((a, b) => a - b),
    [availableDates],
  );
  const selected = parseIsoCalendarDate(selectedDate);
  const [visibleMonth, setVisibleMonth] = useState(
    selected ? monthKey(selected) : availableMonths[0] ?? monthKey(new Date()),
  );
  const year = Math.floor(visibleMonth / 12);
  const month = visibleMonth % 12;
  const firstDay = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells = Array.from(
    { length: firstDay.getUTCDay() + daysInMonth },
    (_, index) => (index < firstDay.getUTCDay() ? null : index - firstDay.getUTCDay() + 1),
  );
  const weekdayLabels = Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(locale, { weekday: "narrow", timeZone: "UTC" }).format(
      new Date(Date.UTC(2026, 7, 23 + index)),
    ),
  );
  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(firstDay);
  const monthIndex = availableMonths.indexOf(visibleMonth);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-1rem)] max-w-sm rounded-2xl border-0 p-4 sm:p-6">
        <DialogHeader className="pr-8 text-left">
          <DialogTitle className="text-xl">{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl bg-[#fff8ef] p-3 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={monthIndex <= 0}
              aria-label={copy.previousMonth}
              onClick={() => setVisibleMonth(availableMonths[monthIndex - 1])}
              className="h-9 w-9 rounded-full text-saffron hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <p className="font-extrabold text-text-primary">{monthLabel}</p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={monthIndex < 0 || monthIndex >= availableMonths.length - 1}
              aria-label={copy.nextMonth}
              onClick={() => setVisibleMonth(availableMonths[monthIndex + 1])}
              className="h-9 w-9 rounded-full text-saffron hover:bg-white"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="mt-3 grid grid-cols-7 text-center text-xs font-bold text-text-primary/45">
            {weekdayLabels.map((label, index) => (
              <span key={`${label}-${index}`} className="py-2">{label}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1" role="grid">
            {cells.map((day, index) => {
              if (!day) return <span key={`empty-${index}`} />;
              const value = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const available = availableSet.has(value);
              const selectedDay = value === selectedDate;
              return (
                <button
                  key={value}
                  type="button"
                  disabled={!available}
                  aria-label={
                    available
                      ? new Intl.DateTimeFormat(locale, { dateStyle: "full", timeZone: "UTC" }).format(parseIsoCalendarDate(value)!)
                      : copy.unavailable
                  }
                  aria-pressed={selectedDay}
                  onClick={() => {
                    onSelect(value);
                    onOpenChange(false);
                  }}
                  className={cn(
                    "aspect-square rounded-full text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron focus-visible:ring-offset-2",
                    available && "bg-white text-text-primary hover:bg-saffron/15 hover:text-saffron",
                    selectedDay && "bg-saffron text-white shadow-sm hover:bg-saffron hover:text-white",
                    !available && "cursor-not-allowed text-text-primary/20",
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
