import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getParentSession } from "@/lib/parent-auth";
import { getCancellationStatus } from "@/lib/cancellation";
import { formatDate, formatFullDateTime, formatPrice } from "@/lib/formatters";
import { AccountCancelBookingForm } from "./cancel-booking-form";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingForm } from "@/components/ui/loading-form";
import { ApiSubmitButton } from "@/components/ui/api-submit-button";
import {
  getBookingPaymentBadgeClass,
  getBookingPaymentDisplay,
} from "@/lib/booking-payment";

type AccountBookingDetailPageProps = {
  params: Promise<{
    bookingReference: string;
  }>;
  searchParams?: Promise<{
    cancel?: string;
    payment?: string;
  }>;
};

function buildVenueAddress(booking: {
  session: {
    venue: {
      addressLine1: string | null;
      addressLine2: string | null;
      city: string | null;
      county: string | null;
      postcode: string | null;
    };
  };
}) {
  return [
    booking.session.venue.addressLine1,
    booking.session.venue.addressLine2,
    booking.session.venue.city,
    booking.session.venue.county,
    booking.session.venue.postcode,
  ]
    .filter(Boolean)
    .join(", ");
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="border-b border-gray-100 py-3 last:border-b-0">
      <p className="text-xs font-medium uppercase tracking-wide text-(--color-text-muted)">
        {label}
      </p>
      <div className="mt-1 text-sm text-(--color-text-primary)">{value}</div>
    </div>
  );
}

export default async function AccountBookingDetailPage({
  params,
  searchParams,
}: AccountBookingDetailPageProps) {
  const parentSession = await getParentSession();

  if (!parentSession) {
    redirect("/account/login");
  }

  const { bookingReference } = await params;
  const query = await searchParams;

  const booking = await prisma.booking.findFirst({
    where: {
      bookingReference,
      parentUserId: parentSession.parentUserId,
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

  const status = getBookingPaymentDisplay(booking);
  const cancellation = getCancellationStatus(booking.session.startsAt);

  const canShowCancelButton =
    booking.status === "CONFIRMED" &&
    booking.paymentStatus === "PAID" &&
    cancellation.canCancel;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <ButtonLink
          href="/account/bookings"
          variant="ghost"
          size="custom"
          className="p-0 text-sm hover:bg-transparent"
        >
          ← Back to bookings
        </ButtonLink>

        <PageHeader title={status.title} description={status.message} />

        <p
          className={`mt-4 w-fit rounded-md border px-3 py-1 text-xs font-medium uppercase tracking-wide ${getBookingPaymentBadgeClass(status.tone)}`}
        >
          {status.label}
        </p>

      </div>

      {query?.cancel === "cancelled" ||
      query?.cancel === "refunded" ||
      query?.cancel === "error" ? (
        <Alert variant={query.cancel === "error" ? "error" : "success"}>
          {query.cancel === "refunded"
            ? "Your booking has been cancelled and a full refund has been issued."
            : query.cancel === "cancelled"
              ? "Your booking has been cancelled. As the cancellation was made within 24 hours of the session, no refund has been issued."
              : "This booking could not be cancelled. Please contact the team if you need help."}
        </Alert>
      ) : null}

      {query?.payment === "expired" || query?.payment === "error" ? (
        <Alert variant="error">
          {query.payment === "expired"
            ? "That payment window has expired. Please start a new booking if you would still like a place."
            : "We could not reopen payment. Please try again or contact the team if the problem continues."}
        </Alert>
      ) : null}

      {booking.status === "PENDING" &&
      booking.paymentStatus === "PENDING" ? (
        <Card className="border-(--color-warning-border) bg-(--color-warning-soft)">
          <h2 className="text-lg font-semibold">Payment required</h2>
          <p className="mt-2 text-sm text-(--color-text-secondary)">
            This place is not reserved until payment is complete. Continue the
            existing checkout before it expires.
          </p>
          <LoadingForm action="/api/bookings/payment" method="POST" className="mt-4">
            <input
              type="hidden"
              name="bookingReference"
              value={booking.bookingReference}
            />
            <ApiSubmitButton>Continue to payment</ApiSubmitButton>
          </LoadingForm>
        </Card>
      ) : null}

      <Card>
        <p className="text-sm text-(--color-text-muted)">Booking reference</p>
        <p className="mt-2 text-xl font-semibold">
          {booking.bookingReference}
        </p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">
            Session details
          </h2>

          <div className="mt-4">
            <DetailRow label="Venue" value={booking.session.venue.name} />
            <DetailRow label="Session" value={booking.session.title} />
            <DetailRow
              label="Date/time"
              value={formatFullDateTime(booking.session.startsAt)}
            />
            <DetailRow
              label="Address"
              value={buildVenueAddress(booking) || "—"}
            />
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">
            Payment details
          </h2>

          <div className="mt-4">
            <DetailRow
              label={booking.paymentStatus === "PAID" ? "Total paid" : "Total"}
              value={formatPrice(booking.totalAmountPence)}
            />
            <DetailRow
              label="Price per child"
              value={formatPrice(booking.unitPricePence)}
            />
            <DetailRow label="Children booked" value={booking.childCount} />
            <DetailRow label="Status" value={status.label} />
            <DetailRow label="Refund status" value={booking.refundStatus} />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">
            Parent / guardian details
          </h2>

          <div className="mt-4">
            <DetailRow label="Name" value={booking.parentName} />
            <DetailRow label="Email" value={booking.parentEmail} />
            <DetailRow label="Phone" value={booking.parentPhone ?? "—"} />
          </div>
        </Card>

        <Card className="border-(--color-warning-border) bg-(--color-warning-soft)">
          <h2 className="text-lg font-semibold">Emergency contact</h2>

          <div className="mt-4">
            <DetailRow
              label="Name"
              value={booking.emergencyContactName ?? "—"}
            />
            <DetailRow
              label="Phone"
              value={booking.emergencyContactPhone ?? "—"}
            />
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Children</h2>

          <div className="mt-4 space-y-4">
            {booking.children.map((child) => (
              <div
                key={child.id}
                className="rounded-lg border border-(--color-brand-border) bg-(--color-brand-soft) p-4"
              >
                <DetailRow
                  label="Name"
                  value={[child.firstName, child.lastName]
                    .filter(Boolean)
                    .join(" ")}
                />
                <DetailRow
                  label="Date of birth"
                  value={formatDate(child.dateOfBirth)}
                />
                <DetailRow label="Allergies" value={child.allergies || "—"} />
                <DetailRow
                  label="Medical notes"
                  value={child.medicalNotes || "—"}
                />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {booking.status === "CONFIRMED" ? (
        <Card>
          <h2 className="text-lg font-semibold">Cancellation</h2>

          <p className="mt-2 text-sm text-(--color-text-secondary)">{cancellation.message}</p>

          <div className="mt-4">
            {canShowCancelButton ? (
              <AccountCancelBookingForm
                bookingReference={booking.bookingReference}
                token={booking.bookingAccessToken}
                isRefundable={cancellation.isRefundable}
              />
            ) : (
              <p className="text-sm text-(--color-danger)">
                This booking can no longer be cancelled online.
              </p>
            )}
          </div>
        </Card>
      ) : null}

      <Card>
        <p className="text-sm text-(--color-text-secondary)">
          Need help with this booking? Contact{" "}
          <a
            href="mailto:contact@fitneststudios.co.uk"
            className="font-medium underline"
          >
            contact@fitneststudios.co.uk
          </a>
          .
        </p>
      </Card>
    </div>
  );
}
