import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getParentSession } from "@/lib/parent-auth";

export async function POST(request: Request) {
  const parentSession = await getParentSession();

  if (!parentSession) {
    return NextResponse.redirect(new URL("/account/login", request.url), 303);
  }

  const appUrl = process.env.APP_URL;
  const membershipPriceId = process.env.STRIPE_MEMBERSHIP_PRICE_ID;

  if (!appUrl) {
    throw new Error("APP_URL is not set");
  }

  if (!membershipPriceId) {
    throw new Error("STRIPE_MEMBERSHIP_PRICE_ID is not set");
  }

  const parentUser = await prisma.parentUser.findFirst({
    where: {
      id: parentSession.parentUserId,
      isActive: true,
    },
    include: {
      membership: true,
    },
  });

  if (!parentUser) {
    return NextResponse.redirect(new URL("/account/login", request.url), 303);
  }

  if (parentUser.membership?.status === "ACTIVE") {
    return NextResponse.redirect(
      new URL("/account/membership?status=already-active", request.url),
      303,
    );
  }

  let stripeCustomerId = parentUser.stripeCustomerId;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      name: parentUser.name,
      email: parentUser.email,
      phone: parentUser.phone ?? undefined,
      metadata: {
        parentUserId: parentUser.id,
      },
    });

    stripeCustomerId = customer.id;

    await prisma.parentUser.update({
      where: {
        id: parentUser.id,
      },
      data: {
        stripeCustomerId,
      },
    });
  }

  await prisma.membership.upsert({
    where: {
      parentUserId: parentUser.id,
    },
    create: {
      parentUserId: parentUser.id,
      status: "INCOMPLETE",
      stripePriceId: membershipPriceId,
    },
    update: {
      status:
        parentUser.membership?.status === "CANCELLED" ||
        parentUser.membership?.status === "PAST_DUE" ||
        parentUser.membership?.status === "UNPAID"
          ? "INCOMPLETE"
          : parentUser.membership?.status,
      stripePriceId: membershipPriceId,
    },
  });

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId,
    payment_method_types: ["card"],

    line_items: [
      {
        price: membershipPriceId,
        quantity: 1,
      },
    ],

    metadata: {
      checkoutType: "membership",
      parentUserId: parentUser.id,
    },

    subscription_data: {
      metadata: {
        parentUserId: parentUser.id,
        checkoutType: "membership",
      },
    },

    success_url: `${appUrl}/account/membership?status=checkout-success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/account/membership?status=checkout-cancelled`,
  });

  if (!checkoutSession.url) {
    return NextResponse.redirect(
      new URL("/account/membership?status=checkout-error", request.url),
      303,
    );
  }

  return NextResponse.redirect(checkoutSession.url, 303);
}
