import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ButtonLink } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SummaryRow } from "@/components/ui/summary-row";
import { formatDate, formatDateTime, formatPrice } from "@/lib/formatters";
import { getCancellationStatus } from "@/lib/cancellation";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";

type BookingDetailPageProps = {
  params: Promise<{
    bookingId: string;
  }>;
};

function getStatusBadgeClass(status: string) {
  if (status === "CONFIRMED") {
    return "bg-(--color-success-soft) text-(--color-success)";
  }

  if (status === "PENDING") {
    return "bg-(--color-warning-soft) text-(--color-warning)";
  }

  return "bg-(--color-danger-soft) text-(--color-danger)";
}

function getPricingLabel(pricingType: string) {
  return pricingType === "MEMBER" ? "Member price" : "Standard price";
}

function getBookingSourceLabel(parentUserId: string | null) {
  return parentUserId ? "Account booking" : "Guest booking";
}

function getMembershipLabel(status?: string | null) {
  if (!status) {
    return "No membership";
  }

  if (status === "ACTIVE") {
    return "Active";
  }

  if (status === "INCOMPLETE") {
    return "Incomplete";
  }

  if (status === "PAST_DUE") {
    return "Past due";
  }

  if (status === "UNPAID") {
    return "Unpaid";
  }

  if (status === "CANCELLED") {
    return "Cancelled";
  }

  return status;
}

function buildPublicBookingUrl({
  bookingReference,
  bookingAccessToken,
}: {
  bookingReference: string;
  bookingAccessToken: string;
}) {
  const appUrl = process.env.APP_URL;

  if (!appUrl) {
    return null;
  }

  return `${appUrl}/booking/${bookingReference}?token=${bookingAccessToken}`;
}

export default async function BookingDetailPage({
  params,
}: BookingDetailPageProps) {
  const { bookingId } = await params;

  const booking = await prisma.booking.findUnique({
    where: {
      id: bookingId,
    },
    include: {
      children: {
        include: {
          parentChild: true,
        },
      },
      parentUser: {
        include: {
          membership: true,
        },
      },
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

  const cancellation = getCancellationStatus(booking.session.startsAt);

  const canCancelAndRefund =
    booking.status === "CONFIRMED" &&
    booking.paymentStatus === "PAID" &&
    cancellation.canCancel;

  const publicBookingUrl = buildPublicBookingUrl({
    bookingReference: booking.bookingReference,
    bookingAccessToken: booking.bookingAccessToken,
  });

  return (
    <main className="min-h-(--min-page-height)">
      <section className="mx-auto max-w-6xl px-6 py-8">
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
            View parent, child, session, payment and membership details.
          </p>

          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-md px-2 py-1 text-sm ${getStatusBadgeClass(
                booking.status,
              )}`}
            >
              {booking.status}
            </span>

            <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-sm text-gray-700">
              {getBookingSourceLabel(booking.parentUserId)}
            </span>

            <span
              className={`rounded-md border px-2 py-1 text-sm ${
                booking.pricingType === "MEMBER"
                  ? "border-green-200 bg-green-50 text-green-800"
                  : "border-gray-200 bg-gray-50 text-gray-700"
              }`}
            >
              {getPricingLabel(booking.pricingType)}
            </span>
          </div>
        </div>

        <div className="mt-6 mb-10 flex flex-wrap items-center justify-between gap-4">
          <ButtonLink
            href="/admin/bookings"
            variant="ghost"
            size="custom"
            className="p-0 text-sm text-(--color-brand) hover:bg-transparent hover:brightness-130"
          >
            <span className="flex items-center">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Bookings
            </span>
          </ButtonLink>

          <div className="flex flex-wrap gap-3">
            {publicBookingUrl ? (
              <Link
                href={publicBookingUrl}
                target="_blank"
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Public booking link
              </Link>
            ) : null}

            {booking.parentUserId ? (
              <Link
                href={`/admin/parents/${booking.parentUserId}`}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                View parent account
              </Link>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <h2 className="mb-4 text-lg font-semibold">Parent details</h2>
            <SummaryRow label="Name" value={booking.parentName} />
            <SummaryRow label="Email" value={booking.parentEmail} />
            <SummaryRow label="Phone" value={booking.parentPhone ?? "—"} />
            <SummaryRow
              label="Booking source"
              value={getBookingSourceLabel(booking.parentUserId)}
            />

            {booking.parentUser ? (
              <>
                <SummaryRow
                  label="Account name"
                  value={booking.parentUser.name}
                />
                <SummaryRow
                  label="Account email"
                  value={booking.parentUser.email}
                />
                <SummaryRow
                  label="Membership"
                  value={getMembershipLabel(
                    booking.parentUser.membership?.status,
                  )}
                />
              </>
            ) : null}
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
              label="Pricing type"
              value={getPricingLabel(booking.pricingType)}
            />
            <SummaryRow
              label="Price per child"
              value={formatPrice(booking.unitPricePence)}
            />
            <SummaryRow label="Children" value={booking.childCount} />
            <SummaryRow
              label="Total amount"
              value={formatPrice(booking.totalAmountPence)}
            />
            <SummaryRow label="Booking status" value={booking.status} />
            <SummaryRow label="Payment status" value={booking.paymentStatus} />
            <SummaryRow label="Refund status" value={booking.refundStatus} />
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold">Stripe details</h2>
            <SummaryRow
              label="Checkout session"
              value={booking.stripeCheckoutSessionId ?? "—"}
            />
            <SummaryRow
              label="Payment intent"
              value={booking.stripePaymentIntentId ?? "—"}
            />
            <SummaryRow
              label="Refund ID"
              value={booking.stripeRefundId ?? "—"}
            />
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold">Emergency contact</h2>
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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {booking.children.map((child, index) => (
              <div
                key={child.id}
                className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold">Child {index + 1}</h3>

                  {child.parentChildId ? (
                    <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-800">
                      Saved profile
                    </span>
                  ) : (
                    <span className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700">
                      Booking snapshot
                    </span>
                  )}
                </div>

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

                {child.parentChild ? (
                  <div className="mt-3 rounded-md border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
                    Linked to saved child profile:{" "}
                    {[child.parentChild.firstName, child.parentChild.lastName]
                      .filter(Boolean)
                      .join(" ")}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </Card>

        <Card className="mt-4">
          <h2 className="mb-4 text-lg font-semibold">Cancellation / refund</h2>

          <SummaryRow
            label="Cancellation status"
            value={cancellation.message}
          />
          <SummaryRow
            label="Cancelled at"
            value={
              booking.cancelledAt ? formatDateTime(booking.cancelledAt) : "—"
            }
          />
          <SummaryRow
            label="Cancellation reason"
            value={booking.cancellationReason ?? "—"}
          />
          <SummaryRow
            label="Refunded at"
            value={
              booking.refundedAt ? formatDateTime(booking.refundedAt) : "—"
            }
          />

          <div className="mt-4">
            {canCancelAndRefund ? (
              <ConfirmActionDialog
                formAction="/api/bookings/cancel"
                formMethod="POST"
                hiddenFields={[
                  {
                    name: "bookingReference",
                    value: booking.bookingReference,
                  },
                  {
                    name: "token",
                    value: booking.bookingAccessToken,
                  },
                ]}
                title="Cancel and refund this booking?"
                description="This will cancel the booking and start a refund. This action cannot usually be undone."
                confirmLabel="Yes, cancel and refund"
                cancelLabel="Keep booking"
              >
                Cancel booking and refund
              </ConfirmActionDialog>
            ) : (
              <p className="text-sm text-(--color-text-secondary)">
                This booking cannot currently be cancelled/refunded online.
              </p>
            )}
          </div>
        </Card>
      </section>
    </main>
  );
}
