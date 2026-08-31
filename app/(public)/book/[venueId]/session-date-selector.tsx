import { Button } from "@/components/ui/button";
import {
  getWeekDateKeys,
  shiftDateKey,
} from "@/lib/session-dates";
import { ChevronLeft, ChevronRight } from "lucide-react";

const weekdayFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
});

const dayFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
});

const monthFormatter = new Intl.DateTimeFormat("en-GB", {
  month: "short",
});

const accessibleDateFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function dateFromKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

type SessionDateSelectorProps = {
  availableDateKeys: ReadonlySet<string>;
  firstWeekStartDateKey: string;
  lastWeekStartDateKey: string;
  selectedDateKey: string | null;
  weekStartDateKey: string;
  onSelectDate: (dateKey: string) => void;
  onChangeWeek: (weekStartDateKey: string) => void;
};

export function SessionDateSelector({
  availableDateKeys,
  firstWeekStartDateKey,
  lastWeekStartDateKey,
  selectedDateKey,
  weekStartDateKey,
  onSelectDate,
  onChangeWeek,
}: SessionDateSelectorProps) {
  const visibleDateKeys = getWeekDateKeys(weekStartDateKey);
  const canGoBack = weekStartDateKey > firstWeekStartDateKey;
  const canGoForward = weekStartDateKey < lastWeekStartDateKey;

  return (
    <div className="rounded-lg border border-gray-100 bg-(--color-brand-soft) p-1 relative">

      <span className="sm:hidden text-xs text-(--color-text-secondary) absolute right-4 top-[-20]">Swipe to explore the week</span>

      <div className="flex min-w-0 items-center gap-2">
        <Button
          variant="secondary"
          size="custom"
          className="w-9 p-0 self-stretch"
          aria-label="Previous week"
          disabled={!canGoBack}
          onClick={() => onChangeWeek(shiftDateKey(weekStartDateKey, -7))}
        >
          <ChevronLeft aria-hidden="true" className="h-5 w-5" />
        </Button>

        <div className="min-w-0 flex-1 overflow-x-auto pb-1 sm:pb-0">
          <div
            className="grid w-max grid-cols-7 gap-2 sm:w-full"
            role="group"
            aria-label="Choose a session date"
          >
            {visibleDateKeys.map((dateKey) => {
              const date = dateFromKey(dateKey);
              const isAvailable = availableDateKeys.has(dateKey);
              const isSelected = dateKey === selectedDateKey;

              return (
                <button
                  key={dateKey}
                  type="button"
                  disabled={!isAvailable}
                  aria-pressed={isSelected}
                  aria-label={`${accessibleDateFormatter.format(date)}${
                    isAvailable ? ", sessions available" : ", no sessions"
                  }`}
                  onClick={() => onSelectDate(dateKey)}
                  className={`flex min-h-16 min-w-17 cursor-pointer flex-col items-center justify-center rounded-lg border py-1 text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-brand) disabled:cursor-not-allowed ${
                    isSelected
                      ? "border-(--color-brand-border) bg-(--color-brand) text-white shadow-sm"
                      : isAvailable
                        ? "border-gray-200 bg-white text-(--color-text-primary) hover:border-(--color-brand-border) hover:bg-white"
                        : "border-gray-100 bg-white/50 text-(--color-text-muted) opacity-70"
                  }`}
                >
                  <span className="text-xs font-medium">
                    {weekdayFormatter.format(date)}
                  </span>
                  <span className="text-lg font-semibold">
                    {dayFormatter.format(date)}
                  </span>
                  <span className="text-xs">
                    {monthFormatter.format(date)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <Button
          variant="secondary"
          size="custom"
          className="w-9 p-0 self-stretch"
          aria-label="Next week"
          disabled={!canGoForward}
          onClick={() => onChangeWeek(shiftDateKey(weekStartDateKey, 7))}
        >
          <ChevronRight aria-hidden="true" className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

