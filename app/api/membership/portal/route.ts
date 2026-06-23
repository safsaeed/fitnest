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

  if (!appUrl) {
    throw new Error("APP_URL is not set");
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

  if (!parentUser.stripeCustomerId) {
    return NextResponse.redirect(
      new URL("/account/membership?status=no-stripe-customer", request.url),
      303,
    );
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: parentUser.stripeCustomerId,
    return_url: `${appUrl}/account/membership?status=portal-return`,
  });

  return NextResponse.redirect(portalSession.url, 303);
}
