import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CityFilter } from "./city-filter";
import { ButtonLink } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  MapPin,
  MapPinOff,
} from "lucide-react";

type BookPageProps = {
  searchParams?: Promise<{
    city?: string;
  }>;
};

export default async function BookPage({ searchParams }: BookPageProps) {
  const query = await searchParams;
  const selectedCity = query?.city?.trim() || "";

  const cities = await prisma.venue.findMany({
    where: {
      isActive: true,
      city: {
        not: null,
      },
    },
    select: {
      city: true,
    },
    distinct: ["city"],
    orderBy: {
      city: "asc",
    },
  });

  const cityOptions = cities
    .map((venue) => venue.city)
    .filter((city): city is string => Boolean(city));

  const venues = await prisma.venue.findMany({
    where: {
      isActive: true,
      ...(selectedCity
        ? {
            city: selectedCity,
          }
        : {}),
    },
    orderBy: [
      {
        city: "asc",
      },
      {
        name: "asc",
      },
    ],
    include: {
      sessions: {
        where: {
          isActive: true,
          startsAt: {
            gt: new Date(),
          },
        },
        select: {
          id: true,
        },
      },
    },
  });

  return (
    <main className="min-h-(--min-page-height)">
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="pt-0 sm:pt-10">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Venues", href: "/book" },
            ]}
          />

          <h1 className="mt-3 text-3xl font-semibold">
            Book a children&apos;s session
          </h1>

          <p className="mt-2 text-sm text-(--color-text-secondary)">
            Choose a partner venue to view available sessions and book a place
            for your child.
          </p>
        </div>

        <div className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <ButtonLink
            href="/"
            variant="ghost"
            size="custom"
            className="p-0 justify-start text-sm text-(--color-brand) hover:bg-transparent hover:brightness-130"
          >
            <span className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Home
            </span>
          </ButtonLink>

          <CityFilter cities={cityOptions} selectedCity={selectedCity} />
        </div>

        <div className="grid gap-4 py-10 sm:grid-cols-2">
          {venues.length === 0 ? (
            <div className="flex items-center gap-2 text-(--color-text-secondary)">
              <MapPinOff className="h-4 w-4 shrink-0" />
              <p>
                No venues are currently available
                {selectedCity ? ` in ${selectedCity}` : ""}.
              </p>
            </div>
          ) : (
            venues.map((venue) => (
              <Link
                key={venue.id}
                href={venue.sessions.length ? `/book/${venue.id}` : "#"}
              >
                <Card
                  disabled={!venue.sessions.length}
                  className="min-w-full h-full"
                >
                  <h2 className="text-lg font-semibold">{venue.name}</h2>

                  <p className=" text-xs text-(--color-text-secondary)">
                    {[venue.addressLine1, venue.addressLine2, venue.postcode]
                      .filter(Boolean)
                      .join(", ") || null}
                  </p>

                  <p className="mt-3 flex items-center gap-1 text-sm text-(--color-text-secondary)">
                    <MapPin className="h-4 w-4 shrink-0 text-(--color-brand)" />
                    <span>
                      {[venue.city, venue.county].filter(Boolean).join(", ") ||
                        "Location TBC"}
                    </span>
                  </p>

                  <div className="mt-3 flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-light ${
                        venue.sessions.length
                          ? "bg-(--color-success-soft) text-(--color-success)"
                          : "bg-(--color-danger-soft) text-(--color-danger)"
                      }`}
                    >
                      <CalendarDays className="h-3.5 w-3.5" />
                      {venue.sessions.length} Session
                      {venue.sessions.length !== 1 ? "s" : ""} upcoming
                    </span>

                    {venue.sessions.length ? (
                      <ArrowRight className="h-4 w-4 text-(--color-brand)" />
                    ) : null}
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
