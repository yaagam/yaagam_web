"use client";

import { AlertCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { WEEKDAY_INDEX_BY_NAME } from "@/constants/pooja-details.const";

type PoojaCountdownProps = {
  poojaDay?: string;
};

function getNormalizedPoojaDay(poojaDay: string) {
  return poojaDay.trim().toLowerCase();
}

function isAnyPoojaDay(poojaDay: string) {
  return ["any", "any day"].includes(getNormalizedPoojaDay(poojaDay));
}

function getWeekdayIndex(poojaDay: string) {
  return WEEKDAY_INDEX_BY_NAME[getNormalizedPoojaDay(poojaDay)] ?? null;
}

function getNextPoojaStart(poojaDay: string, nowMs: number) {
  const now = new Date(nowMs);
  const target = new Date(now);
  target.setHours(0, 0, 0, 0);

  if (isAnyPoojaDay(poojaDay)) {
    target.setDate(target.getDate() + 1);
    return target.getTime();
  }

  const weekdayIndex = getWeekdayIndex(poojaDay);
  if (weekdayIndex === null) return null;

  let daysUntilPooja = (weekdayIndex - now.getDay() + 7) % 7;
  if (daysUntilPooja === 0 && target.getTime() <= nowMs) {
    daysUntilPooja = 7;
  }

  target.setDate(target.getDate() + daysUntilPooja);
  return target.getTime();
}

function getPoojaCountdown(poojaDay: string | undefined, nowMs: number) {
  if (!poojaDay) return null;

  const targetMs = getNextPoojaStart(poojaDay, nowMs);
  if (!targetMs) return null;

  const totalSeconds = Math.max(0, Math.floor((targetMs - nowMs) / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [
    { label: "days", value: days, max: 7, accent: "#e67e22" },
    { label: "hours", value: hours, max: 24, accent: "#f09a3d" },
    { label: "minutes", value: minutes, max: 60, accent: "#d86f17" },
    { label: "seconds", value: seconds, max: 60, accent: "#b85d12" },
  ];
}

export function PoojaCountdown({ poojaDay }: PoojaCountdownProps) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const poojaCountdown = useMemo(
    () => getPoojaCountdown(poojaDay, nowMs),
    [nowMs, poojaDay],
  );

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);

    return () => window.clearInterval(timer);
  }, []);

  if (!poojaCountdown) return null;

  return (
    <div className="mt-6 rounded-lg border border-saffron/20 bg-[#fff8f2] p-3 shadow-sm">
      <p className="text-xs font-extrabold uppercase tracking-wide text-text-primary">
        Pooja Booking Closes in
      </p>
      <div className="mt-2.5 grid grid-cols-4 gap-1.5 sm:gap-2">
        {poojaCountdown.map((item) => (
          <div
            key={item.label}
            className="flex min-w-0 flex-col items-center gap-1.5 text-center"
          >
            <div
              className="grid h-12 w-12 place-items-center rounded-full p-1 shadow-[0_6px_16px_rgba(230,126,34,0.16)] sm:h-14 sm:w-14 md:h-16 md:w-16"
              style={{
                background: `conic-gradient(${item.accent} ${Math.max(
                  8,
                  (item.value / item.max) * 360,
                )}deg, #ffe1bf 0deg)`,
              }}
              suppressHydrationWarning
            >
              <div className="grid h-full w-full place-items-center rounded-full bg-white ring-2 ring-white">
                <span className="text-xl font-extrabold leading-none text-saffron tabular-nums md:text-2xl" suppressHydrationWarning>
                  {String(item.value).padStart(2, "0")}
                </span>
              </div>
            </div>
            <p className="text-[11px] font-extrabold text-text-primary md:text-xs">
              {item.label}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-1.5 border-t border-saffron/15 pt-2.5 text-xs font-extrabold text-red-700">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        <span>Hurry up, only a few slots left.</span>
      </div>
    </div>
  );
}
