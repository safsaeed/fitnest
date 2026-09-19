import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import {
  confirmBookingFromCheckoutSession,
  markPendingBookingClosed,
} from "@/lib/booking-payment.server";
import { PAYMENT_EXPIRED_REASON } from "@/lib/booking-payment";

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

        if (checkoutSession.mode === "payment") {
          await confirmBookingFromCheckoutSession(checkoutSession);
        }

        break;
      }

      case "checkout.session.expired": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;

        if (checkoutSession.mode === "payment") {
          await handleCheckoutSessionExpired(checkoutSession);
        }

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

async function handleCheckoutSessionExpired(
  checkoutSession: Stripe.Checkout.Session,
) {
  const bookingId = checkoutSession.metadata?.bookingId;

  if (!bookingId) {
    return;
  }

  const closed = await markPendingBookingClosed({
    bookingId,
    reason: PAYMENT_EXPIRED_REASON,
  });

  if (closed) {
    console.log(`Expired checkout closed for booking: ${bookingId}`);
  }
}
