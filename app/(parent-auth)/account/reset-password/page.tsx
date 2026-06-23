import Link from "next/link";
import { resetParentPassword } from "./actions";
import { AuthPage } from "@/components/auth-page";
import { Alert } from "@/components/ui/alert";
import { InputField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";

type ResetPasswordPageProps = {
  searchParams?: Promise<{
    token?: string;
    error?: string;
  }>;
};

function getErrorMessage(error?: string) {
  if (error === "missing-required") {
    return "Please complete all fields.";
  }

  if (error === "password-too-short") {
    return "Password must be at least 8 characters.";
  }

  if (error === "password-mismatch") {
    return "Password and confirmation do not match.";
  }

  if (error === "invalid-token") {
    return "This reset link is invalid or has expired.";
  }

  return null;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;
  const token = params?.token ?? "";
  const errorMessage = getErrorMessage(params?.error);

  return (
    <AuthPage
      title="Reset password"
      description="Enter a new password for your parent account."
    >

        {!token || params?.error === "invalid-token" ? (
          <Alert variant="error" className="mt-4">
            This reset link is invalid or has expired.
          </Alert>
        ) : null}

        {errorMessage && params?.error !== "invalid-token" ? (
          <Alert variant="error" className="mt-4">
            {errorMessage}
          </Alert>
        ) : null}

        {token && params?.error !== "invalid-token" ? (
          <form action={resetParentPassword} className="mt-6 space-y-4">
            <input type="hidden" name="token" value={token} />

            <InputField label="New password" name="password" type="password" minLength={8} autoComplete="new-password" required />
            <InputField label="Confirm new password" name="confirmPassword" type="password" minLength={8} autoComplete="new-password" required />
            <SubmitButton className="w-full">Reset password</SubmitButton>
          </form>
        ) : null}

        <p className="mt-6 text-center text-sm text-gray-600">
          <Link
            href="/account/forgot-password"
            className="font-medium text-(--color-brand) hover:underline"
          >
            Request a new reset link
          </Link>
        </p>
    </AuthPage>
  );
}
