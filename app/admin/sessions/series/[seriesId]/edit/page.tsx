import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateSessionSeries } from "../../../actions";
import { SessionSeriesForm } from "./series-form";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ButtonLink } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type EditSessionSeriesPageProps = {
  params: Promise<{
    seriesId: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function EditSessionSeriesPage({
  params,
  searchParams,
}: EditSessionSeriesPageProps) {
  const { seriesId } = await params;
  const query = await searchParams;
  const now = new Date();

  const [series, venues] = await Promise.all([
    prisma.sessionSeries.findUnique({
      where: {
        id: seriesId,
      },
      include: {
        sessions: {
          orderBy: {
            startsAt: "asc",
          },
          include: {
            _count: {
              select: {
                bookings: true,
              },
            },
          },
        },
      },
    }),
    prisma.venue.findMany({
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  if (!series || series.sessions.length === 0) {
    notFound();
  }

  const upcomingSessions = series.sessions.filter(
    (session) => session.startsAt > now,
  );
  const exampleSession = upcomingSessions[0] ?? series.sessions[0];
  const bookingCount = series.sessions.reduce(
    (total, session) => total + session._count.bookings,
    0,
  );
  const updateSeriesWithId = updateSessionSeries.bind(null, series.id);

  return (
    <main className="min-h-(--min-page-height)">
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="pb-10 sm:py-10">
          <Breadcrumbs
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Sessions", href: "/admin/sessions" },
              { label: "Edit series" },
            ]}
          />

          <h1 className="mt-3 text-3xl font-semibold">Edit session series</h1>
          <p className="mt-2 text-sm text-(--color-text-secondary)">
            Update shared details and times across multiple occurrences.
          </p>

          <ButtonLink
            href="/admin/sessions"
            variant="ghost"
            size="custom"
            className="mt-6 self-start p-0 text-sm text-(--color-brand) hover:bg-transparent hover:brightness-130"
          >
            <span className="flex items-center">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Sessions
            </span>
          </ButtonLink>
        </div>

        <SessionSeriesForm
          series={series}
          exampleSession={exampleSession}
          venues={venues}
          totalSessions={series.sessions.length}
          upcomingSessions={upcomingSessions.length}
          bookingCount={bookingCount}
          action={updateSeriesWithId}
          error={query?.error}
        />
      </section>
    </main>
  );
}
