import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { parseBookingFormData } from "@/lib/booking-validation";
import { generateBookingReference } from "@/lib/booking-reference";
import { validateBookingAvailability } from "@/lib/availability";
import { generateBookingAccessToken } from "@/lib/booking-access-token";
import { formatDateTime } from "@/lib/formatters";
import { getFormString } from "@/lib/form-data";

function redirectWithError({
  request,
  venueId,
  sessionId,
  error,
}: {
  request: Request;
  venueId?: string;
  sessionId?: string;
  error: string;
}) {
  const fallbackUrl = new URL("/book", request.url);

  if (!venueId || !sessionId) {
    fallbackUrl.searchParams.set("error", error);
    return NextResponse.redirect(fallbackUrl, 303);
  }

  const url = new URL(`/book/${venueId}/${sessionId}`, request.url);
  url.searchParams.set("error", error);

  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  const formData = await request.formData();

  let input;

  try {
    input = parseBookingFormData(formData);
  } catch (error) {
    const venueId = getFormString(formData, "venueId");
    const sessionId = getFormString(formData, "sessionId");

    const message =
      error instanceof ZodError
        ? (error.issues[0]?.message ?? "Please check the booking form.")
        : "Please check the booking form.";

    return redirectWithError({
      request,
      venueId: venueId || undefined,
      sessionId: sessionId || undefined,
      error: message,
    });
  }

  const session = await prisma.session.findFirst({
    where: {
      id: input.sessionId,
      venueId: input.venueId,
      isActive: true,
      venue: {
        isActive: true,
      },
    },
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
  });

  if (!session) {
    return redirectWithError({
      request,
      venueId: input.venueId,
      sessionId: input.sessionId,
      error: "This session could not be found.",
    });
  }

  const availabilityCheck = validateBookingAvailability({
    session,
    requestedChildCount: input.children.length,
  });

  if (!availabilityCheck.ok) {
    return redirectWithError({
      request,
      venueId: input.venueId,
      sessionId: input.sessionId,
      error: availabilityCheck.reason,
    });
  }

  const appUrl = process.env.APP_URL;

  if (!appUrl) {
    throw new Error("APP_URL is not set");
  }

  const totalAmountPence = input.children.length * session.pricePence;

  const booking = await prisma.booking.create({
    data: {
      bookingReference: generateBookingReference(),
      sessionId: session.id,
      bookingAccessToken: generateBookingAccessToken(),

      parentName: input.parentName,
      parentEmail: input.parentEmail.toLowerCase(),
      parentPhone: input.parentPhone,

      emergencyContactName: input.parentName,
      emergencyContactPhone: input.parentPhone,

      status: "PENDING",
      paymentStatus: "PENDING",
      refundStatus: "NONE",

      totalAmountPence,
      childCount: input.children.length,

      consentAccepted: true,
      consentAcceptedAt: new Date(),
      consentTextVersion: "v1",

      marketingOptIn: input.marketingOptIn === "on",

      children: {
        create: input.children.map((child) => ({
          firstName: child.firstName,
          lastName: child.lastName,
          dateOfBirth: new Date(`${child.dateOfBirth}T00:00:00.000Z`),
          allergies: child.allergies,
          medicalNotes: child.medicalNotes,
        })),
      },
    },
    include: {
      children: true,
    },
  });

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: booking.parentEmail,

    line_items: [
      {
        quantity: booking.childCount,
        price_data: {
          currency: "gbp",
          unit_amount: session.pricePence,
          product_data: {
            name: session.title,
            description: `${session.venue.name} - ${formatDateTime(
              session.startsAt,
            )}`,
          },
        },
      },
    ],

    metadata: {
      bookingId: booking.id,
      bookingReference: booking.bookingReference,
      sessionId: session.id,
      venueId: session.venueId,
      childCount: String(booking.childCount),
    },

    success_url: `${appUrl}/payment/success?booking=${booking.bookingReference}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/payment/cancelled?booking=${booking.bookingReference}`,
  });

  await prisma.booking.update({
    where: {
      id: booking.id,
    },
    data: {
      stripeCheckoutSessionId: checkoutSession.id,
    },
  });

  if (!checkoutSession.url) {
    return redirectWithError({
      request,
      venueId: input.venueId,
      sessionId: input.sessionId,
      error: "Could not start payment. Please try again.",
    });
  }

  return NextResponse.redirect(checkoutSession.url, 303);
}
