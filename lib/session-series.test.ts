import assert from "node:assert/strict";
import test from "node:test";
import { getWeeklySessionDates } from "./session-series";

function localDate(year: number, month: number, day: number) {
  return new Date(year, month - 1, day);
}

function dateParts(dates: Date[]) {
  return dates.map((date) => [
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  ]);
}

test("creates occurrences on every selected weekday in an inclusive range", () => {
  const dates = getWeeklySessionDates({
    startsOn: localDate(2026, 9, 1),
    endsOn: localDate(2026, 9, 14),
    weekdays: [1, 3],
  });

  assert.deepEqual(dateParts(dates), [
    [2026, 9, 2],
    [2026, 9, 7],
    [2026, 9, 9],
    [2026, 9, 14],
  ]);
});

test("includes selected weekdays that fall on either range boundary", () => {
  const dates = getWeeklySessionDates({
    startsOn: localDate(2026, 9, 6),
    endsOn: localDate(2026, 9, 7),
    weekdays: [0, 1],
  });

  assert.deepEqual(dateParts(dates), [
    [2026, 9, 6],
    [2026, 9, 7],
  ]);
});

test("does not create occurrences when no weekdays are selected", () => {
  const dates = getWeeklySessionDates({
    startsOn: localDate(2026, 9, 1),
    endsOn: localDate(2026, 9, 30),
    weekdays: [],
  });

  assert.deepEqual(dates, []);
});
