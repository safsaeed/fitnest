import { loginAdmin } from "./actions";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { InputField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";

type AdminLoginPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const params = await searchParams;
  const error = params?.error;

  const errorMessage =
    error === "missing"
      ? "Email and password are required."
      : error === "invalid"
        ? "Invalid email or password."
        : null;

  return (
    <main className="min-h-(--min-page-height) flex items-center justify-center px-4">
      <Card className="max-w-md">
        <h1 className="text-2xl font-semibold">Admin login</h1>
        <p className="mt-2 text-sm text-(--color-text-secondary)">
          Sign in to manage venues, sessions and bookings.
        </p>

        {errorMessage && (
          <Alert variant="error" className="mt-4">
            {errorMessage}
          </Alert>
        )}

        <form action={loginAdmin} className="mt-4 space-y-4">
          <InputField
            label="Email"
            id="email"
            name="email"
            type="email"
            required
          />

          <InputField
            label="Password"
            id="password"
            name="password"
            type="password"
            required
          />

          <SubmitButton className="mt-4 w-full">Log in</SubmitButton>
        </form>
      </Card>
    </main>
  );
}
