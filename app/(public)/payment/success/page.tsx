import { Card } from "@/components/ui/card";
import { LoadingButtonLink } from "@/components/ui/loading-button-link";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { confirmBookingFromCheckoutSession } from "@/lib/booking-payment.server";
import {
  getBookingPaymentBadgeClass,
  getBookingPaymentDisplay,
} from "@/lib/booking-payment";

type PaymentSuccessPageProps = {
  searchParams?: Promise<{
    booking?: string;
    token?: string;
    session_id?: string;
  }>;
};

export default async function PaymentSuccessPage({
  searchParams,
}: PaymentSuccessPageProps) {
  const params = await searchParams;
  const bookingReference = params?.booking;
  const token = params?.token;
  const checkoutSessionId = params?.session_id;

  const initialBooking = bookingReference
    ? await prisma.booking.findUnique({
        where: {
          bookingReference,
        },
        select: {
          id: true,
          bookingAccessToken: true,
          stripeCheckoutSessionId: true,
        },
      })
    : null;

  const canAccessBooking = Boolean(
    initialBooking &&
      ((token && token === initialBooking.bookingAccessToken) ||
        (checkoutSessionId &&
          checkoutSessionId === initialBooking.stripeCheckoutSessionId)),
  );

  if (
    canAccessBooking &&
    initialBooking?.stripeCheckoutSessionId &&
    checkoutSessionId === initialBooking.stripeCheckoutSessionId
  ) {
    try {
      const checkoutSession =
        await stripe.checkout.sessions.retrieve(checkoutSessionId);

      if (
        checkoutSession.metadata?.bookingId === initialBooking.id &&
        checkoutSession.status === "complete" &&
        checkoutSession.payment_status === "paid"
      ) {
        await confirmBookingFromCheckoutSession(checkoutSession);
      }
    } catch (error) {
      console.error(
        `Could not reconcile successful checkout ${checkoutSessionId}`,
        error,
      );
    }
  }

  const booking =
    bookingReference && canAccessBooking
      ? await prisma.booking.findUnique({
          where: {
            bookingReference,
          },
        })
      : null;

  const display = booking ? getBookingPaymentDisplay(booking) : null;
  const isConfirmed =
    booking?.status === "CONFIRMED" && booking.paymentStatus === "PAID";

  return (
    <main className="min-h-(--min-page-height) flex items-center justify-center p-4">
      <Card className="max-w-md">
        <p
          className={`w-fit rounded-lg border px-3 py-1 text-sm font-medium uppercase tracking-wide ${
            display
              ? getBookingPaymentBadgeClass(display.tone)
              : "border-(--color-warning-border) bg-(--color-warning-soft) text-(--color-warning)"
          }`}
        >
          {display?.label ?? "Checking payment"}
        </p>

        <h1 className="mt-4 text-3xl font-semibold">
          {isConfirmed
            ? "Thanks, your booking is confirmed"
            : "Thanks, we are checking your payment"}
        </h1>

        <p className="mt-4 text-(--color-text-secondary)">
          {isConfirmed
            ? "Payment is complete and your place is booked. We have sent a confirmation email with the details."
            : "Payment confirmation normally takes only a few seconds. If this page does not show a confirmed booking shortly, please use your booking link or contact the team."}
        </p>

        {bookingReference && (
          <div className="mt-4 rounded-lg border border-gray-200 bg-[#fdfdfd] p-4">
            <p>Your booking reference is:</p>
            <p className="mt-2 text-lg font-semibold">{bookingReference}</p>

            {display ? (
              <p className="mt-2 text-sm text-(--color-text-secondary)">
                {display.message}
              </p>
            ) : null}
          </div>
        )}

        <div className="mt-6 flex justify-center gap-4 flex-col sm:flex-row">
          {booking && token ? (
            <LoadingButtonLink
              href={`/booking/${booking.bookingReference}?token=${token}`}
              className="w-full sm:w-1/2"
            >
              View booking
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
            Book another session
          </LoadingButtonLink>
        </div>
      </Card>
    </main>
  );
}
