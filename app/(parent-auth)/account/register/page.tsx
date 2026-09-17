import Link from "next/link";
import { redirect } from "next/navigation";
import { getParentSession } from "@/lib/parent-auth";
import { registerParent } from "./actions";
import { AuthPage } from "@/components/auth-page";
import { Alert } from "@/components/ui/alert";
import { InputField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { PHONE_INPUT_PATTERN } from "@/lib/validation/contact";

type RegisterPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

function getErrorMessage(error?: string) {
  if (error === "missing-required") {
    return "Please complete all required fields.";
  }

  if (error === "invalid-email") {
    return "Please enter a valid email address.";
  }

  if (error === "invalid-phone") {
    return "Please enter a valid phone number.";
  }

  if (error === "missing-emergency-contact") {
    return "Emergency contact name and phone number are required.";
  }

  if (error === "invalid-emergency-name") {
    return "Please enter a valid emergency contact name.";
  }

  if (error === "invalid-emergency-phone") {
    return "Please enter a valid emergency contact phone number.";
  }

  if (error === "password-too-short") {
    return "Password must be at least 8 characters.";
  }

  if (error === "password-mismatch") {
    return "Passwords do not match.";
  }

  if (error === "email-exists") {
    return "An account already exists with this email address.";
  }

  return null;
}

export default async function ParentRegisterPage({
  searchParams,
}: RegisterPageProps) {
  const session = await getParentSession();

  if (session) {
    redirect("/account");
  }

  const params = await searchParams;
  const errorMessage = getErrorMessage(params?.error);

  return (
    <AuthPage
      title="Create parent account"
      description="Save your children and manage your bookings in one place."
    >

        {errorMessage && (
          <Alert variant="error" className="mt-4">
            {errorMessage}
          </Alert>
        )}

        <form action={registerParent} className="mt-6 space-y-4">
          <InputField
            label="Parent name"
            name="name"
            minLength={2}
            maxLength={100}
            autoComplete="name"
            required
          />
          <InputField
            label="Email address"
            name="email"
            type="email"
            maxLength={254}
            autoComplete="email"
            required
          />
          <InputField
            label="Phone number"
            name="phone"
            type="tel"
            minLength={7}
            maxLength={20}
            pattern={PHONE_INPUT_PATTERN}
            title="Enter a valid phone number using numbers, spaces, +, -, or brackets."
            autoComplete="tel"
            inputMode="tel"
          />

          <section className="rounded-lg border border-(--color-warning-border) bg-(--color-warning-soft) p-4">
            <h2 className="font-semibold">Emergency contact</h2>
            <p className="mt-1 text-sm text-(--color-text-secondary)">
              Required for every account and booking so the team knows who to
              contact in an emergency.
            </p>

            <div className="mt-4 space-y-4">
              <InputField
                label="Emergency contact name"
                name="defaultEmergencyContactName"
                minLength={2}
                maxLength={100}
                required
              />
              <InputField
                label="Emergency contact phone"
                name="defaultEmergencyContactPhone"
                type="tel"
                minLength={7}
                maxLength={20}
                pattern={PHONE_INPUT_PATTERN}
                title="Enter a valid phone number using numbers, spaces, +, -, or brackets."
                inputMode="tel"
                required
              />
            </div>
          </section>

          <InputField
            label="Password"
            name="password"
            type="password"
            minLength={8}
            autoComplete="new-password"
            required
          />
          <InputField
            label="Confirm password"
            name="confirmPassword"
            type="password"
            minLength={8}
            autoComplete="new-password"
            required
          />
          <SubmitButton className="w-full">Create account</SubmitButton>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            href="/account/login"
            className="font-medium text-(--color-brand) hover:underline"
          >
            Log in
          </Link>
        </p>
    </AuthPage>
  );
}
