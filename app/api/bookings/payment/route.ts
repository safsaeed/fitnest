import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getParentSession } from "@/lib/parent-auth";
import {
  confirmBookingFromCheckoutSession,
  markPendingBookingClosed,
} from "@/lib/booking-payment.server";
import { PAYMENT_EXPIRED_REASON } from "@/lib/booking-payment";
import { getFormString } from "@/lib/form-data";

function getBookingUrl({
  request,
  bookingReference,
  token,
  isAccountBooking,
  outcome,
}: {
  request: Request;
  bookingReference: string;
  token: string;
  isAccountBooking: boolean;
  outcome?: string;
}) {
  const url = new URL(
    isAccountBooking
      ? `/account/bookings/${bookingReference}`
      : `/booking/${bookingReference}`,
    request.url,
  );

  if (!isAccountBooking) {
    url.searchParams.set("token", token);
  }

  if (outcome) {
    url.searchParams.set("payment", outcome);
  }

  return url;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const bookingReference = getFormString(formData, "bookingReference");
  const token = getFormString(formData, "token");
  const parentSession = await getParentSession();

  if (!bookingReference) {
    return NextResponse.redirect(new URL("/book", request.url), 303);
  }

  const booking = await prisma.booking.findUnique({
    where: {
      bookingReference,
    },
    select: {
      id: true,
      bookingReference: true,
      bookingAccessToken: true,
      parentUserId: true,
      status: true,
      paymentStatus: true,
      stripeCheckoutSessionId: true,
    },
  });

  const isAccountBooking = Boolean(
    booking?.parentUserId &&
      booking.parentUserId === parentSession?.parentUserId,
  );
  const hasToken = Boolean(booking && token === booking.bookingAccessToken);

  if (!booking || (!isAccountBooking && !hasToken)) {
    return NextResponse.redirect(new URL("/booking/search", request.url), 303);
  }

  const returnUrl = (outcome?: string) =>
    getBookingUrl({
      request,
      bookingReference: booking.bookingReference,
      token: booking.bookingAccessToken,
      isAccountBooking,
      outcome,
    });

  if (booking.status !== "PENDING" || booking.paymentStatus !== "PENDING") {
    return NextResponse.redirect(returnUrl(), 303);
  }

  if (!booking.stripeCheckoutSessionId) {
    await markPendingBookingClosed({
      bookingId: booking.id,
      reason: PAYMENT_EXPIRED_REASON,
    });
    return NextResponse.redirect(returnUrl("expired"), 303);
  }

  try {
    const checkoutSession = await stripe.checkout.sessions.retrieve(
      booking.stripeCheckoutSessionId,
    );

    if (
      checkoutSession.metadata?.bookingId !== booking.id ||
      checkoutSession.metadata?.bookingReference !== booking.bookingReference
    ) {
      throw new Error("Checkout Session does not match the booking");
    }

    if (
      checkoutSession.status === "complete" &&
      checkoutSession.payment_status === "paid"
    ) {
      await confirmBookingFromCheckoutSession(checkoutSession);
      return NextResponse.redirect(returnUrl("confirmed"), 303);
    }

    if (checkoutSession.status === "open" && checkoutSession.url) {
      return NextResponse.redirect(checkoutSession.url, 303);
    }

    await markPendingBookingClosed({
      bookingId: booking.id,
      reason: PAYMENT_EXPIRED_REASON,
    });
    return NextResponse.redirect(returnUrl("expired"), 303);
  } catch (error) {
    console.error(
      `Could not resume checkout for booking ${booking.bookingReference}`,
      error,
    );
    return NextResponse.redirect(returnUrl("error"), 303);
  }
}
