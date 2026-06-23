import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { validateBookingAvailability } from "@/lib/availability";
import { sendBookingConfirmationEmail } from "@/lib/booking-emails";
import {
  sendMembershipActiveEmail,
  sendMembershipCancelledEmail,
  sendMembershipPaymentFailedEmail,
} from "@/lib/membership-emails";
import type { MembershipStatus } from "@prisma/client";

type StripeSubscriptionWithPeriods = Stripe.Subscription & {
  current_period_start?: number | null;
  current_period_end?: number | null;
};

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

        if (checkoutSession.mode === "subscription") {
          await handleMembershipCheckoutSessionCompleted(checkoutSession);
        } else {
          await handleBookingCheckoutSessionCompleted(checkoutSession);
        }

        break;
      }

      case "checkout.session.expired": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;

        if (checkoutSession.mode === "subscription") {
          await handleMembershipCheckoutSessionExpired(checkoutSession);
        } else {
          await handleCheckoutSessionExpired(checkoutSession);
        }

        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;

        await handleCustomerSubscriptionUpdated(subscription);

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        await handleCustomerSubscriptionDeleted(subscription);

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;

        await handleInvoicePaymentFailed(invoice);

        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;

        await handleInvoicePaymentSucceeded(invoice);

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

function mapStripeSubscriptionStatus(status: Stripe.Subscription.Status) {
  if (status === "active" || status === "trialing") {
    return "ACTIVE" satisfies MembershipStatus;
  }

  if (status === "past_due") {
    return "PAST_DUE" satisfies MembershipStatus;
  }

  if (status === "unpaid") {
    return "UNPAID" satisfies MembershipStatus;
  }

  if (status === "canceled") {
    return "CANCELLED" satisfies MembershipStatus;
  }

  return "INCOMPLETE" satisfies MembershipStatus;
}

function getStripeTimestampDate(timestamp?: number | null) {
  if (!timestamp) {
    return null;
  }

  return new Date(timestamp * 1000);
}

function getSubscriptionPriceId(subscription: Stripe.Subscription) {
  return subscription.items.data[0]?.price.id ?? null;
}

function getSubscriptionParentUserId(subscription: Stripe.Subscription) {
  const metadataParentUserId = subscription.metadata?.parentUserId;

  if (metadataParentUserId) {
    return metadataParentUserId;
  }

  return null;
}

function getSubscriptionIdFromInvoice(invoice: Stripe.Invoice) {
  const invoiceWithSubscription = invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
  };

  const subscription = invoiceWithSubscription.subscription;

  if (typeof subscription === "string") {
    return subscription;
  }

  return subscription?.id ?? null;
}

async function syncMembershipFromSubscription(
  subscription: Stripe.Subscription,
) {
  const subscriptionWithPeriods = subscription as StripeSubscriptionWithPeriods;

  const stripeSubscriptionId = subscription.id;
  const stripeCustomerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const parentUserId = getSubscriptionParentUserId(subscription);
  const status = mapStripeSubscriptionStatus(subscription.status);
  const stripePriceId = getSubscriptionPriceId(subscription);

  const currentPeriodStart = getStripeTimestampDate(
    subscriptionWithPeriods.current_period_start,
  );

  const currentPeriodEnd = getStripeTimestampDate(
    subscriptionWithPeriods.current_period_end,
  );

  const cancelledAt = getStripeTimestampDate(subscription.canceled_at);

  const parentUser = parentUserId
    ? await prisma.parentUser.findUnique({
        where: {
          id: parentUserId,
        },
        select: {
          id: true,
          stripeCustomerId: true,
        },
      })
    : await prisma.parentUser.findFirst({
        where: {
          stripeCustomerId,
        },
        select: {
          id: true,
          stripeCustomerId: true,
        },
      });

  if (!parentUser) {
    console.error(
      `Could not find parent user for subscription ${stripeSubscriptionId}`,
    );
    return;
  }

  if (!parentUser.stripeCustomerId) {
    await prisma.parentUser.update({
      where: {
        id: parentUser.id,
      },
      data: {
        stripeCustomerId,
      },
    });
  }

  const existingMembership = await prisma.membership.findUnique({
    where: {
      parentUserId: parentUser.id,
    },
    select: {
      status: true,
    },
  });

  await prisma.membership.upsert({
    where: {
      parentUserId: parentUser.id,
    },
    create: {
      parentUserId: parentUser.id,
      status,
      stripeSubscriptionId,
      stripePriceId,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      cancelledAt,
    },
    update: {
      status,
      stripeSubscriptionId,
      stripePriceId,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      cancelledAt,
    },
  });

  const appUrl = process.env.APP_URL;
  const membershipUrl = appUrl ? `${appUrl}/account/membership` : null;

  if (membershipUrl) {
    const parentForEmail = await prisma.parentUser.findUnique({
      where: {
        id: parentUser.id,
      },
      select: {
        name: true,
        email: true,
      },
    });

    if (parentForEmail) {
      try {
        if (existingMembership?.status !== "ACTIVE" && status === "ACTIVE") {
          await sendMembershipActiveEmail({
            to: parentForEmail.email,
            parentName: parentForEmail.name,
            membershipUrl,
            currentPeriodEnd,
          });
        }

        if (
          existingMembership?.status !== "PAST_DUE" &&
          status === "PAST_DUE"
        ) {
          await sendMembershipPaymentFailedEmail({
            to: parentForEmail.email,
            parentName: parentForEmail.name,
            membershipUrl,
          });
        }

        if (
          existingMembership?.status !== "CANCELLED" &&
          status === "CANCELLED"
        ) {
          await sendMembershipCancelledEmail({
            to: parentForEmail.email,
            parentName: parentForEmail.name,
            membershipUrl,
            currentPeriodEnd,
          });
        }
      } catch (error) {
        console.error(
          `Membership synced but email failed for parent ${parentUser.id}`,
          error,
        );
      }
    }
  }

  console.log(
    `Membership synced for parent ${parentUser.id}: ${status} (${stripeSubscriptionId})`,
  );
}

async function handleMembershipCheckoutSessionCompleted(
  checkoutSession: Stripe.Checkout.Session,
) {
  const parentUserId = checkoutSession.metadata?.parentUserId;

  if (!parentUserId) {
    throw new Error("Missing parentUserId in membership Checkout metadata");
  }

  const subscriptionId =
    typeof checkoutSession.subscription === "string"
      ? checkoutSession.subscription
      : checkoutSession.subscription?.id;

  const stripeCustomerId =
    typeof checkoutSession.customer === "string"
      ? checkoutSession.customer
      : checkoutSession.customer?.id;

  if (stripeCustomerId) {
    await prisma.parentUser.update({
      where: {
        id: parentUserId,
      },
      data: {
        stripeCustomerId,
      },
    });
  }

  if (!subscriptionId) {
    await prisma.membership.upsert({
      where: {
        parentUserId,
      },
      create: {
        parentUserId,
        status: "INCOMPLETE",
      },
      update: {
        status: "INCOMPLETE",
      },
    });

    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  await syncMembershipFromSubscription(subscription);
}

async function handleMembershipCheckoutSessionExpired(
  checkoutSession: Stripe.Checkout.Session,
) {
  const parentUserId = checkoutSession.metadata?.parentUserId;

  if (!parentUserId) {
    return;
  }

  const existingMembership = await prisma.membership.findUnique({
    where: {
      parentUserId,
    },
  });

  if (!existingMembership || existingMembership.status !== "INCOMPLETE") {
    return;
  }

  await prisma.membership.update({
    where: {
      parentUserId,
    },
    data: {
      status: "INCOMPLETE",
    },
  });

  console.log(`Membership checkout expired for parent: ${parentUserId}`);
}

async function handleCustomerSubscriptionUpdated(
  subscription: Stripe.Subscription,
) {
  await syncMembershipFromSubscription(subscription);
}

async function handleCustomerSubscriptionDeleted(
  subscription: Stripe.Subscription,
) {
  const subscriptionWithPeriods = subscription as StripeSubscriptionWithPeriods;

  const stripeSubscriptionId = subscription.id;

  const existingMembership = await prisma.membership.findFirst({
    where: {
      stripeSubscriptionId,
    },
  });

  if (!existingMembership) {
    await syncMembershipFromSubscription(subscription);
    return;
  }

  await prisma.membership.update({
    where: {
      id: existingMembership.id,
    },
    data: {
      status: "CANCELLED",
      currentPeriodStart: getStripeTimestampDate(
        subscriptionWithPeriods.current_period_start,
      ),
      currentPeriodEnd: getStripeTimestampDate(
        subscriptionWithPeriods.current_period_end,
      ),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      cancelledAt:
        getStripeTimestampDate(subscription.canceled_at) ?? new Date(),
    },
  });

  console.log(`Membership cancelled: ${stripeSubscriptionId}`);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = getSubscriptionIdFromInvoice(invoice);

  if (!subscriptionId) {
    return;
  }

  const membership = await prisma.membership.findFirst({
    where: {
      stripeSubscriptionId: subscriptionId,
    },
  });

  if (!membership) {
    return;
  }

  await prisma.membership.update({
    where: {
      id: membership.id,
    },
    data: {
      status: "PAST_DUE",
    },
  });

  const appUrl = process.env.APP_URL;
  const membershipUrl = appUrl ? `${appUrl}/account/membership` : null;

  if (membershipUrl && membership.status !== "PAST_DUE") {
    const parentUser = await prisma.parentUser.findUnique({
      where: {
        id: membership.parentUserId,
      },
      select: {
        name: true,
        email: true,
      },
    });

    if (parentUser) {
      try {
        await sendMembershipPaymentFailedEmail({
          to: parentUser.email,
          parentName: parentUser.name,
          membershipUrl,
        });
      } catch (error) {
        console.error(
          `Membership payment failed but email failed: ${membership.id}`,
          error,
        );
      }
    }
  }

  console.log(`Membership payment failed: ${subscriptionId}`);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = getSubscriptionIdFromInvoice(invoice);

  if (!subscriptionId) {
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  await syncMembershipFromSubscription(subscription);
}

async function handleBookingCheckoutSessionCompleted(
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
      totalAmountPence: booking.totalAmountPence,
      unitPricePence: booking.unitPricePence,
      pricingType: booking.pricingType,
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
