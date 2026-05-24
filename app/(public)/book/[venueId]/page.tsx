import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionAvailability } from "@/lib/availability";
import { Button, ButtonLink } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Card } from "@/components/ui/card";
import { formatLongDate, formatPrice, formatTime } from "@/lib/formatters";
import { groupSessionsByType } from "@/lib/session-groups";
import { CalendarDays, Clock, MapPin, ArrowLeft } from "lucide-react";
import { LoadingButtonLink } from "@/components/ui/loading-button-link";

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

  const sessionGroups = groupSessionsByType(venue.sessions);

  return (
    <main className="min-h-(--min-page-height)">
      <section className="mx-auto max-w-5xl px-6 py-8">
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

        <div className="mt-4 grid gap-4">
          {sessionGroups.length === 0 ? (
            <p className="text-(--color-text-secondary)">
              No upcoming sessions are available at this venue.
            </p>
          ) : (
            sessionGroups.map((sessions) => {
              const firstSession = sessions[0];

              return (
                <Card
                  key={`${firstSession.title}-${firstSession.pricePence}`}
                  className="min-w-full"
                >
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {firstSession.title}
                        </h3>

                        {firstSession.description ? (
                          <p className="mt-2 text-sm text-(--color-text-secondary)">
                            {firstSession.description}
                          </p>
                        ) : null}

                        {firstSession.minAge || firstSession.maxAge ? (
                          <p className="mt-1 text-sm text-(--color-text-secondary)">
                            Ages {firstSession.minAge ?? "-"} to{" "}
                            {firstSession.maxAge ?? "-"} years
                          </p>
                        ) : null}

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <span className="rounded-lg bg-(--color-brand-soft) px-3 py-1 text-xs font-medium text-(--color-brand)">
                            {sessions.length} upcoming session
                            {sessions.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-(--color-text-secondary)">
                          <span className="text-lg font-semibold">
                            {formatPrice(firstSession.pricePence)}
                          </span>{" "}
                          <span className="text-xs">per child</span>
                        </p>

                        <p className="mt-1 text-xs text-(--color-text-muted)">
                          Bookings close 2 hours before session start.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {sessions.map((session) => {
                        const availability = getSessionAvailability(session);

                        return (
                          <div
                            key={session.id}
                            className={`flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-gray-200 ${availability.canBook ? "" : "opacity-60"}`}
                          >
                            <div className="grid gap-2 text-sm text-(--color-text-secondary)">
                              <p className="flex items-center gap-2">
                                <CalendarDays
                                  aria-hidden="true"
                                  className="h-4 w-4 shrink-0 text-(--color-brand)"
                                />
                                <span>{formatLongDate(session.startsAt)}</span>
                              </p>

                              <p className="flex items-center gap-2">
                                <Clock
                                  aria-hidden="true"
                                  className="h-4 w-4 shrink-0 text-(--color-brand)"
                                />
                                <span>
                                  {formatTime(session.startsAt)} –{" "}
                                  {formatTime(session.endsAt)}
                                </span>
                              </p>
                            </div>

                            <div className="flex flex-wrap self-end items-center gap-2">
                              <span
                                className={`rounded-lg px-3 py-1 text-xs font-medium ${
                                  availability.spacesRemaining <= 3
                                    ? "bg-(--color-warning-soft) text-(--color-warning)"
                                    : "bg-(--color-success-soft) text-(--color-success)"
                                }`}
                              >
                                {availability.spacesRemaining} spaces left
                              </span>

                              {availability.canBook ? (
                                <LoadingButtonLink
                                  href={`/book/${venue.id}/${session.id}`}
                                  size="sm"
                                  className="w-22.5"
                                >
                                  Book
                                </LoadingButtonLink>
                              ) : (
                                <Button
                                  type="button"
                                  disabled
                                  variant="secondary"
                                  size="sm"
                                  className="w-22.5"
                                >
                                  Unavailable
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}
