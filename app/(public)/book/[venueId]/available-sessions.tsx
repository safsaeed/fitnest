"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingButtonLink } from "@/components/ui/loading-button-link";
import { getWeekDateKeys, getWeekStartDateKey } from "@/lib/session-dates";
import { CalendarDays, Clock } from "lucide-react";
import { SessionDateSelector } from "./session-date-selector";

export type SessionOccurrence = {
  id: string;
  title: string;
  description: string | null;
  priceLabel: string;
  minAge: number | null;
  maxAge: number | null;
  dateKey: string;
  dateLabel: string;
  timeLabel: string;
  spacesRemaining: number;
  canBook: boolean;
  availabilityLabel: string;
};

type AvailableSessionsProps = {
  venueId: string;
  sessionGroups: SessionOccurrence[][];
};

const selectedDateFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function dateFromKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatAgeRange(minAge: number | null, maxAge: number | null) {
  if (minAge !== null && maxAge !== null) {
    if (minAge === maxAge) {
      return `Age ${minAge} ${minAge === 1 ? "year" : "years"}`;
    }

    return `Ages ${minAge} to ${maxAge} years`;
  }

  if (minAge !== null) {
    return `Ages ${minAge}+ years`;
  }

  return `Up to age ${maxAge}`;
}

function formatSpacesRemaining(spacesRemaining: number) {
  if (spacesRemaining === 0) {
    return "Fully booked";
  }

  return `${spacesRemaining} ${spacesRemaining === 1 ? "space" : "spaces"} left`;
}

export function AvailableSessions({
  venueId,
  sessionGroups,
}: AvailableSessionsProps) {
  const availableDateKeys = useMemo(
    () =>
      new Set(
        sessionGroups.flatMap((sessions) =>
          sessions.map((session) => session.dateKey),
        ),
      ),
    [sessionGroups],
  );
  const sortedDateKeys = useMemo(
    () => Array.from(availableDateKeys).sort(),
    [availableDateKeys],
  );
  const firstDateKey = sortedDateKeys[0];
  const lastDateKey = sortedDateKeys.at(-1);
  const firstWeekStartDateKey = firstDateKey
    ? getWeekStartDateKey(firstDateKey)
    : null;
  const lastWeekStartDateKey = lastDateKey
    ? getWeekStartDateKey(lastDateKey)
    : null;

  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(
    firstDateKey ?? null,
  );
  const [weekStartDateKey, setWeekStartDateKey] = useState<string | null>(
    firstWeekStartDateKey,
  );

  if (
    !firstDateKey ||
    !firstWeekStartDateKey ||
    !lastWeekStartDateKey ||
    !weekStartDateKey
  ) {
    return (
      <p className="mt-4 text-(--color-text-secondary)">
        No upcoming sessions are available at this venue.
      </p>
    );
  }

  const filteredSessionGroups = selectedDateKey
    ? sessionGroups
        .map((sessions) =>
          sessions.filter((session) => session.dateKey === selectedDateKey),
        )
        .filter((sessions) => sessions.length > 0)
    : [];

  function handleChangeWeek(nextWeekStartDateKey: string) {
    const nextSelectedDateKey = getWeekDateKeys(nextWeekStartDateKey).find(
      (dateKey) => availableDateKeys.has(dateKey),
    );

    setWeekStartDateKey(nextWeekStartDateKey);
    setSelectedDateKey(nextSelectedDateKey ?? null);
  }

  return (
    <div className="mt-4">
      <SessionDateSelector
        availableDateKeys={availableDateKeys}
        firstWeekStartDateKey={firstWeekStartDateKey}
        lastWeekStartDateKey={lastWeekStartDateKey}
        selectedDateKey={selectedDateKey}
        weekStartDateKey={weekStartDateKey}
        onSelectDate={setSelectedDateKey}
        onChangeWeek={handleChangeWeek}
      />

      <p
        className="mt-1 mb-8 text-sm text-(--color-text-secondary)"
        aria-live="polite"
      >
        {selectedDateKey ? (
          <>
            Showing sessions for{" "}
            <span className="font-semibold text-(--color-text-primary)">
              {selectedDateFormatter.format(dateFromKey(selectedDateKey))}
            </span>
          </>
        ) : (
          "No sessions are available in this week."
        )}
      </p>

      <div className="mt-4 grid gap-4">
        {filteredSessionGroups.length === 0 ? (
          <p className="text-(--color-text-secondary)">
            {selectedDateKey
              ? "No sessions are available on this date."
              : "Choose another week to find available sessions."}
          </p>
        ) : (
          filteredSessionGroups.map((sessions) => {
            const firstSession = sessions[0];

            return (
              <Card
                key={firstSession.id}
                className="min-w-full"
                interactive={false}
              >
                <div className="flex flex-col gap-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {firstSession.title}
                      </h3>

                      {firstSession.description ? (
                        <p className="mt-2 text-sm text-(--color-text-secondary)">
                          {firstSession.description}
                        </p>
                      ) : null}

                      {firstSession.minAge !== null ||
                      firstSession.maxAge !== null ? (
                        <p className="mt-1 text-sm text-(--color-text-secondary)">
                          {formatAgeRange(
                            firstSession.minAge,
                            firstSession.maxAge,
                          )}
                        </p>
                      ) : null}
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-(--color-text-secondary)">
                        <span className="text-lg font-semibold">
                          {firstSession.priceLabel}
                        </span>{" "}
                        <span className="text-xs">per child</span>
                      </p>

                      <p className="mt-1 text-xs text-(--color-text-muted)">
                        Bookings close 6pm the day before the session.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className={`flex flex-col gap-4 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between ${
                          session.canBook ? "" : "bg-gray-50"
                        }`}
                      >
                        <div className="grid gap-2">
                          <p className="flex items-center gap-2 text-sm font-medium text-(--color-text-primary)">
                            <Clock
                              aria-hidden="true"
                              className="h-4 w-4 shrink-0 text-(--color-brand)"
                            />
                            <span>{session.timeLabel}</span>
                          </p>

                          <p className="flex items-center gap-2 text-xs text-(--color-text-muted)">
                            <CalendarDays
                              aria-hidden="true"
                              className="h-4 w-4 shrink-0"
                            />
                            <span>{session.dateLabel}</span>
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 self-end">
                          <span
                            className={`rounded-lg px-3 py-1 text-xs font-medium ${
                              session.spacesRemaining <= 3
                                ? "bg-(--color-warning-soft) text-(--color-warning)"
                                : "bg-(--color-success-soft) text-(--color-success)"
                            }`}
                          >
                            {formatSpacesRemaining(session.spacesRemaining)}
                          </span>

                          {session.canBook ? (
                            <LoadingButtonLink
                              href={`/book/${venueId}/${session.id}`}
                              size="sm"
                              className="w-22.5"
                            >
                              Book
                            </LoadingButtonLink>
                          ) : (
                            <Button
                              type="button"
                              disabled
                              variant="secondary"
                              size="sm"
                              className="min-w-22.5 whitespace-nowrap"
                            >
                              {session.availabilityLabel}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
