import type { LeaveUnit } from "./types";

type DurationInput = {
  startDate: string;
  endDate: string;
  leaveUnit: LeaveUnit;
  holidayDates: readonly string[];
};

export type DurationResult =
  | { days: number; error: null }
  | { days: null; error: string };

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function parseDate(value: string) {
  if (!datePattern.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value
    ? null
    : date;
}

function isWorkingDay(date: Date, holidays: Set<string>) {
  const day = date.getUTCDay();
  const dateKey = date.toISOString().slice(0, 10);
  return day !== 0 && day !== 6 && !holidays.has(dateKey);
}

export function calculateRequestedDays({
  startDate,
  endDate,
  leaveUnit,
  holidayDates,
}: DurationInput): DurationResult {
  const start = parseDate(startDate);
  const end = parseDate(endDate);

  if (!start || !end) {
    return { days: null, error: "Choose valid start and end dates." };
  }
  if (end < start) {
    return { days: null, error: "End date cannot be before start date." };
  }
  if (start.getUTCFullYear() !== end.getUTCFullYear()) {
    return { days: null, error: "A request must stay within one calendar year." };
  }

  const holidays = new Set(holidayDates);
  if (leaveUnit !== "full_day") {
    if (startDate !== endDate) {
      return { days: null, error: "Half-day leave must use a single date." };
    }
    if (!isWorkingDay(start, holidays)) {
      return { days: null, error: "Half-day leave must be on a working day." };
    }
    return { days: 0.5, error: null };
  }

  let days = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    if (isWorkingDay(cursor, holidays)) {
      days += 1;
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  if (days === 0) {
    return { days: null, error: "The selected range has no working days." };
  }
  return { days, error: null };
}
