const WEEKDAY_INDEX_BY_NAME: Record<string, number> = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  tues: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  thurs: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
};

const ANY_DAY_VALUES = new Set(["any", "any day"]);

function formatPoojaDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function getRelativeDatePrefix(daysUntil: number, date: Date) {
  if (daysUntil === 0) return "Today";
  if (daysUntil === 1) return "Tomorrow";

  return new Intl.DateTimeFormat("en-IN", { weekday: "long" }).format(date);
}

export function getPoojaDateLabel(poojaDay: string | null | undefined) {
  const normalizedPoojaDay = poojaDay?.trim().toLowerCase();
  if (!normalizedPoojaDay) return "";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nextPoojaDate = new Date(today);
  let daysUntilPooja: number;

  if (ANY_DAY_VALUES.has(normalizedPoojaDay)) {
    daysUntilPooja = 1;
  } else {
    const weekdayIndex = WEEKDAY_INDEX_BY_NAME[normalizedPoojaDay];
    if (weekdayIndex === undefined) return poojaDay ?? "";

    daysUntilPooja = (weekdayIndex - today.getDay() + 7) % 7;
    if (daysUntilPooja === 0) daysUntilPooja = 7;
  }

  nextPoojaDate.setDate(today.getDate() + daysUntilPooja);

  return `${getRelativeDatePrefix(daysUntilPooja, nextPoojaDate)}, ${formatPoojaDate(nextPoojaDate)}`;
}