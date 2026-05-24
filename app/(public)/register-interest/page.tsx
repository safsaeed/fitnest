import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { InputField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { registerVenueInterest } from "./actions";

type RegisterInterestPageProps = {
  searchParams?: Promise<{
    success?: string;
    error?: string;
  }>;
};

export default async function RegisterInterestPage({
  searchParams,
}: RegisterInterestPageProps) {
  const params = await searchParams;

  const success = params?.success === "true";
  const error = params?.error;

  const errorMessage =
    error === "missing-required"
      ? "Please complete your email, city and suggested venue."
      : error === "invalid"
        ? "One or more fields is too long. Please shorten your response."
        : null;

  return (
    <main className="min-h-(--min-page-height) flex items-center justify-center px-4">
      <Card className="max-w-md">
        <h1 className="text-2xl font-semibold">Register your interest</h1>

        <p className="mt-2 text-sm text-(--color-text-secondary)">
          Want FitNest near you? Tell us your city and a local venue you would
          like us to consider. We will use this to understand where future
          sessions may be most useful.
        </p>

        {success ? (
          <Alert variant="success" className="mt-4 flex flex-col">
            <span>Thank you!</span> Your venue suggestion has been received.
          </Alert>
        ) : null}

        {errorMessage ? (
          <Alert variant="error" className="mt-4">
            {errorMessage}
          </Alert>
        ) : null}


        {!success ? <form action={registerVenueInterest} className="mt-6 space-y-4">
          <InputField
            label="Your email"
            name="parentEmail"
            type="email"
            required
            maxLength={80}
            autoComplete="email"
            placeholder="you@example.com"
          />

          <InputField
            label="City"
            name="city"
            type="text"
            required
            minLength={3}
            maxLength={50}
            placeholder="e.g. Doncaster"
          />

          <InputField
            label="Suggested venue"
            name="venueName"
            type="text"
            required
            minLength={3}
            maxLength={150}
            placeholder="e.g. local sports centre, school hall, community hub"
          />

          <InputField
            label="Notes"
            name="notes"
            type="text"
            maxLength={200}
            placeholder="Optional"
            hint="You can add preferred days, venue details, or anything else useful."
          />

          <SubmitButton className="w-full mt-2">Submit suggestion</SubmitButton>
        </form> : null}
      </Card>
    </main>
  );
}
