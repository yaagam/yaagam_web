const INDIA_TIME_ZONE = "Asia/Kolkata";
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const WEEKDAY_INDEX: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

function isoFromParts(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function getIndiaTodayIso(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: INDIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return isoFromParts(Number(values.year), Number(values.month), Number(values.day));
}

export function parseIsoCalendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return date.getUTCFullYear() === Number(match[1]) &&
    date.getUTCMonth() === Number(match[2]) - 1 &&
    date.getUTCDate() === Number(match[3])
    ? date
    : null;
}

export function getLastSelectablePoojaDate(todayIso: string) {
  const today = parseIsoCalendarDate(todayIso);
  if (!today) return todayIso;

  const lastDayOfNextMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 2, 0)).getUTCDate();
  const lastDate = new Date(
    Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth() + 1,
      Math.min(today.getUTCDate(), lastDayOfNextMonth),
    ),
  );
  return isoFromParts(
    lastDate.getUTCFullYear(),
    lastDate.getUTCMonth() + 1,
    lastDate.getUTCDate(),
  );
}

export function isSelectablePoojaDate(
  value: string,
  poojaDay: string,
  todayIso = getIndiaTodayIso(),
) {
  const date = parseIsoCalendarDate(value);
  if (!date || value <= todayIso || value > getLastSelectablePoojaDate(todayIso)) {
    return false;
  }

  const targetDay = WEEKDAY_INDEX[poojaDay.trim().toLowerCase()];
  return targetDay === undefined || date.getUTCDay() === targetDay;
}

export function getSelectablePoojaDates(
  poojaDay: string,
  todayIso = getIndiaTodayIso(),
) {
  const start = parseIsoCalendarDate(todayIso);
  const end = parseIsoCalendarDate(getLastSelectablePoojaDate(todayIso));
  if (!start || !end) return [];

  const dates: string[] = [];
  for (let cursor = start.getTime() + DAY_IN_MS; cursor <= end.getTime(); cursor += DAY_IN_MS) {
    const date = new Date(cursor);
    const value = isoFromParts(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate(),
    );
    if (isSelectablePoojaDate(value, poojaDay, todayIso)) dates.push(value);
  }
  return dates;
}

