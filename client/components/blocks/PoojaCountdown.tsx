"use client";

import { Fragment, useEffect, useMemo, useState } from "react";

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
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [
    { label: "HR", value: hours },
    { label: "MIN", value: minutes },
    { label: "SEC", value: seconds },
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
    <div>
      <p className="text-xs font-semibold text-text-primary">Booking ends in</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        {poojaCountdown.map((item, index) => (
          <Fragment key={item.label}>
            {index > 0 && (
              <span aria-hidden="true" className="text-sm font-bold text-saffron">
                :
              </span>
            )}
            <span className="rounded-md bg-[#fff4e8] px-2 py-1 text-sm font-semibold text-saffron shadow-sm">
              <span className="tabular-nums" suppressHydrationWarning>
                {String(item.value).padStart(2, "0")}
              </span>{" "}
              <span className="text-[9px] font-medium text-saffron/70">
                {item.label}
              </span>
            </span>
          </Fragment>
        ))}
      </div>
    </div>
  );
}