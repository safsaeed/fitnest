import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getParentSession } from "@/lib/parent-auth";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function AccountDashboardPage() {
  const session = await getParentSession();

  if (!session) {
    redirect("/account/login");
  }

  const parentUser = await prisma.parentUser.findUnique({
    where: {
      id: session.parentUserId,
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
      bookings: {
        include: {
          session: {
            include: {
              venue: true,
            },
          },
          children: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      },
    },
  });

  if (!parentUser || !parentUser.isActive) {
    redirect("/account/login");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${parentUser.name}`}
        description="Manage your children and bookings in one place."
      />

      {!parentUser.defaultEmergencyContactName ||
      !parentUser.defaultEmergencyContactPhone ? (
        <Alert>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">Emergency contact required</p>
              <p className="mt-1">
                Add an emergency contact to your profile. You will still need
                to confirm these details whenever you make a booking.
              </p>
            </div>
            <ButtonLink href="/account/profile" variant="secondary" size="sm">
              Update profile
            </ButtonLink>
          </div>
        </Alert>
      ) : null}

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">
              Saved children
            </h2>
            <p className="mt-1 text-sm text-(--color-text-secondary)">
              Save child details so bookings are quicker next time.
            </p>
          </div>

          <ButtonLink
            href="/account/children"
            variant="secondary"
          >
            Manage children
          </ButtonLink>
        </div>

        {parentUser.children.length === 0 ? (
          <p className="mt-4 text-sm text-(--color-text-muted)">
            You have not saved any children yet.
          </p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {parentUser.children.map((child) => (
              <div key={child.id} className="rounded-lg border border-(--color-brand-border) bg-(--color-brand-soft) p-4">
                <p className="font-medium">
                  {[child.firstName, child.lastName].filter(Boolean).join(" ")}
                </p>
                <p className="mt-1 text-sm text-(--color-text-secondary)">
                  Date of birth:{" "}
                  {new Intl.DateTimeFormat("en-GB", {
                    dateStyle: "medium",
                  }).format(child.dateOfBirth)}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">
              Recent bookings
            </h2>
            <p className="mt-1 text-sm text-(--color-text-secondary)">
              Account-linked bookings will appear here.
            </p>
          </div>

          <ButtonLink
            href="/account/bookings"
            variant="secondary"
          >
            View all bookings
          </ButtonLink>
        </div>

        {parentUser.bookings.length === 0 ? (
          <p className="mt-4 text-sm text-(--color-text-muted)">
            You do not have any account bookings yet.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {parentUser.bookings.map((booking) => (
              <div
                key={booking.id}
                className="rounded-lg border border-(--color-brand-border) bg-(--color-brand-soft) p-4 text-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {booking.session.title}
                    </p>
                    <p className="mt-1 text-(--color-text-secondary)">
                      {booking.session.venue.name}
                    </p>
                    <p className="mt-1 text-(--color-text-secondary)">
                      {formatDateTime(booking.session.startsAt)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-medium">
                      {booking.bookingReference}
                    </p>
                    <p className="mt-1 text-(--color-text-secondary)">
                      {booking.status} / {booking.paymentStatus}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
