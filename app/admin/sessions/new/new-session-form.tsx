"use client";

import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InputField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatDateInputValue } from "@/lib/date-time";
import type { Venue } from "@prisma/client";
import { Info } from "lucide-react";
import { useState } from "react";

type NewSessionFormProps = {
  venues: Venue[];
  action: (formData: FormData) => void | Promise<void>;
  error?: string;
};

export function NewSessionForm({ venues, action, error }: NewSessionFormProps) {
  const [mode, setMode] = useState<"single" | "repeating">("single");

  const minDate = formatDateInputValue(new Date());

  const errorMessage =
    error === "missing-required"
      ? "Please complete all required fields."
      : error === "invalid-text"
        ? "Session title or description is too long."
        : error === "invalid-dates"
          ? "End time must be after start time."
          : error === "invalid-date-range"
            ? "Last session date must be after the first session date."
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
                      : error === "no-sessions"
                        ? "No sessions could be created for that date range."
                        : error === "too-many-sessions"
                          ? "Too many sessions would be created. Please use a shorter date range."
                          : null;

  return (
    <Card>
      <form action={action}>
        {errorMessage && (
          <Alert className="mb-4" variant="error">
            {errorMessage}
          </Alert>
        )}

        <div className="mb-6">
          <label
            htmlFor="mode"
            className="block text-sm font-medium text-(--color-text-secondary)"
          >
            Session type
          </label>
          <select
            id="mode"
            name="mode"
            value={mode}
            onChange={(event) =>
              setMode(event.target.value as "single" | "repeating")
            }
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none border-(--color-brand) bg-white text-(--color-text-secondary)"
          >
            <option value="single">Single session</option>
            <option value="repeating">Repeating sessions</option>
          </select>
        </div>

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
            />
          </div>

          <div className="sm:col-span-2">
            <InputField
              label="Description"
              id="description"
              name="description"
              type="text"
              maxLength={200}
            />
          </div>

          {mode === "single" ? (
            <>
              <div className="sm:col-span-2">
                <InputField
                  label="Session date"
                  id="singleDate"
                  hint="New sessions cannot be created in the past."
                  name="singleDate"
                  type="date"
                  required
                  min={minDate}
                />
              </div>

              <InputField
                label="Start time"
                id="singleStartTime"
                name="singleStartTime"
                type="time"
                required={mode === "single"}
              />

              <InputField
                label="End time"
                id="singleEndTime"
                name="singleEndTime"
                type="time"
                required={mode === "single"}
                hint="End time must be after the start time."
              />
            </>
          ) : (
            <>
              <InputField
                label="First session date"
                id="startsOn"
                name="startsOn"
                hint="New sessions cannot be created in the past."
                type="date"
                required
                min={minDate}
              />

              <InputField
                label="Last session date"
                id="endsOn"
                name="endsOn"
                type="date"
                required
                min={minDate}
              />

              <InputField
                label="Start time"
                id="startTime"
                name="startTime"
                type="time"
                required={mode === "repeating"}
              />

              <InputField
                label="End time"
                id="endTime"
                name="endTime"
                type="time"
                required={mode === "repeating"}
                hint="End time must be after the start time."
              />

              <div className="sm:col-span-2">
                <label
                  htmlFor="repeatPattern"
                  className="block text-sm font-medium text-(--color-text-secondary)"
                >
                  Repeat pattern
                </label>
                <select
                  id="repeatPattern"
                  name="repeatPattern"
                  defaultValue="weekly"
                  required={mode === "repeating"}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none border-(--color-brand) bg-white text-(--color-text-secondary)"
                >
                  <option value="daily">Every day</option>
                  <option value="every-other-day">Every other day</option>
                  <option value="weekly">Weekly</option>
                  <option value="every-other-week">Every other week</option>
                </select>
              </div>
            </>
          )}

          <InputField
            label="Session capacity"
            id="capacity"
            name="capacity"
            type="number"
            required
            min={1}
            max={50}
            step={1}
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
          />

          <InputField
            hint="Leave blank to use the default minimum age of 1."
            label="Min age"
            id="minAge"
            name="minAge"
            type="number"
            defaultValue={1}
            min={0}
            max={18}
            step={1}
          />

          <InputField
            hint="Leave blank if there is no maximum age."
            label="Max age"
            id="maxAge"
            name="maxAge"
            type="number"
            defaultValue={8}
            min={0}
            max={18}
            step={1}
          />
        </div>

        <p className="mt-6 text-xs p-3 bg-(--color-brand-soft) text-(--color-text-secondary) rounded-lg flex items-center gap-2">
          <Info className="text-(--color-brand) min-w-4 w-4 h-4" />
          {mode === "repeating"
            ? "This will create individual sessions using the selected repeat pattern. Each generated session can still be edited or deactivated separately."
            : "This will create an active session, it can be deactivated separately."}
        </p>

        <div className="mt-6 flex items-center justify-end gap-4">
          <SubmitButton type="submit">
            {" "}
            {mode === "repeating"
              ? "Create repeating sessions"
              : "Create session"}
          </SubmitButton>

          <ButtonLink href="/admin/sessions" variant="secondary">
            Cancel
          </ButtonLink>
        </div>
      </form>
    </Card>
  );
}
