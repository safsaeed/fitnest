import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ButtonLink } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Card } from "@/components/ui/card";
import { formatDateTime, formatPrice } from "@/lib/formatters";
import { getBookedChildrenCount } from "@/lib/availability";

export default async function AdminDashboardPage() {
  const now = new Date();

  const [
    activeVenueCount,
    upcomingSessionCount,
    confirmedBookingCount,
    upcomingSessions,
    recentBookings,
  ] = await Promise.all([
    prisma.venue.count({
      where: {
        isActive: true,
      },
    }),

    prisma.session.count({
      where: {
        isActive: true,
        startsAt: {
          gt: now,
        },
      },
    }),

    prisma.booking.count({
      where: {
        status: "CONFIRMED",
      },
    }),

    prisma.session.findMany({
      where: {
        isActive: true,
        startsAt: {
          gt: now,
        },
      },
      orderBy: {
        startsAt: "asc",
      },
      take: 5,
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

    prisma.booking.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      include: {
        session: {
          include: {
            venue: true,
          },
        },
      },
    }),
  ]);

  return (
    <main className="min-h-(--min-page-height)">
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="pt-0 sm:pt-10">
          <Breadcrumbs items={[{ label: "Dashboard", href: "/admin" }]} />

          <h1 className="mt-3 text-3xl font-semibold"> Admin | Dashboard</h1>

          <p className="mt-2 flex items-center gap-2 text-sm text-(--color-text-secondary)">
            Welcome to the admin dashboard. Here you can manage venues, sessions
            and bookings.
          </p>

          <div className="mt-6 flex flex-wrap gap-4">
            <Link href="/admin/venues" className="hidden sm:block">
              <Card className="hidden sm:block max-w-1/5 min-w-40 sm:py-4 sm:px-4">
                <p className="text-sm text-(--color-text-secondary)">
                  Active venues
                </p>
                <p className="text-lg font-semibold text-(--color-brand)">
                  {activeVenueCount}
                </p>
              </Card>
            </Link>

            <Link href="/admin/sessions" className="hidden sm:block">
              <Card className="max-w-1/5 min-w-40 sm:py-4 sm:px-4">
                <p className="text-sm text-(--color-text-secondary)">
                  Upcoming sessions
                </p>
                <p className="text-lg font-semibold text-(--color-brand)">
                  {upcomingSessionCount}
                </p>
              </Card>
            </Link>

            <Link href="/admin/bookings" className="hidden sm:block">
              <Card className="max-w-1/5 min-w-40 sm:py-4 sm:px-4">
                <p className="text-sm text-(--color-text-secondary)">
                  Confirmed bookings
                </p>
                <p className="text-lg font-semibold text-(--color-brand)">
                  {confirmedBookingCount}
                </p>
              </Card>
            </Link>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card>
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold">Upcoming sessions</h2>

                <ButtonLink href="/admin/sessions" variant="ghost" size="sm">
                  View all
                </ButtonLink>
              </div>

              {upcomingSessions.length === 0 ? (
                <p className="text-sm text-(--color-text-secondary)">
                  No upcoming sessions.
                </p>
              ) : (
                upcomingSessions.map((session) => {
                  const bookedChildren = getBookedChildrenCount(
                    session.bookings,
                  );

                  return (
                    <Link
                      key={session.id}
                      href={`/admin/sessions/${session.id}/register`}
                      className="flex justify-between gap-6 p-2 sm:p-4 border border-gray-100 bg-gray-50 rounded-lg hover:bg-gray-100 duration-150 items-center mb-4 last:mb-0"
                    >
                      <div>
                        <p className="text-sm">{session.title}</p>
                        <p className="mt-1 text-xs text-(--color-text-secondary)">
                          {session.venue.name}
                        </p>
                        <p className="text-xs text-(--color-text-secondary)">
                          {formatDateTime(session.startsAt)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-medium text-(--color-brand)">
                          {bookedChildren}/{session.capacity}
                        </p>
                        <p className="text-xs text-(--color-text-secondary)">
                          ENROLLED
                        </p>
                      </div>
                    </Link>
                  );
                })
              )}
            </Card>

            <Card>
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold">Recent bookings</h2>

                <ButtonLink href="/admin/bookings" variant="ghost" size="sm">
                  View all
                </ButtonLink>
              </div>

              {recentBookings.length === 0 ? (
                <p className="text-sm text-(--color-text-secondary)">
                  No bookings yet.
                </p>
              ) : (
                recentBookings.map((booking) => (
                  <Link
                    key={booking.id}
                    href={`/admin/bookings/${booking.id}`}
                    className="flex justify-between gap-6 p-2 sm:p-4 border border-gray-100 bg-gray-50 rounded-lg hover:bg-gray-100 duration-150 items-center mb-4 last:mb-0"
                  >
                    <div>
                      <p className="text-sm">{booking.parentName}</p>
                      <p className="mt-1 text-xs text-(--color-text-secondary)">
                        {booking.session.title}
                      </p>
                      <p className="text-xs text-(--color-text-secondary)">
                        {booking.session.venue.name}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-medium text-(--color-brand)">
                        {formatPrice(booking.totalAmountPence)}
                      </p>
                      <p
                        className={`text-xs text-${booking.status === "CONFIRMED" ? "(--color-success)" : booking.status === "PENDING" ? "(--color-warning)" : "(--color-danger)"}`}
                      >
                        {booking.status}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}
