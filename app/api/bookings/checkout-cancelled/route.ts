import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { closePendingCheckout } from "@/lib/booking-payment.server";
import { PAYMENT_CANCELLED_REASON } from "@/lib/booking-payment";

function getCancelledUrl(
  request: Request,
  bookingReference?: string,
  token?: string,
  outcome = "cancelled",
) {
  const url = new URL("/payment/cancelled", request.url);

  if (bookingReference) {
    url.searchParams.set("booking", bookingReference);
  }

  if (token) {
    url.searchParams.set("token", token);
  }

  url.searchParams.set("outcome", outcome);
  return url;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const bookingReference = requestUrl.searchParams.get("booking")?.trim();
  const token = requestUrl.searchParams.get("token")?.trim();

  if (!bookingReference || !token) {
    return NextResponse.redirect(
      getCancelledUrl(request, undefined, undefined, "invalid"),
      303,
    );
  }

  const booking = await prisma.booking.findFirst({
    where: {
      bookingReference,
      bookingAccessToken: token,
    },
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      stripeCheckoutSessionId: true,
    },
  });

  if (!booking) {
    return NextResponse.redirect(
      getCancelledUrl(request, undefined, undefined, "invalid"),
      303,
    );
  }

  try {
    const result = await closePendingCheckout({
      bookingId: booking.id,
      reason: PAYMENT_CANCELLED_REASON,
    });

    const currentBooking = await prisma.booking.findUnique({
      where: {
        id: booking.id,
      },
      select: {
        status: true,
        paymentStatus: true,
      },
    });

    if (
      result === "payment-completed" ||
      (currentBooking?.status === "CONFIRMED" &&
        currentBooking.paymentStatus === "PAID")
    ) {
      const successUrl = new URL("/payment/success", request.url);
      successUrl.searchParams.set("booking", bookingReference);
      successUrl.searchParams.set("token", token);

      if (booking.stripeCheckoutSessionId) {
        successUrl.searchParams.set(
          "session_id",
          booking.stripeCheckoutSessionId,
        );
      }

      return NextResponse.redirect(successUrl, 303);
    }

    return NextResponse.redirect(
      getCancelledUrl(request, bookingReference, token),
      303,
    );
  } catch (error) {
    console.error(
      `Could not close checkout for booking ${bookingReference}`,
      error,
    );

    return NextResponse.redirect(
      getCancelledUrl(request, bookingReference, token, "error"),
      303,
    );
  }
}

