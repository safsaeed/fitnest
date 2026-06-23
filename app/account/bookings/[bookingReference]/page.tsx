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

type AccountBookingDetailPageProps = {
  params: Promise<{
    bookingReference: string;
  }>;
  searchParams?: Promise<{
    cancel?: string;
  }>;
};

function getStatusMessage(status: string, paymentStatus: string) {
  if (status === "CONFIRMED" && paymentStatus === "PAID") {
    return {
      title: "Booking confirmed",
      message:
        "Your booking is confirmed. Please keep this reference for your records.",
      badgeClass: "border-green-200 bg-green-50 text-green-800",
    };
  }

  if (status === "PENDING") {
    return {
      title: "Booking pending",
      message:
        "Your booking is pending while payment confirmation is processed. Please refresh this page shortly.",
      badgeClass: "border-amber-200 bg-amber-50 text-amber-800",
    };
  }

  if (status === "CANCELLED" || status === "REFUNDED") {
    return {
      title: "Booking cancelled",
      message: "This booking has been cancelled or refunded.",
      badgeClass: "border-red-200 bg-red-50 text-red-800",
    };
  }

  return {
    title: "Booking status",
    message: "Please contact the team if you need help with this booking.",
    badgeClass: "border-gray-200 bg-gray-50 text-gray-800",
  };
}

function getPricingLabel(pricingType: string) {
  return pricingType === "MEMBER" ? "Member price" : "Standard price";
}

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

  const status = getStatusMessage(booking.status, booking.paymentStatus);
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
          className={`mt-4 w-fit rounded-md border px-3 py-1 text-xs font-medium uppercase tracking-wide ${status.badgeClass}`}
        >
          {booking.status}
        </p>

      </div>

      {query?.cancel === "cancelled" || query?.cancel === "error" ? (
        <Alert variant={query.cancel === "cancelled" ? "success" : "error"}>
          {query.cancel === "cancelled"
            ? "Your booking has been cancelled and refunded."
            : "This booking could not be cancelled. Please contact the team if you need help."}
        </Alert>
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
              label="Total paid"
              value={formatPrice(booking.totalAmountPence)}
            />
            <DetailRow
              label="Price per child"
              value={formatPrice(booking.unitPricePence)}
            />
            <DetailRow
              label="Pricing type"
              value={getPricingLabel(booking.pricingType)}
            />
            <DetailRow label="Children booked" value={booking.childCount} />
            <DetailRow label="Booking status" value={booking.status} />
            <DetailRow label="Payment status" value={booking.paymentStatus} />
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
            <DetailRow
              label="Emergency contact"
              value={booking.emergencyContactName ?? "—"}
            />
            <DetailRow
              label="Emergency phone"
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
