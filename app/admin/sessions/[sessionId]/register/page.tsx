import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { calculateAgeAtDate, calculateStaffingSummary } from "@/lib/staffing";
import { ButtonLink } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StaffingAgeGroupCard } from "@/components/staffing-age-group-card";
import { ChildRegisterCard } from "@/components/child-register-card";
import { formatDateTime } from "@/lib/formatters";

type SessionRegisterPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default async function SessionRegisterPage({
  params,
}: SessionRegisterPageProps) {
  const { sessionId } = await params;

  const session = await prisma.session.findUnique({
    where: {
      id: sessionId,
    },
    include: {
      venue: true,
      bookings: {
        where: {
          status: "CONFIRMED",
        },
        include: {
          children: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!session) {
    notFound();
  }

  const children = session.bookings.flatMap((booking) => booking.children);

  const staffing = calculateStaffingSummary({
    children,
    sessionDate: session.startsAt,
  });

  const bookedChildrenCount = children.length;
  const spacesRemaining = Math.max(session.capacity - bookedChildrenCount, 0);

  return (
    <main className="min-h-(--min-page-height)">
      <section className="mx-auto max-w-5xl px-6 py-8">
        <div className="pb-10 sm:py-10">
          <Breadcrumbs
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Sessions", href: "/admin/sessions" },
            ]}
          />

          <h1 className="mt-3 text-3xl font-semibold">Session register</h1>
          <h2 className="mt-2">
            {session.title} at {session.venue.name}
          </h2>

          <p className="mt-2 flex items-center gap-2 text-sm text-(--color-text-secondary)">
            {formatDateTime(session.startsAt)}
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-start gap-6 justify-between">
            <ButtonLink
              href="/admin/sessions"
              variant="ghost"
              size="custom"
              className="self-start p-0 text-sm text-(--color-brand) hover:bg-transparent hover:brightness-130"
            >
              <span className="flex items-center">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to Sessions
              </span>
            </ButtonLink>

            <ButtonLink
              href={`/admin/sessions/${session.id}/register/print`}
              variant="secondary"
              target="_blank"
            >
              Print register
            </ButtonLink>
          </div>
        </div>

        <h2 className="text-lg font-semibold mb-2">Session stats</h2>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
          <Card className="sm:py-4 sm:px-4">
            <p className="text-sm text-(--color-text-secondary)">
              Children booked
            </p>
            <p className="text-lg font-semibold text-(--color-brand)">
              {bookedChildrenCount} / {session.capacity}
            </p>
          </Card>

          <Card className="sm:py-4 sm:px-4">
            <p className="text-sm text-(--color-text-secondary)">
              Spaces available
            </p>
            <p className="text-lg font-semibold text-(--color-brand)">
              {spacesRemaining}
            </p>
          </Card>

          <Card className="col-span-2 sm:col-span-1 sm:py-4 sm:px-4">
            <p className="text-sm text-(--color-text-secondary)">
              Required supervisors
            </p>
            <p className="flex justify-between gap-2 sm:block text-lg font-semibold text-(--color-brand)">
              {staffing.requiredStaff}{" "}
              <span className="font-normal text-sm sm:text-xs">
                (fraction: {staffing.staffingFraction.toFixed(2)})
              </span>
            </p>
          </Card>
        </div>

        <div className="mt-10">
          <h2 className="text-lg font-semibold">Staffing requirement</h2>
          <div className="mt-2 grid gap-4 md:grid-cols-3">
            {staffing.groups.map((group) => (
              <StaffingAgeGroupCard
                key={group.key}
                label={group.label}
                count={group.childCount}
                ratio={`1:${group.ratio}`}
                fraction={group.fraction}
              />
            ))}
          </div>
        </div>

        <div className="mt-10">
          <h2 className="mb-2 text-lg font-semibold">Children attending</h2>
          <div className="grid gap-4 lg:grid-cols-1">
            {session.bookings.length === 0 ? (
              <Card>
                <p> No confirmed bookings for this session.</p>
              </Card>
            ) : (
              session.bookings.flatMap((booking) =>
                booking.children.map((child) => {
                  const age = child.dateOfBirth
                    ? calculateAgeAtDate(child.dateOfBirth, session.startsAt)
                    : "-";

                  return (
                    <ChildRegisterCard
                      key={child.id}
                      childName={[child.firstName, child.lastName]
                        .filter(Boolean)
                        .join(" ")}
                      ageAtSession={age}
                      parentName={booking.parentName}
                      parentPhone={booking.parentPhone}
                      emergencyContactName={booking.emergencyContactName}
                      emergencyContactPhone={booking.emergencyContactPhone}
                      allergies={child.allergies}
                      medicalNotes={child.medicalNotes}
                    />
                  );
                }),
              )
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
