import "server-only";

import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { validateBookingCapacity } from "@/lib/booking-capacity";
import { sendBookingConfirmationEmail } from "@/lib/booking-emails";

export type PendingCheckoutCloseResult =
  | "closed"
  | "already-closed"
  | "payment-completed";

export async function markPendingBookingClosed({
  bookingId,
  reason,
}: {
  bookingId: string;
  reason: string;
}) {
  const cancelledAt = new Date();

  const result = await prisma.booking.updateMany({
    where: {
      id: bookingId,
      status: "PENDING",
      paymentStatus: {
        in: ["PENDING", "FAILED"],
      },
    },
    data: {
      status: "CANCELLED",
      paymentStatus: "FAILED",
      cancelledAt,
      cancellationReason: reason,
    },
  });

  return result.count > 0;
}

export async function closePendingCheckout({
  bookingId,
  reason,
}: {
  bookingId: string;
  reason: string;
}): Promise<PendingCheckoutCloseResult> {
  const booking = await prisma.booking.findUnique({
    where: {
      id: bookingId,
    },
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      stripeCheckoutSessionId: true,
    },
  });

  if (
    !booking ||
    booking.status !== "PENDING" ||
    !["PENDING", "FAILED"].includes(booking.paymentStatus)
  ) {
    return "already-closed";
  }

  if (booking.stripeCheckoutSessionId) {
    const checkoutSession = await stripe.checkout.sessions.retrieve(
      booking.stripeCheckoutSessionId,
    );

    if (
      checkoutSession.status === "complete" &&
      checkoutSession.payment_status === "paid"
    ) {
      await confirmBookingFromCheckoutSession(checkoutSession);
      return "payment-completed";
    }

    if (checkoutSession.status === "open") {
      await stripe.checkout.sessions.expire(checkoutSession.id);
    }
  }

  const closed = await markPendingBookingClosed({ bookingId, reason });
  return closed ? "closed" : "already-closed";
}

export async function confirmBookingFromCheckoutSession(
  checkoutSession: Stripe.Checkout.Session,
) {
  const bookingId = checkoutSession.metadata?.bookingId;

  if (!bookingId) {
    throw new Error("Missing bookingId in Checkout Session metadata");
  }

  const bookingSession = await prisma.booking.findUnique({
    where: {
      id: bookingId,
    },
    select: {
      sessionId: true,
    },
  });

  if (!bookingSession) {
    throw new Error(`Booking not found: ${bookingId}`);
  }

  const confirmation = await prisma.$transaction(async (transaction) => {
    await transaction.$executeRaw`
      SELECT pg_advisory_xact_lock(hashtext(${bookingSession.sessionId}))
    `;

    const booking = await transaction.booking.findUnique({
      where: {
        id: bookingId,
      },
      include: {
        children: true,
        session: {
          include: {
            venue: true,
            bookings: {
              where: {
                status: "CONFIRMED",
              },
              select: {
                childCount: true,
                children: {
                  select: {
                    dateOfBirth: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!booking) {
      throw new Error(`Booking not found: ${bookingId}`);
    }

    if (booking.status === "CONFIRMED" && booking.paymentStatus === "PAID") {
      return { status: "already-confirmed" as const, booking };
    }

    if (booking.status !== "PENDING") {
      return { status: "not-pending" as const, booking };
    }

    const capacityCheck = validateBookingCapacity({
      session: booking.session,
      requestedChildren: booking.children,
    });

    if (!capacityCheck.ok) {
      await transaction.booking.update({
        where: {
          id: booking.id,
        },
        data: {
          paymentStatus: "PAID",
          stripePaymentIntentId:
            typeof checkoutSession.payment_intent === "string"
              ? checkoutSession.payment_intent
              : (checkoutSession.payment_intent?.id ?? null),
        },
      });

      return {
        status: "unavailable" as const,
        booking,
        reason: capacityCheck.reason,
      };
    }

    await transaction.booking.update({
      where: {
        id: booking.id,
      },
      data: {
        status: "CONFIRMED",
        paymentStatus: "PAID",
        stripePaymentIntentId:
          typeof checkoutSession.payment_intent === "string"
            ? checkoutSession.payment_intent
            : (checkoutSession.payment_intent?.id ?? null),
      },
    });

    return { status: "confirmed" as const, booking };
  });

  const booking = confirmation.booking;

  if (confirmation.status === "already-confirmed") {
    console.log(`Booking already confirmed: ${booking.bookingReference}`);
    return confirmation.status;
  }

  if (confirmation.status === "not-pending") {
    console.log(
      `Booking ${booking.bookingReference} is not pending. Current status: ${booking.status}`,
    );
    return confirmation.status;
  }

  if (confirmation.status === "unavailable") {
    console.error(
      `Cannot confirm booking ${booking.bookingReference}: ${confirmation.reason}`,
    );
    return confirmation.status;
  }

  const venueAddress = [
    booking.session.venue.addressLine1,
    booking.session.venue.addressLine2,
    booking.session.venue.city,
    booking.session.venue.county,
    booking.session.venue.postcode,
  ]
    .filter(Boolean)
    .join(", ");

  try {
    const appUrl = process.env.APP_URL;

    const publicBookingUrl = appUrl
      ? `${appUrl}/booking/${booking.bookingReference}?token=${booking.bookingAccessToken}`
      : undefined;

    const accountBookingUrl =
      appUrl && booking.parentUserId
        ? `${appUrl}/account/bookings/${booking.bookingReference}`
        : null;

    await sendBookingConfirmationEmail({
      to: booking.parentEmail,
      parentName: booking.parentName,
      bookingReference: booking.bookingReference,
      venueName: booking.session.venue.name,
      venueAddress,
      sessionTitle: booking.session.title,
      startsAt: booking.session.startsAt,
      endsAt: booking.session.endsAt,
      children: booking.children,
      emergencyContactName: booking.emergencyContactName,
      emergencyContactPhone: booking.emergencyContactPhone,
      totalAmountPence: booking.totalAmountPence,
      unitPricePence: booking.unitPricePence,
      bookingUrl: publicBookingUrl,
      accountBookingUrl,
    });

    console.log(`Confirmation email sent: ${booking.bookingReference}`);
  } catch (error) {
    console.error(
      `Booking confirmed but email failed: ${booking.bookingReference}`,
      error,
    );
  }

  console.log(`Booking confirmed: ${booking.bookingReference}`);
  return confirmation.status;
}
