import { addDays, format, parseISO, startOfWeek } from "date-fns";

const DATE_KEY_FORMAT = "yyyy-MM-dd";

export function getLocalDateKey(date: Date) {
  return format(date, DATE_KEY_FORMAT);
}

export function getWeekStartDateKey(dateKey: string) {
  return format(
    startOfWeek(parseISO(dateKey), { weekStartsOn: 1 }),
    DATE_KEY_FORMAT,
  );
}

export function getWeekDateKeys(weekStartDateKey: string) {
  const weekStart = parseISO(weekStartDateKey);

  return Array.from({ length: 7 }, (_, index) =>
    format(addDays(weekStart, index), DATE_KEY_FORMAT),
  );
}

export function shiftDateKey(dateKey: string, days: number) {
  return format(addDays(parseISO(dateKey), days), DATE_KEY_FORMAT);
}

