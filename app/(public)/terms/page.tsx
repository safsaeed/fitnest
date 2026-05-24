import { Card } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <main className="min-h-(--min-page-height) px-4 py-8">
      <section className="mx-auto max-w-5xl">
        <Card className="max-w-none">
          <p className="text-lg font-medium tracking-wide text-(--color-brand)">
            Parent / Guardian
          </p>

          <h1 className="mt-4 text-2xl font-semibold">Terms & Conditions</h1>

          <p className="mt-3 text-sm text-(--color-text-secondary)">
            Please read these terms before booking a FitNest Studios session. By
            completing a booking, you confirm that you understand and accept the
            following conditions.
          </p>

          <section className="mt-6">
            <h2 className="text-lg font-semibold">Session attendance</h2>

            <ul className="mt-3 list-disc space-y-3 pl-6 text-(--color-text-secondary)">
              <li>Parents or guardians must remain on-site at all times.</li>
              <li>
                Parents or guardians must remain contactable during the session.
              </li>
              <li>
                Sessions last a maximum of 1 hour unless stated otherwise.
              </li>
              <li>
                Children must be signed in and out by a parent or guardian.
              </li>
              <li>
                Children must not attend if unwell, including a 48-hour
                exclusion after sickness or diarrhoea.
              </li>
            </ul>
          </section>

          <section className="mt-6">
            <h2 className="text-lg font-semibold">Health and safety</h2>

            <ul className="mt-3 list-disc space-y-3 pl-6 text-(--color-text-secondary)">
              <li>
                Parents or guardians must disclose any allergies, medical
                conditions, behavioural needs, or other important information
                before the session.
              </li>
              <li>
                Parents or guardians consent to first aid treatment being given
                if required.
              </li>
              <li>
                FitNest Studios may refuse attendance if it is not safe or
                appropriate for a child to take part.
              </li>
            </ul>
          </section>

          <section className="mt-6">
            <h2 className="text-lg font-semibold">Cancellation policy</h2>

            <ul className="mt-3 list-disc space-y-3 pl-6 text-(--color-text-secondary)">
              <li>
                Bookings cannot be cancelled 24 hours before the session start
              </li>
              <li>
                If you are unable to attend, please contact us as soon as
                possible.
              </li>
              <li>
                If you need to cancel, please do so using &quot;Find my
                booking&quot; on the homepage as soon as possible.
              </li>
            </ul>
          </section>

          <section className="mt-6 rounded-lg bg-(--color-warning-soft) p-4 text-sm text-(--color-text-secondary)">
            <h2 className="font-semibold text-(--color-text-primary)">
              Data protection
            </h2>

            <p className="mt-2">
              FitNest Studios complies with UK GDPR regulations. Personal data
              is collected lawfully, stored securely, and used only for
              safeguarding and operational purposes. Data will not be shared
              without consent unless required by law.
            </p>
          </section>
        </Card>
      </section>
    </main>
  );
}
