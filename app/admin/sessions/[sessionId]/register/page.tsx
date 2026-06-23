import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { calculateAgeAtDate, calculateStaffingSummary } from "@/lib/staffing";
import { ButtonLink } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StaffingAgeGroupCard } from "@/components/staffing-age-group-card";
import { ChildRegisterCard } from "@/components/child-register-card";
import { formatDateTime, formatPrice } from "@/lib/formatters";

type SessionRegisterPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

function getPricingLabel(pricingType: string) {
  return pricingType === "MEMBER" ? "Member" : "Standard";
}

function getBookingSourceLabel(parentUserId: string | null) {
  return parentUserId ? "Account booking" : "Guest booking";
}

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
          parentUser: {
            include: {
              membership: true,
            },
          },
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

  const accountBookingCount = session.bookings.filter(
    (booking) => booking.parentUserId,
  ).length;

  const memberBookingCount = session.bookings.filter(
    (booking) => booking.pricingType === "MEMBER",
  ).length;

  const totalRevenuePence = session.bookings.reduce(
    (total, booking) => total + booking.totalAmountPence,
    0,
  );

  return (
    <main className="min-h-(--min-page-height)">
      <section className="mx-auto max-w-6xl px-6 py-8">
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

          <Card className="sm:py-4 sm:px-4">
            <p className="text-sm text-(--color-text-secondary)">
              Account bookings
            </p>
            <p className="text-lg font-semibold text-(--color-brand)">
              {accountBookingCount} / {session.bookings.length}
            </p>
          </Card>

          <Card className="sm:py-4 sm:px-4">
            <p className="text-sm text-(--color-text-secondary)">
              Member-priced bookings
            </p>
            <p className="text-lg font-semibold text-(--color-brand)">
              {memberBookingCount}
            </p>
          </Card>

          <Card className="sm:py-4 sm:px-4">
            <p className="text-sm text-(--color-text-secondary)">
              Confirmed revenue
            </p>
            <p className="text-lg font-semibold text-(--color-brand)">
              {formatPrice(totalRevenuePence)}
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
          <h2 className="mb-2 text-lg font-semibold">Confirmed bookings</h2>

          <div className="grid gap-4">
            {session.bookings.length === 0 ? (
              <Card>
                <p>No confirmed bookings for this session.</p>
              </Card>
            ) : (
              session.bookings.map((booking) => (
                <Card key={booking.id}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-(--color-text-secondary)">
                        {booking.bookingReference}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold">
                        {booking.parentName}
                      </h3>
                      <p className="mt-1 text-sm text-(--color-text-secondary)">
                        {booking.parentEmail}
                        {booking.parentPhone ? ` · ${booking.parentPhone}` : ""}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700">
                        {getBookingSourceLabel(booking.parentUserId)}
                      </span>

                      <span
                        className={`rounded-md border px-2 py-1 text-xs font-medium ${
                          booking.pricingType === "MEMBER"
                            ? "border-green-200 bg-green-50 text-green-800"
                            : "border-gray-200 bg-gray-50 text-gray-700"
                        }`}
                      >
                        {getPricingLabel(booking.pricingType)} price
                      </span>

                      {booking.parentUser?.membership ? (
                        <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-800">
                          Membership: {booking.parentUser.membership.status}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
                    <div>
                      <p className="text-(--color-text-secondary)">Children</p>
                      <p className="font-medium">{booking.childCount}</p>
                    </div>

                    <div>
                      <p className="text-(--color-text-secondary)">
                        Price per child
                      </p>
                      <p className="font-medium">
                        {formatPrice(booking.unitPricePence)}
                      </p>
                    </div>

                    <div>
                      <p className="text-(--color-text-secondary)">
                        Total paid
                      </p>
                      <p className="font-medium">
                        {formatPrice(booking.totalAmountPence)}
                      </p>
                    </div>

                    <div>
                      <p className="text-(--color-text-secondary)">Payment</p>
                      <p className="font-medium">{booking.paymentStatus}</p>
                    </div>
                  </div>

                  {booking.parentUserId ? (
                    <div className="mt-4">
                      <ButtonLink
                        href={`/admin/parents/${booking.parentUserId}`}
                        variant="secondary"
                        size="sm"
                      >
                        View parent account
                      </ButtonLink>
                    </div>
                  ) : null}

                  <div className="mt-6 grid gap-4 lg:grid-cols-1">
                    {booking.children.map((child) => {
                      const age = child.dateOfBirth
                        ? calculateAgeAtDate(
                            child.dateOfBirth,
                            session.startsAt,
                          )
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
                    })}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
