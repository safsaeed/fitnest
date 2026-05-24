import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ButtonLink } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SummaryRow } from "@/components/ui/summary-row";
import { formatDate, formatDateTime, formatPrice } from "@/lib/formatters";

type BookingDetailPageProps = {
  params: Promise<{
    bookingId: string;
  }>;
};

export default async function BookingDetailPage({
  params,
}: BookingDetailPageProps) {
  const { bookingId } = await params;

  const booking = await prisma.booking.findUnique({
    where: {
      id: bookingId,
    },
    include: {
      children: true,
      session: {
        include: {
          venue: true,
        },
      },
    },
  });

  if (!booking) {
    notFound();
  }

  return (
    <main className="min-h-(--min-page-height)">
      <section className="mx-auto max-w-5xl px-6 py-8">
        <div className="pt-0 sm:pt-10">
          <Breadcrumbs
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Bookings", href: "/admin/bookings" },
              {
                label: booking.bookingReference,
                href: `/admin/bookings/${booking.id}`,
              },
            ]}
          />

          <h1 className="mt-3 text-3xl font-semibold">
            {booking.bookingReference}
          </h1>

          <p className="mb-3 flex items-center gap-2 text-sm text-(--color-text-secondary)">
            View parent, child, session and payment details.
          </p>

          <span
            className={`rounded-md px-2 py-1 text-sm ${
              booking.status === "CONFIRMED"
                ? "bg-(--color-success-soft) text-(--color-success)"
                : booking.status === "PENDING"
                  ? "bg-(--color-warning-soft) text-(--color-warning)"
                  : "bg-(--color-danger-soft) text-(--color-danger)"
            }`}
          >
            {booking.status}
          </span>
        </div>

        <ButtonLink
          href={`/admin/bookings`}
          variant="ghost"
          size="custom"
          className="mt-6 mb-10 p-0 text-sm text-(--color-brand) hover:bg-transparent hover:brightness-130"
        >
          <span className="flex items-center">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Bookings
          </span>
        </ButtonLink>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <h2 className="mb-4 text-lg font-semibold">Parent details</h2>
            <SummaryRow label="Name" value={booking.parentName} />
            <SummaryRow label="Email" value={booking.parentEmail} />
            <SummaryRow label="Phone" value={booking.parentPhone ?? "—"} />
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold">Session details</h2>
            <SummaryRow label="Venue" value={booking.session.venue.name} />
            <SummaryRow label="Session" value={booking.session.title} />
            <SummaryRow
              label="Starts"
              value={formatDateTime(booking.session.startsAt)}
            />
            <SummaryRow
              label="Ends"
              value={formatDateTime(booking.session.endsAt)}
            />
            <SummaryRow
              label="Booking date"
              value={formatDateTime(booking.createdAt)}
            />
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold">Payment details</h2>
            <SummaryRow
              label="Amount"
              value={formatPrice(booking.totalAmountPence)}
            />
            <SummaryRow label="Booking status" value={booking.status} />
            <SummaryRow label="Payment status" value={booking.paymentStatus} />
            <SummaryRow label="Refund status" value={booking.refundStatus} />
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold">Consent</h2>
            <SummaryRow
              label="Consent accepted"
              value={booking.consentAccepted ? "Yes" : "No"}
            />
            <SummaryRow
              label="Consent accepted at"
              value={
                booking.consentAcceptedAt
                  ? formatDateTime(booking.consentAcceptedAt)
                  : "—"
              }
            />
            <SummaryRow
              label="Consent version"
              value={booking.consentTextVersion ?? "—"}
            />
            <SummaryRow
              label="Marketing opt-in"
              value={booking.marketingOptIn ? "Yes" : "No"}
            />
          </Card>
        </div>

        <Card className="mt-4">
          <h2 className="mb-4 text-lg font-semibold">
            Children ({booking.children.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {booking.children.map((child) => (
              <div
                key={child.id}
                className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2"
              >
                <h3 className="mt-1 mb-3 font-semibold">
                  Child {booking.children.indexOf(child) + 1}
                </h3>

                <SummaryRow
                  label="Name"
                  value={[child.firstName, child.lastName]
                    .filter(Boolean)
                    .join(" ")}
                />
                <SummaryRow
                  label="Date of birth"
                  value={formatDate(child.dateOfBirth)}
                />
                <SummaryRow label="Allergies" value={child.allergies || "—"} />
                <SummaryRow
                  label="Medical notes"
                  value={child.medicalNotes || "—"}
                />
              </div>
            ))}
          </div>
        </Card>
      </section>
    </main>
  );
}
