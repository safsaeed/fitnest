import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InputField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatTimeInputValue } from "@/lib/date-time";
import { formatLongDate } from "@/lib/formatters";
import { getRepeatPatternLabel } from "@/lib/session-series";
import type { Session, SessionSeries, Venue } from "@prisma/client";

type SessionSeriesFormProps = {
  series: SessionSeries;
  exampleSession: Session;
  venues: Venue[];
  totalSessions: number;
  upcomingSessions: number;
  bookingCount: number;
  action: (formData: FormData) => void | Promise<void>;
  error?: string;
};

function getErrorMessage(error?: string) {
  if (error === "unauthorized") {
    return "You are not authorized to update this session series.";
  }

  if (error === "not-found") {
    return "This session series could not be found.";
  }

  if (error === "no-matching-sessions") {
    return "There are no upcoming occurrences to update.";
  }

  if (error === "missing-required") {
    return "Please complete all required fields.";
  }

  if (error === "invalid-text") {
    return "Session title or description is too long.";
  }

  if (error === "invalid-dates") {
    return "End time must be after start time.";
  }

  if (error === "invalid-capacity") {
    return "Capacity must be between 1 and 500.";
  }

  if (error === "invalid-price") {
    return "Standard price must be between £0 and £1,000.";
  }

  if (error === "invalid-member-price") {
    return "Member price must be between £0 and £1,000.";
  }

  if (error === "member-price-too-high") {
    return "Member price cannot be higher than the standard price.";
  }

  if (error === "invalid-age-range") {
    return "Max age must be greater than or equal to min age.";
  }

  if (error === "invalid-age") {
    return "Age limits must be between 0 and 18.";
  }

  if (error === "database-error") {
    return "The session series could not be updated. Please try again.";
  }

  return null;
}

export function SessionSeriesForm({
  series,
  exampleSession,
  venues,
  totalSessions,
  upcomingSessions,
  bookingCount,
  action,
  error,
}: SessionSeriesFormProps) {
  const errorMessage = getErrorMessage(error);

  return (
    <Card>
      <form action={action}>
        {errorMessage ? (
          <Alert className="mb-4" variant="error">
            {errorMessage}
          </Alert>
        ) : null}

        <Alert className="mb-6">
          <p className="font-medium text-(--color-text-primary)">
            {getRepeatPatternLabel(series.repeatPattern)} from{" "}
            {formatLongDate(series.startsOn)} to {formatLongDate(series.endsOn)}
          </p>
          <p className="mt-1">
            {totalSessions} occurrence{totalSessions === 1 ? "" : "s"} in
            total, {upcomingSessions} upcoming, {bookingCount} booking
            {bookingCount === 1 ? "" : "s"}. The recurrence pattern and dates
            are not changed by this form.
          </p>
        </Alert>

        <div className="mb-6">
          <label
            htmlFor="scope"
            className="block text-sm font-medium text-(--color-text-secondary)"
          >
            Apply changes to
          </label>
          <select
            id="scope"
            name="scope"
            defaultValue={upcomingSessions > 0 ? "upcoming" : "all"}
            className="mt-1 w-full rounded-lg border border-(--color-brand) bg-white px-3 py-2 text-sm text-(--color-text-secondary) focus:outline-none focus:ring-1 focus:ring-(--color-brand)"
          >
            {upcomingSessions > 0 ? (
              <option value="upcoming">
                Upcoming occurrences ({upcomingSessions})
              </option>
            ) : null}
            <option value="all">All occurrences ({totalSessions})</option>
          </select>
          <p className="mt-1 text-xs text-(--color-text-muted)">
            To change only one date, return to the sessions list and edit that
            occurrence.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label
              htmlFor="venueId"
              className="block text-sm font-medium text-(--color-text-secondary)"
            >
              Venue <span className="text-(--color-danger)"> *</span>
            </label>
            <select
              id="venueId"
              name="venueId"
              required
              defaultValue={exampleSession.venueId}
              className="mt-1 w-full rounded-lg border border-(--color-brand) bg-white px-3 py-2 text-sm text-(--color-text-secondary) focus:outline-none focus:ring-1 focus:ring-(--color-brand)"
            >
              {venues.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name}
                </option>
              ))}
            </select>
          </div>

          <InputField
            label="Session title"
            id="title"
            name="title"
            type="text"
            required
            minLength={2}
            maxLength={100}
            defaultValue={series.title}
            containerClassName="sm:col-span-2"
          />

          <InputField
            label="Description"
            id="description"
            name="description"
            type="text"
            maxLength={1000}
            defaultValue={exampleSession.description ?? ""}
            containerClassName="sm:col-span-2"
          />

          <InputField
            label="Start time"
            id="startTime"
            name="startTime"
            type="time"
            required
            defaultValue={formatTimeInputValue(exampleSession.startsAt)}
          />

          <InputField
            label="End time"
            id="endTime"
            name="endTime"
            type="time"
            required
            defaultValue={formatTimeInputValue(exampleSession.endsAt)}
          />

          <InputField
            label="Session capacity"
            id="capacity"
            name="capacity"
            type="number"
            required
            min={1}
            max={500}
            step={1}
            defaultValue={exampleSession.capacity}
          />

          <InputField
            label="Standard price per child (£)"
            id="pricePounds"
            name="pricePounds"
            type="number"
            required
            min={0}
            max={1000}
            step="0.01"
            defaultValue={(exampleSession.pricePence / 100).toFixed(2)}
          />

          <InputField
            label="Member price per child (£)"
            id="memberPricePounds"
            name="memberPricePounds"
            type="number"
            min={0}
            max={1000}
            step="0.01"
            defaultValue={
              exampleSession.memberPricePence === null
                ? ""
                : (exampleSession.memberPricePence / 100).toFixed(2)
            }
          />

          <InputField
            label="Min age"
            id="minAge"
            name="minAge"
            type="number"
            min={0}
            max={18}
            step={1}
            defaultValue={exampleSession.minAge ?? ""}
          />

          <InputField
            label="Max age"
            id="maxAge"
            name="maxAge"
            type="number"
            min={0}
            max={18}
            step={1}
            defaultValue={exampleSession.maxAge ?? ""}
          />
        </div>

        <div className="mt-4">
          <p className="text-sm font-medium text-(--color-text-secondary)">
            Active sessions
          </p>
          <div className="mt-1 rounded-lg border border-(--color-brand) px-3 pb-1 pt-2 text-sm text-(--color-text-secondary) sm:w-fit">
            <label className="inline-flex cursor-pointer items-center gap-2 font-medium">
              <input
                name="isActive"
                type="checkbox"
                defaultChecked={exampleSession.isActive}
                className="h-4 w-4 cursor-pointer focus:ring-(--color-brand)"
              />
              Enable booking for the selected occurrences.
            </label>
          </div>
        </div>

        {bookingCount > 0 ? (
          <Alert className="mt-6">
            This series contains bookings. Changes to times, venues or other
            customer-visible details also affect booked occurrences.
          </Alert>
        ) : null}

        <div className="mt-6 flex items-center justify-end gap-4">
          <SubmitButton type="submit">Save series changes</SubmitButton>
          <ButtonLink href="/admin/sessions" variant="secondary">
            Cancel
          </ButtonLink>
        </div>
      </form>
    </Card>
  );
}
