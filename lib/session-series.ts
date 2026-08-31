import { addDays } from "@/lib/date-time";

export const WEEKDAYS = [
  { value: 1, label: "Monday", shortLabel: "Mon" },
  { value: 2, label: "Tuesday", shortLabel: "Tue" },
  { value: 3, label: "Wednesday", shortLabel: "Wed" },
  { value: 4, label: "Thursday", shortLabel: "Thu" },
  { value: 5, label: "Friday", shortLabel: "Fri" },
  { value: 6, label: "Saturday", shortLabel: "Sat" },
  { value: 0, label: "Sunday", shortLabel: "Sun" },
] as const;

const VALID_WEEKDAY_VALUES = new Set<number>(
  WEEKDAYS.map((weekday) => weekday.value),
);

export function getWeeklySessionDates({
  startsOn,
  endsOn,
  weekdays,
}: {
  startsOn: Date;
  endsOn: Date;
  weekdays: number[];
}) {
  const dates: Date[] = [];
  const selectedWeekdays = new Set(
    weekdays.filter((weekday) => VALID_WEEKDAY_VALUES.has(weekday)),
  );

  for (
    let current = new Date(startsOn);
    current <= endsOn;
    current = addDays(current, 1)
  ) {
    if (selectedWeekdays.has(current.getDay())) {
      dates.push(new Date(current));
    }
  }

  return dates;
}

export function getRepeatPatternLabel(repeatPattern: string) {
  if (repeatPattern === "daily") {
    return "Every day";
  }

  if (repeatPattern === "every-other-day") {
    return "Every other day";
  }

  if (repeatPattern === "every-other-week") {
    return "Every other week";
  }

  return "Weekly";
}
