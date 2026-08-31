import { prisma } from "@/lib/prisma";
import { Button, ButtonLink } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { InputField } from "@/components/ui/form-field";
import { AdminList } from "@/components/ui/admin-list";
import { ArrowLeft, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LoadingButtonLink } from "@/components/ui/loading-button-link";
import { Alert } from "@/components/ui/alert";
import {
  StatusViewNav,
  type StatusViewValue,
} from "@/components/ui/status-view-nav";
import type { Prisma } from "@prisma/client";
import {
  SessionOccurrenceCard,
  SessionSeriesCard,
  type AdminSessionItem,
  type AdminSessionSeriesSummary,
} from "./session-list-card";

type SessionStatusFilter = "all" | "active" | "inactive";
type SessionTimeFilter = "upcoming" | "past" | "all";

function getStatusViewHref({
  status,
  search,
  time,
  venueId,
}: {
  status: SessionStatusFilter;
  search: string;
  time: SessionTimeFilter;
  venueId: string;
}) {
  const params = new URLSearchParams();

  if (status !== "active") {
    params.set("status", status);
  }

  if (search) {
    params.set("search", search);
  }

  if (time !== "upcoming") {
    params.set("time", time);
  }

  if (venueId) {
    params.set("venueId", venueId);
  }

  const query = params.toString();
  return query ? `/admin/sessions?${query}` : "/admin/sessions";
}

type AdminSessionsPageProps = {
  searchParams?: Promise<{
    search?: string;
    status?: SessionStatusFilter;
    time?: SessionTimeFilter;
    venueId?: string;
    deleted?: string;
    seriesDeleted?: string;
    seriesUpdated?: string;
  }>;
};

export default async function AdminSessionsPage({
  searchParams,
}: AdminSessionsPageProps) {
  const query = await searchParams;

  const search = query?.search?.trim() ?? "";
  const requestedStatus = query?.status;
  const status: SessionStatusFilter =
    requestedStatus === "inactive" || requestedStatus === "all"
      ? requestedStatus
      : "active";
  const time = query?.time ?? "upcoming";
  const venueId = query?.venueId?.trim() ?? "";

  const now = new Date();

  const sessionBaseWhere = {
    ...(search
      ? {
          OR: [
            {
              title: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              description: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              venue: {
                name: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
          ],
        }
      : {}),

    ...(time === "upcoming"
      ? {
          startsAt: {
            gt: now,
          },
        }
      : time === "past"
        ? {
            startsAt: {
              lt: now,
            },
          }
        : {}),

    ...(venueId ? { venueId } : {}),
  } satisfies Prisma.SessionWhereInput;

  const [sessions, venues, statusCounts] = await Promise.all([
    prisma.session.findMany({
      where: {
        ...sessionBaseWhere,
        ...(status === "active"
          ? { isActive: true }
          : status === "inactive"
            ? { isActive: false }
            : {}),
      },
      orderBy: {
        startsAt: "asc",
      },
      include: {
        venue: true,
        _count: {
          select: {
            bookings: true,
          },
        },
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
    prisma.venue.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    }),
    prisma.session.groupBy({
      by: ["isActive"],
      where: sessionBaseWhere,
      _count: {
        _all: true,
      },
    }),
  ]);

  const selectedVenue = venues.find((venue) => venue.id === venueId);
  const activeSessionCount =
    statusCounts.find((count) => count.isActive)?._count._all ?? 0;
  const inactiveSessionCount =
    statusCounts.find((count) => !count.isActive)?._count._all ?? 0;
  const statusViewItems: Array<{
    value: StatusViewValue;
    label: string;
    count: number;
    href: string;
  }> = [
    {
      value: "active",
      label: "Active",
      count: activeSessionCount,
      href: getStatusViewHref({
        status: "active",
        search,
        time,
        venueId,
      }),
    },
    {
      value: "inactive",
      label: "Inactive",
      count: inactiveSessionCount,
      href: getStatusViewHref({
        status: "inactive",
        search,
        time,
        venueId,
      }),
    },
    {
      value: "all",
      label: "All",
      count: activeSessionCount + inactiveSessionCount,
      href: getStatusViewHref({
        status: "all",
        search,
        time,
        venueId,
      }),
    },
  ];

  const seriesIds = Array.from(
    new Set(
      sessions
        .map((session) => session.seriesId)
        .filter((seriesId): seriesId is string => Boolean(seriesId)),
    ),
  );

  const seriesRecords = seriesIds.length
    ? await prisma.sessionSeries.findMany({
        where: {
          id: {
            in: seriesIds,
          },
        },
        select: {
          id: true,
          title: true,
          repeatPattern: true,
          startsOn: true,
          endsOn: true,
          _count: {
            select: {
              sessions: true,
            },
          },
          sessions: {
            select: {
              venueId: true,
              _count: {
                select: {
                  bookings: true,
                },
              },
            },
          },
        },
      })
    : [];

  const seriesSummaries = new Map<string, AdminSessionSeriesSummary>(
    seriesRecords.map((series) => [
      series.id,
      {
        id: series.id,
        title: series.title,
        repeatPattern: series.repeatPattern,
        startsOn: series.startsOn,
        endsOn: series.endsOn,
        totalSessions: series._count.sessions,
        bookingCount: series.sessions.reduce(
          (total, session) => total + session._count.bookings,
          0,
        ),
        venueCount: new Set(series.sessions.map((session) => session.venueId))
          .size,
      },
    ]),
  );

  const sessionsBySeries = new Map<string, AdminSessionItem[]>();

  for (const session of sessions) {
    if (!session.seriesId) {
      continue;
    }

    const occurrences = sessionsBySeries.get(session.seriesId) ?? [];
    occurrences.push(session);
    sessionsBySeries.set(session.seriesId, occurrences);
  }

  const renderedSeriesIds = new Set<string>();

  const hasFilters = Boolean(
    search || status !== "active" || time !== "upcoming" || venueId,
  );

  return (
    <main className="min-h-(--min-page-height)">
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="pt-0 sm:py-10">
          <Breadcrumbs
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Sessions", href: "/admin/sessions" },
            ]}
          />

          <h1 className="mt-3 text-3xl font-semibold">Admin | Sessions</h1>

          <p className="mt-2 flex items-center gap-2 text-sm text-(--color-text-secondary)">
            Manage session dates, capacity and pricing.
          </p>

          {query?.deleted === "true" ? (
            <Alert variant="success" className="mt-4">
              Session deleted.
            </Alert>
          ) : null}

          {query?.seriesDeleted === "true" ? (
            <Alert variant="success" className="mt-4">
              Session series deleted.
            </Alert>
          ) : null}

          {query?.seriesUpdated === "true" ? (
            <Alert variant="success" className="mt-4">
              Session series updated.
            </Alert>
          ) : null}

          <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <ButtonLink
              href="/admin"
              variant="ghost"
              size="custom"
              className="self-start mt-6 p-0 text-sm text-(--color-brand) hover:bg-transparent hover:brightness-130"
            >
              <span className="flex items-center">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to Dashboard
              </span>
            </ButtonLink>

            <LoadingButtonLink variant="secondary" href="/admin/sessions/new">
              Add new session
            </LoadingButtonLink>
          </div>
        </div>

        <StatusViewNav
          ariaLabel="Session status views"
          activeValue={status}
          items={statusViewItems}
        />

        <form
          action="/admin/sessions"
          method="GET"
          className="mb-10 flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3"
        >
          {status !== "active" ? (
            <input type="hidden" name="status" value={status} />
          ) : null}

          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-8.5 h-4 w-4 text-(--color-text-muted)"
            />

            <InputField
              label="Search sessions"
              id="search"
              name="search"
              type="search"
              defaultValue={search}
              placeholder="Search by title, description or venue"
              className="pl-9"
            />
          </div>

          <div className="flex flex-col">
            <label
              htmlFor="time"
              className="block text-sm font-medium text-(--color-text-secondary)"
            >
              Filter by date
            </label>

            <select
              id="time"
              name="time"
              defaultValue={time}
              className="mt-1 h-9.5 cursor-pointer rounded-lg border border-(--color-brand-border) bg-white px-3 py-1 text-sm text-(--color-text-secondary)"
            >
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
              <option value="all">All dates</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label
              htmlFor="venueId"
              className="block text-sm font-medium text-(--color-text-secondary)"
            >
              Filter by venue
            </label>

            <select
              id="venueId"
              name="venueId"
              defaultValue={venueId}
              className="mt-1 h-9.5 max-w-full cursor-pointer rounded-lg border border-(--color-brand-border) bg-white px-3 py-1 text-sm text-(--color-text-secondary) sm:max-w-56"
            >
              <option value="">All venues</option>
              {venues.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name}
                  {venue.isActive ? "" : " (inactive)"}
                </option>
              ))}
            </select>
          </div>

          <div className="self-end mt-4 space-x-1.5 sm:mt-0 sm:space-x-3">
            <Button type="submit">Search</Button>

            {hasFilters ? (
              <ButtonLink href="/admin/sessions" variant="secondary">
                Clear
              </ButtonLink>
            ) : null}
          </div>
        </form>

        {hasFilters ? (
          <p className="mb-6 text-sm text-(--color-text-secondary)">
            Showing{" "}
            <span className="font-medium text-(--color-text-primary)">
              {status === "all" ? "all sessions" : `${status} sessions`}
            </span>{" "}
            for{" "}
            <span className="font-medium text-(--color-text-primary)">
              {time === "all" ? "all dates" : time}
            </span>
            {search ? (
              <>
                {" "}
                matching{" "}
                <span className="font-medium text-(--color-text-primary)">
                  “{search}”
                </span>
              </>
            ) : null}
            {venueId ? (
              <>
                {" "}
                at{" "}
                <span className="font-medium text-(--color-text-primary)">
                  {selectedVenue?.name ?? "an unavailable venue"}
                </span>
              </>
            ) : null}
            .
          </p>
        ) : null}

        <AdminList>
          {sessions.length === 0 ? (
            <Card>
              {search || time !== "upcoming" || venueId
                ? `No ${status === "all" ? "sessions" : `${status} sessions`} match your filters.`
                : status === "all"
                  ? "No sessions yet."
                  : `No ${status} sessions.`}
            </Card>
          ) : (
            sessions.map((session) => {
              if (!session.seriesId) {
                return (
                  <SessionOccurrenceCard key={session.id} session={session} />
                );
              }

              if (renderedSeriesIds.has(session.seriesId)) {
                return null;
              }

              const series = seriesSummaries.get(session.seriesId);
              const occurrences = sessionsBySeries.get(session.seriesId);

              if (!series || !occurrences) {
                return (
                  <SessionOccurrenceCard key={session.id} session={session} />
                );
              }

              renderedSeriesIds.add(session.seriesId);

              return (
                <SessionSeriesCard
                  key={session.seriesId}
                  series={series}
                  occurrences={occurrences}
                  filteredVenueName={selectedVenue?.name}
                  filteredStatus={status === "all" ? undefined : status}
                />
              );
            })
          )}
        </AdminList>
      </section>
    </main>
  );
}
