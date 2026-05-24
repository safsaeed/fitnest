import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { validateBookingAvailability } from "@/lib/availability";
import { sendBookingConfirmationEmail } from "@/lib/booking-emails";

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature" },
      { status: 400 },
    );
  }

  const rawBody = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);

    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;

        await handleCheckoutSessionCompleted(checkoutSession);

        break;
      }

      case "checkout.session.expired": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;

        await handleCheckoutSessionExpired(checkoutSession);

        break;
      }

      default: {
        console.log(`Unhandled Stripe event type: ${event.type}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook handler failed:", error);

    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}

async function handleCheckoutSessionCompleted(
  checkoutSession: Stripe.Checkout.Session,
) {
  const bookingId = checkoutSession.metadata?.bookingId;

  if (!bookingId) {
    throw new Error("Missing bookingId in Checkout Session metadata");
  }

  const booking = await prisma.booking.findUnique({
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
    console.log(`Booking already confirmed: ${booking.bookingReference}`);
    return;
  }

  if (booking.status !== "PENDING") {
    console.log(
      `Booking ${booking.bookingReference} is not pending. Current status: ${booking.status}`,
    );
    return;
  }

  const availabilityCheck = validateBookingAvailability({
    session: booking.session,
    requestedChildCount: booking.childCount,
  });

  if (!availabilityCheck.ok) {
    console.error(
      `Cannot confirm booking ${booking.bookingReference}: ${availabilityCheck.reason}`,
    );

    await prisma.booking.update({
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

    return;
  }

  await prisma.booking.update({
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
      totalAmountPence: booking.totalAmountPence,
    });

    console.log(`Confirmation email sent: ${booking.bookingReference}`);
  } catch (error) {
    console.error(
      `Booking confirmed but email failed: ${booking.bookingReference}`,
      error,
    );
  }

  console.log(`Booking confirmed: ${booking.bookingReference}`);
}

async function handleCheckoutSessionExpired(
  checkoutSession: Stripe.Checkout.Session,
) {
  const bookingId = checkoutSession.metadata?.bookingId;

  if (!bookingId) {
    return;
  }

  const booking = await prisma.booking.findUnique({
    where: {
      id: bookingId,
    },
  });

  if (!booking || booking.status !== "PENDING") {
    return;
  }

  await prisma.booking.update({
    where: {
      id: booking.id,
    },
    data: {
      paymentStatus: "FAILED",
    },
  });

  console.log(`Checkout expired for booking: ${booking.bookingReference}`);
}
