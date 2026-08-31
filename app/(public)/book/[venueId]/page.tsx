import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionAvailability } from "@/lib/availability";
import { ButtonLink } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { formatLongDate, formatPrice, formatTime } from "@/lib/formatters";
import { groupSessionsByType } from "@/lib/session-groups";
import { getLocalDateKey } from "@/lib/session-dates";
import { MapPin, ArrowLeft } from "lucide-react";
import {
  AvailableSessions,
  type SessionOccurrence,
} from "./available-sessions";

type VenueSessionsPageProps = {
  params: Promise<{
    venueId: string;
  }>;
};

export default async function VenueSessionsPage({
  params,
}: VenueSessionsPageProps) {
  const { venueId } = await params;

  const venue = await prisma.venue.findUnique({
    where: {
      id: venueId,
      isActive: true,
    },
    include: {
      sessions: {
        where: {
          isActive: true,
          startsAt: {
            gt: new Date(),
          },
        },
        orderBy: {
          startsAt: "asc",
        },
        include: {
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

  if (!venue) {
    notFound();
  }

  const sessionGroups: SessionOccurrence[][] = groupSessionsByType(
    venue.sessions,
  ).map((sessions) =>
    sessions.map((session) => {
      const availability = getSessionAvailability(session);

      return {
        id: session.id,
        title: session.title,
        description: session.description,
        priceLabel: formatPrice(session.pricePence),
        minAge: session.minAge,
        maxAge: session.maxAge,
        dateKey: getLocalDateKey(session.startsAt),
        dateLabel: formatLongDate(session.startsAt),
        timeLabel: `${formatTime(session.startsAt)} – ${formatTime(
          session.endsAt,
        )}`,
        spacesRemaining: availability.spacesRemaining,
        canBook: availability.canBook,
        availabilityLabel: availability.statusLabel,
      };
    }),
  );

  return (
    <main className="min-h-(--min-page-height)">
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="pt-0 sm:pt-10">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Venues", href: "/book" },
              { label: venue.name, href: `/book/${venue.id}` },
            ]}
          />

          <h1 className="mt-3 text-3xl font-semibold">{venue.name}</h1>

          <p className="mt-2 flex items-center gap-2 text-sm text-(--color-text-secondary)">
            <MapPin
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-(--color-brand)"
            />
            <span>
              {[venue.addressLine1, venue.city, venue.county, venue.postcode]
                .filter(Boolean)
                .join(", ") || "Location TBC"}
            </span>
          </p>
        </div>

        <ButtonLink
          href="/book"
          variant="ghost"
          size="custom"
          className="mt-6 p-0 text-sm text-(--color-brand) hover:bg-transparent hover:brightness-130"
        >
          <span className="flex items-center">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Venues
          </span>
        </ButtonLink>

        <h2 className="mb-2 mt-6 text-lg">Available sessions</h2>
        <AvailableSessions
          key={venue.id}
          venueId={venue.id}
          sessionGroups={sessionGroups}
        />
      </section>
    </main>
  );
}
