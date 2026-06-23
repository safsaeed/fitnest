import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionAvailability } from "@/lib/availability";
import { BookingForm } from "./booking-form";
import { ButtonLink } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { SummaryRow } from "@/components/ui/summary-row";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import {
  formatAgeRange,
  formatLongDate,
  formatPrice,
  formatTime,
} from "@/lib/formatters";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getParentSession } from "@/lib/parent-auth";
import { calculateBookingPrice, hasActiveMembership } from "@/lib/pricing";

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

function calculateAgeAtDate(dateOfBirth: Date, sessionDate: Date) {
  let age = sessionDate.getFullYear() - dateOfBirth.getFullYear();

  const hasHadBirthdayThisYear =
    sessionDate.getMonth() > dateOfBirth.getMonth() ||
    (sessionDate.getMonth() === dateOfBirth.getMonth() &&
      sessionDate.getDate() >= dateOfBirth.getDate());

  if (!hasHadBirthdayThisYear) {
    age--;
  }

  return age;
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
            membership: true,
          },
        })
      : null,
  ]);

  if (!session) {
    notFound();
  }

  const availability = getSessionAvailability(session);
  const minAgeYears = session.minAge || 1;

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
      };
    }) ?? [];

  const defaultParent =
    parentUser === null
      ? null
      : {
          name: parentUser.name,
          email: parentUser.email,
          phone: parentUser.phone,
        };

  const activeMembership = hasActiveMembership(parentUser?.membership ?? null);

  const singleChildPriceSummary = calculateBookingPrice({
    session,
    membership: parentUser?.membership ?? null,
    childCount: 1,
  });

  const hasMemberPrice = session.memberPricePence !== null;
  const memberPriceWillApply =
    activeMembership && singleChildPriceSummary.pricingType === "MEMBER";

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

        {!availability.canBook ? (
          <Alert variant="error" className="mt-6">
            <h2 className="text-lg font-semibold">Booking unavailable</h2>
            <p className="mt-2 text-sm">
              This session is currently unavailable:{" "}
              <span className="font-semibold">{availability.statusLabel}</span>
            </p>
          </Alert>
        ) : null}

        {hasMemberPrice && !memberPriceWillApply ? (
          <Alert className="mt-6">
            <h2 className="text-lg font-semibold">
              Members pay {formatPrice(session.memberPricePence!)} per child
            </h2>

            {!parentUser ? (
              <p className="mt-2 text-sm">
                Log in or create a parent account with an active membership to
                get the member price.{" "}
                <Link href="/account/login" className="font-medium underline">
                  Log in
                </Link>{" "}
                or{" "}
                <Link
                  href="/account/register"
                  className="font-medium underline"
                >
                  create an account
                </Link>
                .
              </p>
            ) : (
              <p className="mt-2 text-sm">
                Start or manage your membership to unlock member pricing for
                this session.{" "}
                <Link
                  href="/account/membership"
                  className="font-medium underline"
                >
                  View membership
                </Link>
                .
              </p>
            )}
          </Alert>
        ) : null}

        {memberPriceWillApply ? (
          <Alert className="mt-6" variant="success">
            <h2 className="text-md font-semibold">Member price applied</h2>
            <p className="mt-2 text-sm">
              Your active membership means you will pay{" "}
              <span className="font-semibold">
                {formatPrice(singleChildPriceSummary.unitPricePence)}
              </span>{" "}
              per child for this session.
            </p>
          </Alert>
        ) : null}

        <div className="mb-2 mt-12 flex flex-col-reverse gap-6 md:flex-row">
          <Card
            disabled={!availability.canBook}
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
              standardPricePence={session.pricePence}
              memberPricePence={session.memberPricePence}
              pricingType={singleChildPriceSummary.pricingType}
              spacesRemaining={availability.spacesRemaining}
              minAgeYears={minAgeYears}
              maxAgeYears={session.maxAge}
              defaultParent={defaultParent}
              savedChildren={savedChildren}
              addChildHref={addChildHref}
            />
          </Card>

          <Card className="h-fit flex flex-col gap-8 rounded-lg min-w-full max-w-full md:min-w-xs md:max-w-sm md:sticky md:top-24">
            <h2 className="text-lg font-semibold mb-2">Booking summary</h2>

            <SummaryRow
              label="Age range"
              value={`${formatAgeRange(minAgeYears, session.maxAge)} years`}
            />
            <SummaryRow label="Venue" value={session.venue.name} />
            <SummaryRow label="Session" value={session.title} />
            <SummaryRow label="Date" value={formatLongDate(session.startsAt)} />
            <SummaryRow
              label="Time"
              value={`${formatTime(session.startsAt)} – ${formatTime(
                session.endsAt,
              )}`}
            />

            <SummaryRow
              label="Standard price"
              value={`${formatPrice(session.pricePence)} per child`}
            />

            {session.memberPricePence !== null ? (
              <SummaryRow
                label="Member price"
                value={`${formatPrice(session.memberPricePence)} per child`}
              />
            ) : null}

            <SummaryRow
              label="Price applied"
              value={`${formatPrice(singleChildPriceSummary.unitPricePence)} per child`}
            />

            <SummaryRow
              label="Spaces left"
              value={`${availability.spacesRemaining} of ${session.capacity}`}
            />

            <p className="text-(--color-danger) text-xs">
              Bookings and cancellations close at 6pm the day before the session.
            </p>
          </Card>
        </div>
      </section>
    </main>
  );
}
