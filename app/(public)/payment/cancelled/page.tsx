import { Card } from "@/components/ui/card";
import { LoadingButtonLink } from "@/components/ui/loading-button-link";
import { prisma } from "@/lib/prisma";
import {
  getBookingPaymentBadgeClass,
  getBookingPaymentDisplay,
} from "@/lib/booking-payment";

type PaymentCancelledPageProps = {
  searchParams?: Promise<{
    booking?: string;
    token?: string;
    outcome?: string;
  }>;
};

export default async function PaymentCancelledPage({
  searchParams,
}: PaymentCancelledPageProps) {
  const params = await searchParams;
  const bookingReference = params?.booking;
  const token = params?.token;

  const booking = bookingReference && token
    ? await prisma.booking.findFirst({
        where: {
          bookingReference,
          bookingAccessToken: token,
        },
        include: {
          session: {
            include: {
              venue: true,
            },
          },
        },
      })
    : null;

  const display = booking ? getBookingPaymentDisplay(booking) : null;
  const couldNotClose = params?.outcome === "error";

  return (
    <main className="min-h-(--min-page-height) flex items-center justify-center p-4">
      <Card className="max-w-md">
        <p
          className={`w-fit rounded-lg border px-3 py-1 text-sm font-medium uppercase tracking-wide ${
            display
              ? getBookingPaymentBadgeClass(display.tone)
              : "border-(--color-danger-border) bg-(--color-danger-soft) text-(--color-danger)"
          }`}
        >
          {display?.label ?? "Payment not completed"}
        </p>

        <h1 className="mt-4 text-3xl font-semibold text-gray-900">
          {couldNotClose
            ? "Your payment is still awaiting completion"
            : "Your booking has not been confirmed"}
        </h1>

        <p className="mt-4 text-(--color-text-secondary)">
          {couldNotClose
            ? "We could not close the payment session immediately. It will expire automatically, and no booking is confirmed unless payment succeeds."
            : "Payment was cancelled or not completed. The incomplete booking has been closed and you have not been charged."}
        </p>

        {booking && (
          <div className="mt-4 rounded-lg border border-gray-200 bg-[#fdfdfd] p-4">
            <p>
              <span className="text-(--color-text-secondary)">
                Booking reference:
              </span>{" "}
              {booking.bookingReference}
            </p>
            <p className="mt-2">
              <span className="text-(--color-text-secondary)">Session:</span>{" "}
              {booking.session.title}
            </p>
            <p className="mt-2">
              <span className="text-(--color-text-secondary)">Venue:</span>{" "}
              {booking.session.venue.name}
            </p>
            <p className="mt-2">
              <span className="text-(--color-text-secondary)">Status:</span>{" "}
              {display?.label}
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-center gap-4 flex-col sm:flex-row">
          {booking && couldNotClose && token ? (
            <LoadingButtonLink
              className="w-full sm:w-1/2"
              href={`/booking/${booking.bookingReference}?token=${token}`}
            >
              Continue payment
            </LoadingButtonLink>
          ) : booking ? (
            <LoadingButtonLink
              className="w-full sm:w-1/2"
              href={`/book/${booking.session.venueId}/${booking.sessionId}`}
            >
              Start a new booking
            </LoadingButtonLink>
          ) : (
            <LoadingButtonLink href="/" className="w-full sm:w-1/2">
              Back to home
            </LoadingButtonLink>
          )}

          <LoadingButtonLink
            href="/book"
            variant="secondary"
            className="w-full sm:w-1/2"
          >
            Pick another session
          </LoadingButtonLink>
        </div>
      </Card>
    </main>
  );
}
