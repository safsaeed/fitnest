import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InputField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";
import type { Venue } from "@prisma/client";

type VenueFormProps = {
  venue?: Venue;
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  error?: string;
};

export function VenueForm({
  venue,
  action,
  submitLabel,
  error,
}: VenueFormProps) {
  const errorMessage =
    error === "missing-name"
      ? "Venue name is required."
      : error === "invalid-name"
        ? "Venue name must be between 2 and 100 characters."
        : error === "invalid-address"
          ? "Please check the address fields."
          : error === "invalid-postcode"
            ? "Please enter a valid postcode."
            : null;

  return (
    <Card>
      {errorMessage && (
        <Alert className="mb-4" variant="error">
          {errorMessage}
        </Alert>
      )}

      <form action={action}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <InputField
              label="Venue name"
              name="name"
              type="text"
              required
              minLength={2}
              maxLength={100}
              defaultValue={venue?.name ?? ""}
            />
          </div>

          <InputField
            label="Address line 1"
            name="addressLine1"
            type="text"
            maxLength={150}
            autoComplete="address-line1"
            defaultValue={venue?.addressLine1 ?? ""}
          />

          <InputField
            label="Address line 2"
            name="addressLine2"
            type="text"
            maxLength={150}
            autoComplete="address-line2"
            defaultValue={venue?.addressLine2 ?? ""}
          />

          <InputField
            label="City"
            name="city"
            type="text"
            maxLength={80}
            autoComplete="address-level2"
            defaultValue={venue?.city ?? ""}
          />

          <InputField
            label="County"
            name="county"
            type="text"
            maxLength={80}
            autoComplete="address-level1"
            defaultValue={venue?.county ?? ""}
          />

          <InputField
            label="Postcode"
            name="postcode"
            type="text"
            maxLength={10}
            pattern="[A-Za-z]{1,2}[0-9][A-Za-z0-9]? ?[0-9][A-Za-z]{2}"
            title="Enter a valid UK postcode, for example SW1A 1AA."
            autoComplete="postal-code"
            defaultValue={venue?.postcode ?? ""}
          />

          <InputField
            label="Country"
            name="country"
            type="text"
            minLength={2}
            maxLength={80}
            autoComplete="country-name"
            defaultValue={venue?.country ?? "UK"}
          />

          <div>
            <p className="text-sm font-medium text-(--color-text-secondary)">
              Active venue
            </p>
            <div className="mt-1 sm:w-fit rounded-lg border px-3 pt-2 pb-1 text-sm border-(--color-brand) text-(--color-text-secondary)">
              <label className="font-medium cursor-pointer inline-flex items-center gap-2">
                <input
                  name="isActive"
                  type="checkbox"
                  defaultChecked={venue?.isActive ?? false}
                  className="cursor-pointer h-4 w-4 focus:ring-(--color-brand)"
                />
                Enable venue scheduling and booking.
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-4">
          <SubmitButton type="submit">{submitLabel}</SubmitButton>

          <ButtonLink href="/admin/venues" variant="secondary">
            Cancel
          </ButtonLink>
        </div>
      </form>
    </Card>
  );
}
