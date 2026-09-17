import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getCancellationStatus } from "@/lib/cancellation";
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
  status: "cancelled" | "refunded" | "error";
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

  const cancelledAt = new Date();
  const cancellation = getCancellationStatus(
    booking.session.startsAt,
    cancelledAt,
  );

  if (!cancellation.canCancel) {
    return redirectToBooking({
      request,
      bookingReference,
      token,
      status: "error",
    });
  }

  const paymentIntentId = booking.stripePaymentIntentId;

  try {
    if (cancellation.isRefundable) {
      if (!paymentIntentId) {
        return redirectToBooking({
          request,
          bookingReference,
          token,
          status: "error",
        });
      }

      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
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
          cancelledAt,
          refundedAt: cancelledAt,
          cancellationReason:
            "Cancelled at least 24 hours before the session; full refund issued.",
        },
      });
    } else {
      await prisma.booking.update({
        where: {
          id: booking.id,
        },
        data: {
          status: "CANCELLED",
          paymentStatus: "PAID",
          refundStatus: "NONE",
          cancelledAt,
          cancellationReason:
            "Cancelled within 24 hours of the session; non-refundable.",
        },
      });
    }

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
        refunded: cancellation.isRefundable,
      });

      console.log(`Cancellation email sent: ${booking.bookingReference}`);
    } catch (error) {
      console.error(
        `Booking cancelled but cancellation email failed: ${booking.bookingReference}`,
        error,
      );
    }

    return redirectToBooking({
      request,
      bookingReference,
      token,
      status: cancellation.isRefundable ? "refunded" : "cancelled",
    });
  } catch (error) {
    console.error("Failed to cancel booking:", error);

    return redirectToBooking({
      request,
      bookingReference,
      token,
      status: "error",
    });
  }
}
