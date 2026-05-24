import { Alert } from "@/components/ui/alert";
import { ApiSubmitButton } from "@/components/ui/api-submit-button";
import { Card } from "@/components/ui/card";
import { InputField } from "@/components/ui/form-field";
import { LoadingForm } from "@/components/ui/loading-form";

type BookingSearchPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function BookingSearchPage({
  searchParams,
}: BookingSearchPageProps) {
  const params = await searchParams;
  const error = params?.error;

  const errorMessage =
    error === "not-found"
      ? "We could not find a booking with that reference and email address. Please check the details and try again."
      : error === "missing"
        ? "Please enter both your booking reference and parent email address."
        : null;

  return (
    <main className="flex min-h-(--min-page-height) items-center justify-center px-6 pb-10 sm:py-10">
      <Card className="max-w-md">
        <h1 className="text-2xl font-semibold">Find your booking</h1>

        <p className="mt-2 text-sm text-(--color-text-secondary)">
          Enter your booking reference and parent email address to view your
          booking.
        </p>

        {errorMessage && (
          <Alert variant="error" className="mt-4">
            {errorMessage}
          </Alert>
        )}

        <LoadingForm
          action="/api/bookings/search"
          method="POST"
          className="mt-6 space-y-4"
        >
          <InputField
            label="Booking reference"
            name="bookingReference"
            id="bookingReference"
            required
            placeholder="e.g. FIT-260507-BZ922M"
            hint="Enter the booking reference from your confirmation email"
          />

          <InputField
            label="Parent email"
            name="parentEmail"
            id="parentEmail"
            type="email"
            required
            placeholder="you@example.com"
          />

          <ApiSubmitButton className="w-full mt-2" type="submit">Find my booking</ApiSubmitButton>
        </LoadingForm>
      </Card>
    </main>
  );
}
