import Link from "next/link";
import { requestParentPasswordReset } from "./actions";
import { AuthPage } from "@/components/auth-page";
import { Alert } from "@/components/ui/alert";
import { InputField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";

type ForgotPasswordPageProps = {
  searchParams?: Promise<{
    status?: string;
  }>;
};

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const params = await searchParams;

  return (
    <AuthPage
      title="Forgotten password"
      description="Enter your email address and we’ll send password reset instructions if an account exists."
    >

        {params?.status === "sent" ? (
          <Alert variant="success" className="mt-4">
            If an account exists for that email, we’ve sent password reset
            instructions.
          </Alert>
        ) : null}

        <form action={requestParentPasswordReset} className="mt-6 space-y-4">
          <InputField label="Email address" name="email" type="email" autoComplete="email" required />
          <SubmitButton className="w-full">Send reset link</SubmitButton>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Remember your password?{" "}
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
