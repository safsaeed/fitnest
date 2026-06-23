import "server-only";

const UK_TIME_ZONE = "Europe/London";

type CutoffKind = "booking" | "cancellation";

function getZonedDateParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = getZonedDateParts(date, timeZone);

  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  return asUtc - date.getTime();
}

function makeDateInTimeZone({
  year,
  month,
  day,
  hour,
  minute = 0,
  second = 0,
  timeZone,
}: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute?: number;
  second?: number;
  timeZone: string;
}) {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  const firstOffset = getTimeZoneOffsetMs(new Date(utcGuess), timeZone);
  const firstUtc = utcGuess - firstOffset;

  const secondOffset = getTimeZoneOffsetMs(new Date(firstUtc), timeZone);
  const secondUtc = utcGuess - secondOffset;

  return new Date(secondUtc);
}

function subtractOneCalendarDay({
  year,
  month,
  day,
}: {
  year: number;
  month: number;
  day: number;
}) {
  const previousDay = new Date(Date.UTC(year, month - 1, day - 1));

  return {
    year: previousDay.getUTCFullYear(),
    month: previousDay.getUTCMonth() + 1,
    day: previousDay.getUTCDate(),
  };
}

export function getSessionCutoffAt(sessionStartsAt: Date) {
  const sessionDateInUk = getZonedDateParts(sessionStartsAt, UK_TIME_ZONE);
  const cutoffDateInUk = subtractOneCalendarDay(sessionDateInUk);

  return makeDateInTimeZone({
    ...cutoffDateInUk,
    hour: 18,
    minute: 0,
    second: 0,
    timeZone: UK_TIME_ZONE,
  });
}

export function isPastSessionCutoff(sessionStartsAt: Date, now = new Date()) {
  return now >= getSessionCutoffAt(sessionStartsAt);
}

export function getSessionCutoffLabel(kind: CutoffKind) {
  if (kind === "booking") {
    return "Bookings close at 6pm the day before the session.";
  }

  return "Cancellations are only available until 6pm the day before the session.";
}

export function formatSessionCutoff(sessionStartsAt: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: UK_TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(getSessionCutoffAt(sessionStartsAt));
}
