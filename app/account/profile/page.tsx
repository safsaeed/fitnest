import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getParentSession } from "@/lib/parent-auth";
import { updateParentProfile } from "./actions";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InputField } from "@/components/ui/form-field";
import { PageHeader } from "@/components/ui/page-header";
import { SubmitButton } from "@/components/ui/submit-button";
import { PHONE_INPUT_PATTERN } from "@/lib/validation/contact";

type AccountProfilePageProps = {
  searchParams?: Promise<{
    error?: string;
    status?: string;
  }>;
};

function getErrorMessage(error?: string) {
  if (error === "invalid-name") {
    return "Enter a valid name.";
  }

  if (error === "invalid-phone") {
    return "Enter a valid phone number.";
  }

  if (error === "missing-emergency-contact") {
    return "Emergency contact name and phone number are required.";
  }

  if (error === "invalid-emergency-name") {
    return "Enter a valid emergency contact name.";
  }

  if (error === "invalid-emergency-phone") {
    return "Enter a valid emergency contact phone number.";
  }

  return null;
}

export default async function AccountProfilePage({
  searchParams,
}: AccountProfilePageProps) {
  const session = await getParentSession();

  if (!session) {
    redirect("/account/login");
  }

  const params = await searchParams;
  const errorMessage = getErrorMessage(params?.error);

  const parentUser = await prisma.parentUser.findFirst({
    where: {
      id: session.parentUserId,
      isActive: true,
    },
  });

  if (!parentUser) {
    redirect("/account/login");
  }

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Profile"
        description="Update your parent account details. Your email address cannot be changed here."
      />

      {params?.status === "updated" ? (
        <Alert variant="success">Profile updated.</Alert>
      ) : null}

      {errorMessage ? (
        <Alert variant="error">{errorMessage}</Alert>
      ) : null}

      <Card>
        <form action={updateParentProfile} className="space-y-6">
          <InputField
            label="Email address"
            name="email"
            type="email"
            value={parentUser.email}
            disabled
            hint="Contact Fitnest Studios if you need to change your email address."
          />
          <InputField
            label="Parent / guardian name"
            name="name"
            minLength={2}
            maxLength={100}
            defaultValue={parentUser.name}
            required
          />
          <InputField
            label="Phone"
            name="phone"
            type="tel"
            minLength={7}
            maxLength={20}
            pattern={PHONE_INPUT_PATTERN}
            title="Enter a valid phone number using numbers, spaces, +, -, or brackets."
            inputMode="tel"
            defaultValue={parentUser.phone ?? ""}
          />

          <div className="rounded-lg border border-(--color-brand-border) bg-(--color-brand-soft) p-4">
            <h2 className="font-medium">Default emergency contact</h2>
            <p className="mt-1 text-sm text-(--color-text-secondary)">
              Required for every booking. These details will be filled in
              automatically when you book from your account.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <InputField
                label="Emergency contact name"
                name="defaultEmergencyContactName"
                minLength={2}
                maxLength={100}
                defaultValue={parentUser.defaultEmergencyContactName ?? ""}
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
                defaultValue={parentUser.defaultEmergencyContactPhone ?? ""}
                required
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <SubmitButton>Save changes</SubmitButton>

            <ButtonLink href="/account/password" variant="secondary">
              Change password
            </ButtonLink>
          </div>
        </form>
      </Card>

      <Card interactive={false} className="border-(--color-danger-hover)">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-(--color-danger)">
              Close account
            </h2>
            <p className="mt-1 text-sm text-(--color-text-secondary)">
              Deactivate your account or request permanent deletion of personal
              information we no longer need.
            </p>
          </div>

          <ButtonLink
            href="/account/close"
            variant="destructive"
            className="shrink-0"
          >
            Close account
          </ButtonLink>
        </div>
      </Card>
    </div>
  );
}
