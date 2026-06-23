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

  if (error === "invalid-emergency-name") {
    return "Emergency contact name is too long.";
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
          <InputField label="Email address" name="email" type="email" value={parentUser.email} disabled hint="Contact Fitnest Studios if you need to change your email address." />
          <InputField label="Parent / guardian name" name="name" minLength={2} maxLength={100} defaultValue={parentUser.name} required />
          <InputField label="Phone" name="phone" type="tel" maxLength={20} defaultValue={parentUser.phone ?? ""} />

        <div className="rounded-lg border border-(--color-brand-border) bg-(--color-brand-soft) p-4">
          <h2 className="font-medium">
            Default emergency contact
          </h2>
          <p className="mt-1 text-sm text-(--color-text-secondary)">
            These details will be used automatically when you book from your
            account.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <InputField label="Emergency contact name" name="defaultEmergencyContactName" maxLength={100} defaultValue={parentUser.defaultEmergencyContactName ?? ""} />
            <InputField label="Emergency contact phone" name="defaultEmergencyContactPhone" type="tel" maxLength={20} defaultValue={parentUser.defaultEmergencyContactPhone ?? ""} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton>Save changes</SubmitButton>

          <ButtonLink
            href="/account/password"
            variant="secondary"
          >
            Change password
          </ButtonLink>
        </div>
        </form>
      </Card>
    </div>
  );
}
