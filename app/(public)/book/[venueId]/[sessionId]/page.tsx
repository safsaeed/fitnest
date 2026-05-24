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

type BookingPageProps = {
  params: Promise<{
    venueId: string;
    sessionId: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function BookingPage({
  params,
  searchParams,
}: BookingPageProps) {
  const { venueId, sessionId } = await params;
  const query = await searchParams;

  const session = await prisma.session.findFirst({
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
  });

  if (!session) {
    notFound();
  }

  const availability = getSessionAvailability(session);

  return (
    <main className="min-h-(--min-page-height)">
      <section className="mx-auto max-w-5xl px-6 py-8">
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
              pricePence={session.pricePence}
              spacesRemaining={availability.spacesRemaining}
              minAgeYears={session.minAge || 1}
              maxAgeYears={session.maxAge}
            />
          </Card>

          <Card className="h-fit flex flex-col gap-8 rounded-lg min-w-full max-w-full md:min-w-xs md:max-w-sm md:sticky md:top-24">
            <h2 className="text-lg font-semibold mb-2">Booking summary</h2>

            <SummaryRow
              label="Age range"
              value={`${formatAgeRange(session.minAge || 1, session.maxAge)} years`}
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
              label="Price"
              value={`${formatPrice(session.pricePence)} per child`}
            />
            <SummaryRow
              label="Spaces left"
              value={`${availability.spacesRemaining} of ${session.capacity}`}
            />

            <p className="text-(--color-danger) text-xs">
              Bookings cannot be cancelled 24 hours before the session start
              time.
            </p>
          </Card>
        </div>
      </section>
    </main>
  );
}
