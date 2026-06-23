import { changeParentPassword } from "./actions";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { InputField } from "@/components/ui/form-field";
import { PageHeader } from "@/components/ui/page-header";
import { SubmitButton } from "@/components/ui/submit-button";

type AccountPasswordPageProps = {
  searchParams?: Promise<{
    error?: string;
    status?: string;
  }>;
};

function getErrorMessage(error?: string) {
  if (error === "missing-required") {
    return "Please complete all password fields.";
  }

  if (error === "password-too-short") {
    return "New password must be at least 8 characters.";
  }

  if (error === "password-mismatch") {
    return "New password and confirmation do not match.";
  }

  if (error === "invalid-current-password") {
    return "Current password is incorrect.";
  }

  return null;
}

export default async function AccountPasswordPage({
  searchParams,
}: AccountPasswordPageProps) {
  const params = await searchParams;
  const errorMessage = getErrorMessage(params?.error);

  return (
    <div className="max-w-xl space-y-6">
      <PageHeader
        title="Change password"
        description="Update the password for your parent account."
      />

      {params?.status === "updated" ? (
        <Alert variant="success">
          Password updated.
        </Alert>
      ) : null}

      {errorMessage ? (
        <Alert variant="error">
          {errorMessage}
        </Alert>
      ) : null}

      <Card>
        <form action={changeParentPassword} className="space-y-5">
          <InputField label="Current password" name="currentPassword" type="password" autoComplete="current-password" required />
          <InputField label="New password" name="newPassword" type="password" minLength={8} autoComplete="new-password" required />
          <InputField label="Confirm new password" name="confirmPassword" type="password" minLength={8} autoComplete="new-password" required />
          <SubmitButton className="w-full sm:w-auto">Change password</SubmitButton>
        </form>
      </Card>
    </div>
  );
}
