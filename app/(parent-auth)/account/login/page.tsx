import Link from "next/link";
import { redirect } from "next/navigation";
import { getParentSession } from "@/lib/parent-auth";
import { loginParent } from "./actions";
import { AuthPage } from "@/components/auth-page";
import { Alert } from "@/components/ui/alert";
import { InputField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    status?: string;
  }>;
};

function getErrorMessage(error?: string) {
  if (error === "missing-required") {
    return "Please enter your email and password.";
  }

  if (error === "invalid-login") {
    return "Email or password is incorrect.";
  }

  return null;
}

function getStatusMessage(status?: string) {
  if (status === "password-reset") {
    return "Your password has been reset. You can now log in.";
  }

  return null;
}

export default async function ParentLoginPage({
  searchParams,
}: LoginPageProps) {
  const session = await getParentSession();

  if (session) {
    redirect("/account");
  }

  const params = await searchParams;
  const errorMessage = getErrorMessage(params?.error);
  const statusMessage = getStatusMessage(params?.status);

  return (
    <AuthPage
      title="Parent login"
      description="Log in to view your bookings, saved children and membership."
    >

        {statusMessage ? (
          <Alert variant="success" className="mt-4">
            {statusMessage}
          </Alert>
        ) : null}

        {errorMessage && (
          <Alert variant="error" className="mt-4">
            {errorMessage}
          </Alert>
        )}

        <form action={loginParent} className="mt-6 space-y-4">
          <InputField label="Email address" name="email" type="email" autoComplete="email" required />

          <InputField
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            labelAction={
              <Link
                href="/account/forgot-password"
                className="text-xs font-medium text-(--color-brand) hover:underline"
              >
                Forgotten password?
              </Link>
            }
          />

          <SubmitButton className="w-full">Log in</SubmitButton>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Need an account?{" "}
          <Link
            href="/account/register"
            className="font-medium text-(--color-brand) hover:underline"
          >
            Create one
          </Link>
        </p>
    </AuthPage>
  );
}
