"use client";

import { useEffect, useMemo, useState } from "react";

import { WEEKDAY_INDEX_BY_NAME } from "@/constants/pooja-details.const";

type PoojaCountdownProps = {
  poojaDay?: string;
};

function getWeekdayIndex(poojaDay: string) {
  return WEEKDAY_INDEX_BY_NAME[poojaDay.trim().toLowerCase()] ?? null;
}

function getNextPoojaStart(poojaDay: string, nowMs: number) {
  const weekdayIndex = getWeekdayIndex(poojaDay);
  if (weekdayIndex === null) return null;

  const now = new Date(nowMs);
  const target = new Date(now);
  target.setHours(0, 0, 0, 0);

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
    { label: "Days", value: days },
    { label: "Hours", value: hours },
    { label: "Minutes", value: minutes },
    { label: "Seconds", value: seconds },
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
    <div className="mt-8 rounded-lg border border-saffron/20 bg-[#fff8f2] p-4">
      <p className="text-sm font-extrabold uppercase text-text-primary/60">
        Pooja Booking Closes in
      </p>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {poojaCountdown.map((item) => (
          <div
            key={item.label}
            className="rounded-md bg-white px-2 py-3 text-center shadow-sm ring-1 ring-black/5"
          >
            <p className="text-xl font-extrabold tabular-nums text-saffron md:text-2xl">
              {String(item.value).padStart(2, "0")}
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase text-text-primary/50 md:text-xs">
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
