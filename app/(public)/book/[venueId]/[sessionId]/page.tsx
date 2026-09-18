import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionAvailability } from "@/lib/availability";
import { BookingForm } from "./booking-form";
import { ButtonLink } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getParentSession } from "@/lib/parent-auth";
import { calculateBookingPrice } from "@/lib/pricing";
import {
  calculateAgeAtDate,
  getStaffingAvailability,
  getStaffingUnitsForAge,
} from "@/lib/staffing";
import { getSessionMinimumAge } from "@/lib/session-age";

type BookingPageProps = {
  params: Promise<{
    venueId: string;
    sessionId: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
};

function formatDateInput(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getSavedChildEligibility({
  dateOfBirth,
  sessionDate,
  minAge,
  maxAge,
}: {
  dateOfBirth: Date;
  sessionDate: Date;
  minAge: number;
  maxAge: number | null;
}) {
  const age = calculateAgeAtDate(dateOfBirth, sessionDate);

  if (age < minAge) {
    return {
      isEligible: false,
      eligibilityReason: `This child is too young for this session. Minimum age is ${minAge}.`,
    };
  }

  if (maxAge !== null && age > maxAge) {
    return {
      isEligible: false,
      eligibilityReason: `This child is too old for this session. Maximum age is ${maxAge}.`,
    };
  }

  return {
    isEligible: true,
    eligibilityReason: null,
  };
}

export default async function BookingPage({
  params,
  searchParams,
}: BookingPageProps) {
  const { venueId, sessionId } = await params;
  const query = await searchParams;

  const parentSession = await getParentSession();

  const [session, parentUser] = await Promise.all([
    prisma.session.findFirst({
      where: {
        id: sessionId,
        venueId,
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
    }),

    parentSession
      ? prisma.parentUser.findFirst({
          where: {
            id: parentSession.parentUserId,
            isActive: true,
          },
          include: {
            children: {
              where: {
                isActive: true,
              },
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        })
      : null,
  ]);

  if (!session) {
    notFound();
  }

  const availability = getSessionAvailability(session);
  const minAgeYears = getSessionMinimumAge(session.minAge);
  const confirmedChildren = session.bookings.flatMap(
    (booking) => booking.children,
  );
  const staffingAvailability = getStaffingAvailability({
    children: confirmedChildren,
    sessionDate: session.startsAt,
    minAge: minAgeYears,
    maxAge: session.maxAge,
  });
  const staffingLimitReached =
    staffingAvailability.bookableAgeGroups.length === 0;
  const canBook = availability.canBook && !staffingLimitReached;
  const bookingStatusLabel = !availability.canBook
    ? availability.statusLabel
    : staffingLimitReached
      ? "Staffing limit reached"
      : availability.statusLabel;

  const bookingPath = `/book/${venueId}/${sessionId}`;
  const addChildHref = `/account/children/new?returnTo=${encodeURIComponent(
    bookingPath,
  )}`;

  const savedChildren =
    parentUser?.children.map((child) => {
      const eligibility = getSavedChildEligibility({
        dateOfBirth: child.dateOfBirth,
        sessionDate: session.startsAt,
        minAge: minAgeYears,
        maxAge: session.maxAge,
      });

      return {
        id: child.id,
        firstName: child.firstName,
        lastName: child.lastName,
        dateOfBirth: formatDateInput(child.dateOfBirth),
        allergies: child.allergies,
        medicalNotes: child.medicalNotes,
        isEligible: eligibility.isEligible,
        eligibilityReason: eligibility.eligibilityReason,
        staffingUnits: getStaffingUnitsForAge(
          calculateAgeAtDate(child.dateOfBirth, session.startsAt),
        ),
      };
    }) ?? [];

  const defaultParent =
    parentUser === null
      ? null
      : {
          name: parentUser.name,
          email: parentUser.email,
          phone: parentUser.phone,
          emergencyContactName: parentUser.defaultEmergencyContactName,
          emergencyContactPhone: parentUser.defaultEmergencyContactPhone,
        };

  const singleChildPriceSummary = calculateBookingPrice({
    session,
    childCount: 1,
  });

  return (
    <main className="min-h-(--min-page-height)">
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="pt-0 sm:pt-10">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Venues", href: "/book" },
              { label: `Sessions`, href: `/book/${venueId}` },
              { label: session.title, href: `/book/${venueId}/${sessionId}` },
            ]}
          />

          <h1 className="mt-3 text-3xl font-semibold">Complete your booking</h1>

          <p className="mt-2 flex items-center gap-2 text-sm text-(--color-text-secondary)">
            Enter parent and child details to continue.
          </p>
        </div>

        <ButtonLink
          href={`/book/${venueId}`}
          variant="ghost"
          size="custom"
          className="mt-6 p-0 text-sm text-(--color-brand) hover:bg-transparent hover:brightness-130"
        >
          <span className="flex items-center">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Sessions
          </span>
        </ButtonLink>

        {!canBook ? (
          <Alert variant="error" className="mt-6">
            <h2 className="text-lg font-semibold">Booking unavailable</h2>
            <p className="mt-2 text-sm">
              This session is currently unavailable:{" "}
              <span className="font-semibold">{bookingStatusLabel}</span>
            </p>
          </Alert>
        ) : null}

        <div className="mb-2 mt-12 flex flex-col-reverse gap-6 md:flex-row">
          <Card
            disabled={!canBook}
            className="w-full max-w-none flex-1"
          >
            {query?.error && (
              <Alert variant="error" className="mb-4">
                {query.error}
              </Alert>
            )}

            <BookingForm
              venueId={venueId}
              sessionId={session.id}
              pricePence={singleChildPriceSummary.unitPricePence}
              headcountSpacesRemaining={availability.spacesRemaining}
              staffingUnitsRemaining={staffingAvailability.remainingUnits}
              sessionStartsAt={session.startsAt.toISOString()}
              minAgeYears={minAgeYears}
              maxAgeYears={session.maxAge}
              defaultParent={defaultParent}
              savedChildren={savedChildren}
              addChildHref={addChildHref}
            />
          </Card>
        </div>
      </section>
    </main>
  );
}
