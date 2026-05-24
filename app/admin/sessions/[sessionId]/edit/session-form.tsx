import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InputField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatDateInputValue, formatTimeInputValue } from "@/lib/date-time";
import type { Session, Venue } from "@prisma/client";

type SessionWithVenue = Session & {
  venue?: Venue;
};

type SessionFormProps = {
  session?: SessionWithVenue;
  venues: Venue[];
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  error?: string;
};

function getMinSessionDate(session?: SessionWithVenue) {
  if (session) {
    return undefined;
  }

  return formatDateInputValue(new Date());
}

export function SessionForm({
  session,
  venues,
  action,
  submitLabel,
  error,
}: SessionFormProps) {
  const minSessionDate = getMinSessionDate(session);

  const errorMessage =
    error === "missing-required"
      ? "Venue, title, start time and end time are required."
      : error === "invalid-text"
        ? "Session title or description is too long."
        : error === "invalid-dates"
          ? "End time must be after start time."
          : error === "start-in-past"
            ? "New sessions cannot start in the past."
            : error === "invalid-capacity"
              ? "Capacity must be between 1 and 500."
              : error === "invalid-price"
                ? "Price must be between £0 and £1,000."
                : error === "invalid-age-range"
                  ? "Max age must be greater than or equal to min age."
                  : error === "invalid-age"
                    ? "Age limits must be between 0 and 18."
                    : error === "invalid-venue"
                      ? "Please select a valid active venue."
                      : null;

  return (
    <Card>
      <form action={action}>
        {errorMessage && (
          <Alert className="mb-4" variant="error">
            {errorMessage}
          </Alert>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label
              htmlFor="venueId"
              className="block text-sm font-medium text-(--color-text-secondary)"
            >
              Venue
            </label>
            <select
              id="venueId"
              name="venueId"
              required
              defaultValue={session?.venueId ?? ""}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none border-(--color-brand) bg-white text-(--color-text-secondary)"
            >
              <option value="">Select a venue</option>
              {venues.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <InputField
              label="Session title"
              id="title"
              name="title"
              type="text"
              required
              minLength={2}
              maxLength={100}
              defaultValue={session?.title ?? ""}
            />
          </div>

          <div className="sm:col-span-2">
            <InputField
              label="Description"
              id="description"
              name="description"
              type="text"
              maxLength={200}
              defaultValue={session?.description ?? ""}
            />
          </div>

          <div className="sm:col-span-2">
            <InputField
              label="Session date"
              id="singleDate"
              hint="New sessions cannot be created in the past."
              name="singleDate"
              type="date"
              required
              min={minSessionDate}
              defaultValue={formatDateInputValue(session?.startsAt)}
            />
          </div>

          <InputField
            label="Start time"
            id="singleStartTime"
            name="singleStartTime"
            type="time"
            required
            defaultValue={formatTimeInputValue(session?.startsAt)}
          />

          <InputField
            label="End time"
            id="singleEndTime"
            name="singleEndTime"
            type="time"
            required
            defaultValue={formatTimeInputValue(session?.endsAt)}
            hint="End time must be after the start time."
          />

          <InputField
            label="Session capacity"
            id="capacity"
            name="capacity"
            type="number"
            required
            min={1}
            max={50}
            step={1}
            defaultValue={session?.capacity ?? 10}
          />

          <InputField
            label="Price per child (£)"
            id="pricePounds"
            name="pricePounds"
            type="number"
            required
            min={0}
            max={1000}
            step="0.01"
            defaultValue={
              session ? (session.pricePence / 100).toFixed(2) : "10.00"
            }
          />

          <InputField
            hint="Leave blank to use the default minimum age of 1."
            label="Min age"
            id="minAge"
            name="minAge"
            type="number"
            min={0}
            max={18}
            step={1}
            defaultValue={session?.minAge ?? ""}
          />

          <InputField
            hint="Leave blank if there is no maximum age."
            label="Max age"
            id="maxAge"
            name="maxAge"
            type="number"
            min={0}
            max={18}
            step={1}
            defaultValue={session?.maxAge ?? ""}
          />
        </div>

        <div className="mt-4">
          <p className="text-sm font-medium text-(--color-text-secondary)">
            Active session
          </p>
          <div className="mt-1 sm:w-fit rounded-lg border px-3 pt-2 pb-1 text-sm border-(--color-brand) text-(--color-text-secondary)">
            <label className="font-medium cursor-pointer inline-flex items-center gap-2">
              <input
                name="isActive"
                type="checkbox"
                defaultChecked={session?.isActive ?? true}
                className="cursor-pointer h-4 w-4 focus:ring-(--color-brand)"
              />
              Enable session booking.
            </label>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-4">
          <SubmitButton type="submit">{submitLabel}</SubmitButton>

          <ButtonLink href="/admin/sessions" variant="secondary">
            Cancel
          </ButtonLink>
        </div>
      </form>
    </Card>
  );
}
