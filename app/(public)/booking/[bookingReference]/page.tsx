import { prisma } from "@/lib/prisma";
import { getCancellationStatus } from "@/lib/cancellation";
import { CancelBookingForm } from "./cancel-booking-form";
import { ButtonLink } from "@/components/ui/button";
import { SummaryRow } from "@/components/ui/summary-row";
import { ArrowLeft } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { formatDate, formatFullDateTime, formatPrice } from "@/lib/formatters";
import { LoadingButtonLink } from "@/components/ui/loading-button-link";
import { LoadingForm } from "@/components/ui/loading-form";
import { ApiSubmitButton } from "@/components/ui/api-submit-button";
import {
  getBookingPaymentBadgeClass,
  getBookingPaymentDisplay,
} from "@/lib/booking-payment";

type BookingReferencePageProps = {
  params: Promise<{
    bookingReference: string;
  }>;
  searchParams?: Promise<{
    token?: string;
    cancel?: string;
    payment?: string;
  }>;
};

export default async function BookingReferencePage({
  params,
  searchParams,
}: BookingReferencePageProps) {
  const { bookingReference } = await params;
  const query = await searchParams;
  const token = query?.token;

  if (!token) {
    return <BookingAccessRequired />;
  }

  const booking = await prisma.booking.findFirst({
    where: {
      bookingReference,
      bookingAccessToken: token,
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
    return <BookingAccessRequired />;
  }

  const status = getBookingPaymentDisplay(booking);
  const cancellation = getCancellationStatus(booking.session.startsAt);

  const canShowCancelButton =
    booking.status === "CONFIRMED" &&
    booking.paymentStatus === "PAID" &&
    cancellation.canCancel;

  return (
    <main className="min-h-(--min-page-height)">
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="pt-0 sm:pt-10">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Booking", href: "/" },
            ]}
          />

          <h1 className="mt-3 text-3xl font-semibold">{status.title}</h1>

          <p
            className={`my-4 w-fit rounded-lg border px-3 py-1 text-sm font-medium uppercase tracking-wide ${getBookingPaymentBadgeClass(status.tone)}`}
          >
            {status.label}
          </p>

          <p className="flex items-center gap-2 text-sm text-(--color-text-secondary)">
            Please see below for the details of your booking.
          </p>
        </div>

        <ButtonLink
          href={`/`}
          variant="ghost"
          size="custom"
          className="mt-6 p-0 text-sm text-(--color-brand) hover:bg-transparent hover:brightness-130"
        >
          <span className="flex items-center">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Home
          </span>
        </ButtonLink>

        <div className="mt-6 flex flex-col gap-4">
          {query?.cancel === "cancelled" ||
          query?.cancel === "refunded" ||
          query?.cancel === "error" ? (
            <Alert
              variant={`${query?.cancel === "error" ? "error" : "success"}`}
            >
              <p>
                {query?.cancel === "refunded"
                  ? "Your booking has been cancelled and a full refund has been issued."
                  : query?.cancel === "cancelled"
                    ? "Your booking has been cancelled. As the cancellation was made within 24 hours of the session, no refund has been issued."
                    : "This booking could not be cancelled. Please contact the team if you need help."}
              </p>
            </Alert>
          ) : null}

          {query?.payment === "expired" || query?.payment === "error" ? (
            <Alert variant="error">
              <p>
                {query.payment === "expired"
                  ? "That payment window has expired. Please start a new booking if you would still like a place."
                  : "We could not reopen payment. Please try again or contact the team if the problem continues."}
              </p>
            </Alert>
          ) : null}

          {bookingReference && (
            <Card>
              <p className="text-sm text-(--color-text-secondary)">
                Booking reference
              </p>
              <p className="mt-2 text-lg font-semibold">{bookingReference}</p>
            </Card>
          )}

          <Alert
            variant={`${booking.status === "CONFIRMED" ? "success" : booking.status === "PENDING" ? "warning" : "error"}`}
          >
            <p>{status.message}</p>
          </Alert>

          {booking.status === "PENDING" &&
          booking.paymentStatus === "PENDING" ? (
            <Card className="border-(--color-warning-border) bg-(--color-warning-soft)">
              <h2 className="text-lg font-semibold">Payment required</h2>
              <p className="mt-2 text-sm text-(--color-text-secondary)">
                This place is not reserved until payment is complete. Continue
                the existing checkout before it expires.
              </p>
              <LoadingForm
                action="/api/bookings/payment"
                method="POST"
                className="mt-4"
              >
                <input
                  type="hidden"
                  name="bookingReference"
                  value={booking.bookingReference}
                />
                <input type="hidden" name="token" value={token} />
                <ApiSubmitButton>Continue to payment</ApiSubmitButton>
              </LoadingForm>
            </Card>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <h2 className="mb-4 text-lg font-semibold">Session details</h2>
              <SummaryRow label="Venue" value={booking.session.venue.name} />
              <SummaryRow label="Session" value={booking.session.title} />
              <SummaryRow
                label="Date/time"
                value={formatFullDateTime(booking.session.startsAt)}
              />
              <SummaryRow
                label="Address"
                value={[
                  booking.session.venue.addressLine1,
                  booking.session.venue.city,
                  booking.session.venue.postcode,
                ]
                  .filter(Boolean)
                  .join(", ")}
              />
            </Card>

            <Card>
              <h2 className="mb-4 text-lg font-semibold">Payment details</h2>
              <SummaryRow
                label={booking.paymentStatus === "PAID" ? "Total paid" : "Total"}
                value={formatPrice(booking.totalAmountPence)}
              />
              <SummaryRow label="Status" value={status.label} />
              <SummaryRow label="Refund status" value={booking.refundStatus} />
            </Card>
          </div>

          <Card>
            <p className="text-sm text-(--color-text-secondary)">
              Please contact the team if you need help or if you have any
              questions about this booking. You can reach us at{" "}
              <a
                href="mailto:contact@fitneststudios.co.uk"
                className="text-(--color-brand) underline"
              >
                contact@fitneststudios.co.uk
              </a>
              .
            </p>
          </Card>

          {booking.status === "CONFIRMED" && (
            <Card>
              <h2 className="text-lg font-semibold">Cancellation</h2>

              <p className="mt-2 mb-4 text-sm text-(--color-text-secondary)">
                {cancellation.message}
              </p>

              {canShowCancelButton ? (
                <CancelBookingForm
                  bookingReference={booking.bookingReference}
                  token={token}
                  isRefundable={cancellation.isRefundable}
                />
              ) : (
                <p className="mt-2 text-sm text-(--color-danger)">
                  This booking can no longer be cancelled online.
                </p>
              )}
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <h2 className="mb-4 text-lg font-semibold">
                Parent / guardian details
              </h2>
              <SummaryRow label="Name" value={booking.parentName} />
              <SummaryRow label="Email" value={booking.parentEmail} />
              <SummaryRow label="Phone" value={booking.parentPhone ?? "—"} />
            </Card>

            <Card className="border-(--color-warning-border) bg-(--color-warning-soft)">
              <h2 className="mb-4 text-lg font-semibold">
                Emergency contact
              </h2>
              <SummaryRow
                label="Name"
                value={booking.emergencyContactName ?? "—"}
              />
              <SummaryRow
                label="Phone"
                value={booking.emergencyContactPhone ?? "—"}
              />
            </Card>

            <Card>
              <h2 className="mb-4 text-lg font-semibold">Children</h2>
              {booking.children.map((child) => (
                <div
                  key={child.id}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 mb-4 last:mb-0"
                >
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
                  <SummaryRow
                    label="Allergies"
                    value={child.allergies || "—"}
                  />
                  <SummaryRow
                    label="Medical notes"
                    value={child.medicalNotes || "—"}
                  />
                </div>
              ))}
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}

function BookingAccessRequired() {
  return (
    <main className="min-h-(--min-page-height) flex items-center justify-center p-4">
      <Card className="max-w-md">
        <h1 className="text-2xl font-semibold">Booking access required</h1>

        <p className="mt-3 text-sm text-(--color-text-secondary)">
          To view this booking, please enter your booking reference and parent
          email address.
        </p>

        <LoadingButtonLink className="w-full mt-6" href="/booking/search">
          Find my booking
        </LoadingButtonLink>
        <LoadingButtonLink className="w-full mt-4" variant="secondary" href="/">
          Back to home
        </LoadingButtonLink>
      </Card>
    </main>
  );
}
