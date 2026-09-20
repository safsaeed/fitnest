import Link from "next/link";
import { Card } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <main className="min-h-(--min-page-height) px-4 py-8">
      <section className="mx-auto max-w-6xl">
        <Card className="max-w-none" interactive={false}>
          <p className="text-lg font-medium tracking-wide text-(--color-brand)">
            Privacy
          </p>
          <h1 className="mt-4 text-2xl font-semibold">Your account data</h1>
          <p className="mt-3 text-sm text-(--color-text-secondary)">
            This page explains how FitNest Studios uses the personal information
            provided when you create an account or make a booking.
          </p>

          <div className="mt-8 space-y-8 text-(--color-text-secondary)">
            <section>
              <h2 className="text-lg font-semibold text-(--color-text-primary)">
                Information we use
              </h2>
              <p className="mt-3">
                We use parent or guardian contact details, saved child details,
                emergency contacts, booking and payment information, attendance
                records, and any allergy or medical information supplied for a
                child. Passwords are stored as secure hashes rather than readable
                text.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-(--color-text-primary)">
                Why we use it
              </h2>
              <p className="mt-3">
                We use this information to provide and manage accounts and
                bookings, take payment, communicate about sessions, support safe
                attendance, meet safeguarding and legal responsibilities, and
                handle refunds, complaints, or legal claims. Marketing messages
                are only sent where the appropriate permission exists.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-(--color-text-primary)">
                How long information is kept
              </h2>
              <p className="mt-3">
                Account information is kept while the account is active and then
                reviewed when the account is closed. Information that is no longer
                needed is deleted or anonymised. Some booking, payment,
                safeguarding, or legal records may be retained for an appropriate
                period where they are still required.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-(--color-text-primary)">
                Closing your account
              </h2>
              <p className="mt-3">
                Account holders can deactivate their account or request permanent
                deletion from their profile. Deactivation disables login but does
                not cancel bookings. A permanent deletion request is reviewed so
                that information which must still be retained is not removed
                prematurely. We aim to respond to deletion requests within one
                month.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-(--color-text-primary)">
                Your choices and rights
              </h2>
              <p className="mt-3">
                Depending on the circumstances, you may ask to access, correct,
                restrict, transfer, or erase your personal information, or object
                to how it is used. The right to erasure is not absolute where
                information still needs to be retained for a legal or legitimate
                purpose.
              </p>
            </section>

            <section className="rounded-lg bg-(--color-brand-soft) p-4">
              <h2 className="font-semibold text-(--color-text-primary)">
                Contact us
              </h2>
              <p className="mt-2 text-sm">
                To ask a privacy question, withdraw a deletion request, or request
                account reactivation, email{" "}
                <Link
                  href="mailto:contact@fitneststudios.co.uk"
                  className="font-medium text-(--color-brand) hover:underline"
                >
                  contact@fitneststudios.co.uk
                </Link>
                .
              </p>
            </section>
          </div>
        </Card>
      </section>
    </main>
  );
}
