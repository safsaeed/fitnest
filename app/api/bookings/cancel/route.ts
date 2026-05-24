import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { canCancelBooking } from "@/lib/cancellation";
import { sendBookingCancellationEmail } from "@/lib/booking-emails";
import { getFormString } from "@/lib/form-data";

function redirectToBooking({
  request,
  bookingReference,
  token,
  status,
}: {
  request: Request;
  bookingReference: string;
  token: string;
  status: "cancelled" | "error";
}) {
  const url = new URL(`/booking/${bookingReference}`, request.url);
  url.searchParams.set("token", token);
  url.searchParams.set("cancel", status);

  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const bookingReference = getFormString(formData, "bookingReference");
  const token = getFormString(formData, "token");

  if (!bookingReference || !token) {
    return NextResponse.redirect(new URL("/book", request.url), 303);
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
    return NextResponse.redirect(new URL("/book", request.url), 303);
  }

  if (booking.status !== "CONFIRMED" || booking.paymentStatus !== "PAID") {
    return redirectToBooking({
      request,
      bookingReference,
      token,
      status: "error",
    });
  }

  if (!canCancelBooking(booking.session.startsAt)) {
    return redirectToBooking({
      request,
      bookingReference,
      token,
      status: "error",
    });
  }

  if (!booking.stripePaymentIntentId) {
    return redirectToBooking({
      request,
      bookingReference,
      token,
      status: "error",
    });
  }

  try {
    const refund = await stripe.refunds.create({
      payment_intent: booking.stripePaymentIntentId,
      metadata: {
        bookingId: booking.id,
        bookingReference: booking.bookingReference,
      },
    });

    await prisma.booking.update({
      where: {
        id: booking.id,
      },
      data: {
        status: "REFUNDED",
        paymentStatus: "REFUNDED",
        refundStatus: "REFUNDED",
        stripeRefundId: refund.id,
        cancelledAt: new Date(),
        refundedAt: new Date(),
        cancellationReason:
          "Parent cancelled more than 24 hours before session.",
      },
    });

    try {
      await sendBookingCancellationEmail({
        to: booking.parentEmail,
        parentName: booking.parentName,
        bookingReference: booking.bookingReference,
        venueName: booking.session.venue.name,
        sessionTitle: booking.session.title,
        startsAt: booking.session.startsAt,
        children: booking.children,
        totalAmountPence: booking.totalAmountPence,
      });

      console.log(`Cancellation email sent: ${booking.bookingReference}`);
    } catch (error) {
      console.error(
        `Booking refunded but cancellation email failed: ${booking.bookingReference}`,
        error,
      );
    }

    return redirectToBooking({
      request,
      bookingReference,
      token,
      status: "cancelled",
    });
  } catch (error) {
    console.error("Failed to cancel/refund booking:", error);

    return redirectToBooking({
      request,
      bookingReference,
      token,
      status: "error",
    });
  }
}
