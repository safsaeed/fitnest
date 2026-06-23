import type { ParentChild } from "@prisma/client";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InputField, TextareaField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";

type ChildFormProps = {
  child?: ParentChild;
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  error?: string;
  returnTo?: string | null;
};

function formatDateInput(date?: Date | null) {
  if (!date) {
    return "";
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getErrorMessage(error?: string) {
  if (error === "missing-required") {
    return "First name and date of birth are required.";
  }

  if (error === "invalid-name") {
    return "Child name is too long.";
  }

  if (error === "invalid-notes") {
    return "Allergies or medical notes are too long.";
  }

  if (error === "invalid-date-of-birth") {
    return "Date of birth cannot be in the future.";
  }

  return null;
}

export function ChildForm({
  child,
  action,
  submitLabel,
  error,
  returnTo,
}: ChildFormProps) {
  const errorMessage = getErrorMessage(error);
  const cancelHref = returnTo || "/account/children";

  return (
    <Card>
      <form action={action} className="space-y-6">
      {returnTo ? (
        <input type="hidden" name="returnTo" value={returnTo} />
      ) : null}

      {errorMessage && (
        <Alert variant="error">
          {errorMessage}
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
          <InputField label="First name" name="firstName" maxLength={80} defaultValue={child?.firstName ?? ""} required />
          <InputField label="Last name" name="lastName" maxLength={80} defaultValue={child?.lastName ?? ""} />
          <InputField containerClassName="sm:col-span-2" label="Date of birth" name="dateOfBirth" type="date" defaultValue={formatDateInput(child?.dateOfBirth)} required />
          <TextareaField containerClassName="sm:col-span-2" label="Allergies" name="allergies" rows={3} maxLength={500} defaultValue={child?.allergies ?? ""} placeholder="Enter none if there are no known allergies." />
          <TextareaField containerClassName="sm:col-span-2" label="Medical notes" name="medicalNotes" rows={4} maxLength={1000} defaultValue={child?.medicalNotes ?? ""} placeholder="Enter none if there are no medical notes." />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>{submitLabel}</SubmitButton>

        <ButtonLink
          href={cancelHref}
          variant="secondary"
        >
          Cancel
        </ButtonLink>
      </div>
      </form>
    </Card>
  );
}
