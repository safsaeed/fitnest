import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InputField } from "@/components/ui/form-field";
import { PageHeader } from "@/components/ui/page-header";
import { SubmitButton } from "@/components/ui/submit-button";
import { closeParentAccount } from "./actions";

type CloseAccountPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

function getErrorMessage(error?: string) {
  if (error === "missing-confirmation") {
    return "Enter your current password and confirm that you understand what will happen.";
  }

  if (error === "invalid-current-password") {
    return "Current password is incorrect.";
  }

  if (error === "active-membership") {
    return "Please contact FitNest Studios before closing this account because it has a subscription that may still require attention.";
  }

  if (error === "invalid-action") {
    return "Choose whether you want to deactivate your account or request permanent deletion.";
  }

  return null;
}

export default async function CloseAccountPage({
  searchParams,
}: CloseAccountPageProps) {
  const params = await searchParams;
  const errorMessage = getErrorMessage(params?.error);

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Close account"
        description="Disable access to your parent account or ask us to permanently delete information we no longer need."
      />

      {errorMessage ? <Alert variant="error">{errorMessage}</Alert> : null}

      <Alert>
        Closing your account does not cancel or refund any bookings. Existing
        bookings remain valid and can still be accessed using their booking
        reference.
      </Alert>

      <Card interactive={false}>
        <form action={closeParentAccount} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <section className="rounded-lg border border-(--color-brand-border) bg-(--color-brand-soft) p-4">
              <h2 className="font-semibold">Deactivate only</h2>
              <p className="mt-2 text-sm text-(--color-text-secondary)">
                Login is disabled immediately. Your saved details and booking
                history are retained so the account can be restored if you
                contact us.
              </p>
            </section>

            <section className="rounded-lg border border-(--color-danger-hover) bg-(--color-danger-soft) p-4">
              <h2 className="font-semibold text-(--color-danger)">
                Request permanent deletion
              </h2>
              <p className="mt-2 text-sm text-(--color-text-secondary)">
                Login is disabled immediately and an administrator reviews
                which information can be deleted or anonymised. We will respond
                within one month.
              </p>
            </section>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <h2 className="font-semibold">Before you continue</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-(--color-text-secondary)">
              <li>Your bookings will not be cancelled or refunded.</li>
              <li>You will be signed out and unable to log in.</li>
              <li>
                Booking, payment, safeguarding, or legal records may need to be
                retained for an appropriate period.
              </li>
            </ul>
            <p className="mt-3 text-sm">
              <Link
                href="/privacy"
                className="font-medium text-(--color-brand) hover:underline"
              >
                Read how we handle account data
              </Link>
            </p>
          </div>

          <InputField
            label="Current password"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
          />

          <label className="flex items-start gap-3 text-sm text-(--color-text-secondary)">
            <input
              type="checkbox"
              name="understood"
              className="mt-1 h-4 w-4 accent-(--color-brand)"
              required
            />
            <span>
              I understand that account closure does not cancel my bookings and
              that I will be signed out immediately.
            </span>
          </label>

          <div className="flex flex-wrap gap-3">
            <SubmitButton
              name="intent"
              value="deactivate"
              variant="secondary"
            >
              Deactivate account
            </SubmitButton>
            <SubmitButton
              name="intent"
              value="delete"
              variant="destructive"
            >
              Request permanent deletion
            </SubmitButton>
            <ButtonLink href="/account/profile" variant="ghost">
              Keep my account
            </ButtonLink>
          </div>

          <p className="text-xs text-(--color-text-muted)">
            Need help first? Email{" "}
            <Link
              href="mailto:contact@fitneststudios.co.uk"
              className="font-medium text-(--color-brand) hover:underline"
            >
              contact@fitneststudios.co.uk
            </Link>
            .
          </p>
        </form>
      </Card>
    </div>
  );
}
