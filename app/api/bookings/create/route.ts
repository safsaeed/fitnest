import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { parseBookingFormData } from "@/lib/booking-validation";
import { generateBookingReference } from "@/lib/booking-reference";
import { validateBookingCapacity } from "@/lib/booking-capacity";
import { generateBookingAccessToken } from "@/lib/booking-access-token";
import { formatDateTime } from "@/lib/formatters";
import { getFormString } from "@/lib/form-data";
import { getParentSession } from "@/lib/parent-auth";
import { calculateBookingPrice } from "@/lib/pricing";
import { calculateAgeAtDate } from "@/lib/staffing";
import { getSessionMinimumAge } from "@/lib/session-age";
import {
  CHECKOUT_EXPIRY_SECONDS,
  PAYMENT_START_FAILED_REASON,
} from "@/lib/booking-payment";
import { markPendingBookingClosed } from "@/lib/booking-payment.server";

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

function childMeetsSessionAgeRequirement({
  dateOfBirth,
  sessionDate,
  minAge,
  maxAge,
}: {
  dateOfBirth: Date;
  sessionDate: Date;
  minAge: number | null;
  maxAge: number | null;
}) {
  const age = calculateAgeAtDate(dateOfBirth, sessionDate);
  const minimumAge = getSessionMinimumAge(minAge);

  if (age < minimumAge) {
    return false;
  }

  if (maxAge !== null && age > maxAge) {
    return false;
  }

  return true;
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

  const parentSession = await getParentSession();

  if (input.bookingMode === "account" && !parentSession) {
    return redirectWithError({
      request,
      venueId: input.venueId,
      sessionId: input.sessionId,
      error: "Please log in to book with saved children.",
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
          children: {
            select: {
              dateOfBirth: true,
            },
          },
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

  const parentUser =
    input.bookingMode === "account" && parentSession
      ? await prisma.parentUser.findFirst({
          where: {
            id: parentSession.parentUserId,
            isActive: true,
          },
        })
      : null;

  if (input.bookingMode === "account" && !parentUser) {
    return redirectWithError({
      request,
      venueId: input.venueId,
      sessionId: input.sessionId,
      error: "Your account could not be found. Please log in again.",
    });
  }

  const selectedParentChildren =
    input.bookingMode === "account" && parentUser
      ? await prisma.parentChild.findMany({
          where: {
            id: {
              in: input.selectedParentChildIds,
            },
            parentUserId: parentUser.id,
            isActive: true,
          },
        })
      : [];

  if (
    input.bookingMode === "account" &&
    selectedParentChildren.length !== input.selectedParentChildIds.length
  ) {
    return redirectWithError({
      request,
      venueId: input.venueId,
      sessionId: input.sessionId,
      error: "One or more selected children could not be found.",
    });
  }

  const ageValidationError =
    input.bookingMode === "account"
      ? input.selectedParentChildIds.reduce<string | null>(
          (message, childId) => {
            if (message) {
              return message;
            }

            const child = selectedParentChildren.find(
              (selectedChild) => selectedChild.id === childId,
            );

            if (!child) {
              return "One or more selected children could not be found.";
            }

            const meetsRequirement = childMeetsSessionAgeRequirement({
              dateOfBirth: child.dateOfBirth,
              sessionDate: session.startsAt,
              minAge: session.minAge,
              maxAge: session.maxAge,
            });

            if (!meetsRequirement) {
              return `${child.firstName} does not meet the session age requirements.`;
            }

            return null;
          },
          null,
        )
      : input.children.reduce<string | null>((message, child) => {
          if (message) {
            return message;
          }

          const dateOfBirth = new Date(`${child.dateOfBirth}T00:00:00.000Z`);

          const meetsRequirement = childMeetsSessionAgeRequirement({
            dateOfBirth,
            sessionDate: session.startsAt,
            minAge: session.minAge,
            maxAge: session.maxAge,
          });

          if (!meetsRequirement) {
            return `${child.firstName} does not meet the session age requirements.`;
          }

          return null;
        }, null);

  if (ageValidationError) {
    return redirectWithError({
      request,
      venueId: input.venueId,
      sessionId: input.sessionId,
      error: ageValidationError,
    });
  }

  const childrenToCreate =
    input.bookingMode === "account"
      ? input.selectedParentChildIds.map((childId) => {
          const child = selectedParentChildren.find(
            (selectedChild) => selectedChild.id === childId,
          );

          if (!child) {
            throw new Error("Selected child was not found after validation.");
          }

          return {
            parentChildId: child.id,
            firstName: child.firstName,
            lastName: child.lastName,
            dateOfBirth: child.dateOfBirth,
            allergies: child.allergies,
            medicalNotes: child.medicalNotes,
          };
        })
      : input.children.map((child) => ({
          firstName: child.firstName,
          lastName: child.lastName,
          dateOfBirth: new Date(`${child.dateOfBirth}T00:00:00.000Z`),
          allergies: child.allergies,
          medicalNotes: child.medicalNotes,
        }));

  const capacityCheck = validateBookingCapacity({
    session,
    requestedChildren: childrenToCreate,
  });

  if (!capacityCheck.ok) {
    return redirectWithError({
      request,
      venueId: input.venueId,
      sessionId: input.sessionId,
      error: capacityCheck.reason,
    });
  }

  const appUrl = process.env.APP_URL;

  if (!appUrl) {
    throw new Error("APP_URL is not set");
  }

  const priceSummary = calculateBookingPrice({
    session,
    childCount: childrenToCreate.length,
  });

  const bookingParentName = parentUser?.name ?? input.parentName;
  const bookingParentEmail = (
    parentUser?.email ?? input.parentEmail
  ).toLowerCase();
  const bookingParentPhone = parentUser?.phone ?? input.parentPhone;

  const booking = await prisma.booking.create({
    data: {
      bookingReference: generateBookingReference(),
      bookingAccessToken: generateBookingAccessToken(),

      sessionId: session.id,
      parentUserId: parentUser?.id ?? null,

      parentName: bookingParentName,
      parentEmail: bookingParentEmail,
      parentPhone: bookingParentPhone,

      emergencyContactName: input.emergencyContactName,
      emergencyContactPhone: input.emergencyContactPhone,

      status: "PENDING",
      paymentStatus: "PENDING",
      refundStatus: "NONE",

      pricingType: priceSummary.pricingType,
      unitPricePence: priceSummary.unitPricePence,
      totalAmountPence: priceSummary.totalAmountPence,
      childCount: priceSummary.childCount,

      consentAccepted: true,
      consentAcceptedAt: new Date(),
      consentTextVersion: "v2",

      marketingOptIn: input.marketingOptIn === "on",

      children: {
        create: childrenToCreate,
      },
    },
    include: {
      children: true,
    },
  });

  let checkoutSessionId: string | null = null;

  try {
    // Stripe requires expires_at to be at least 30 minutes after it receives
    // the request. The small buffer avoids network transit crossing that limit.
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: booking.parentEmail,
      client_reference_id: booking.bookingReference,
      expires_at:
        Math.floor(Date.now() / 1000) + CHECKOUT_EXPIRY_SECONDS + 60,

      line_items: [
        {
          quantity: booking.childCount,
          price_data: {
            currency: "gbp",
            unit_amount: booking.unitPricePence,
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
        pricingType: booking.pricingType,
        unitPricePence: String(booking.unitPricePence),
        parentUserId: parentUser?.id ?? "",
        pricingLabel: priceSummary.label,
      },

      success_url: `${appUrl}/payment/success?booking=${booking.bookingReference}&token=${booking.bookingAccessToken}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/api/bookings/checkout-cancelled?booking=${booking.bookingReference}&token=${booking.bookingAccessToken}`,
    });

    checkoutSessionId = checkoutSession.id;

    await prisma.booking.update({
      where: {
        id: booking.id,
      },
      data: {
        stripeCheckoutSessionId: checkoutSession.id,
      },
    });

    if (checkoutSession.url) {
      return NextResponse.redirect(checkoutSession.url, 303);
    }
  } catch (error) {
    console.error(
      `Could not start checkout for booking ${booking.bookingReference}`,
      error,
    );

    if (checkoutSessionId) {
      try {
        await stripe.checkout.sessions.expire(checkoutSessionId);
      } catch (expireError) {
        console.error(
          `Could not expire unusable checkout ${checkoutSessionId}`,
          expireError,
        );
      }
    }
  }

  await markPendingBookingClosed({
    bookingId: booking.id,
    reason: PAYMENT_START_FAILED_REASON,
  });

  return redirectWithError({
    request,
    venueId: input.venueId,
    sessionId: input.sessionId,
    error: "Could not start payment. Please try again.",
  });
}
