import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getParentSession } from "@/lib/parent-auth";
import { formatDateTime, formatPrice } from "@/lib/formatters";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

function getStatusClass(status: string) {
  if (status === "CONFIRMED") {
    return "border-green-200 bg-green-50 text-green-800";
  }

  if (status === "PENDING") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  if (status === "CANCELLED" || status === "REFUNDED") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  return "border-gray-200 bg-gray-50 text-gray-800";
}

function getPricingLabel(pricingType: string) {
  return pricingType === "MEMBER" ? "Member price" : "Standard price";
}

export default async function AccountBookingsPage() {
  const session = await getParentSession();

  if (!session) {
    redirect("/account/login");
  }

  const bookings = await prisma.booking.findMany({
    where: {
      parentUserId: session.parentUserId,
    },
    include: {
      children: true,
      session: {
        include: {
          venue: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bookings"
        description="View bookings made through your parent account."
      />

      {bookings.length === 0 ? (
        <Card className="p-8 text-center">
          <h2 className="text-lg font-semibold">
            No account bookings yet
          </h2>
          <p className="mt-2 text-sm text-(--color-text-secondary)">
            Book a session while logged in and it will appear here.
          </p>

          <ButtonLink
            href="/book"
            className="mt-5"
          >
            Find sessions
          </ButtonLink>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-(--color-text-muted)">
                    {booking.bookingReference}
                  </p>

                  <h2 className="mt-1 text-lg font-semibold">
                    {booking.session.title}
                  </h2>

                  <p className="mt-1 text-sm text-(--color-text-secondary)">
                    {booking.session.venue.name}
                  </p>

                  <p className="mt-1 text-sm text-(--color-text-secondary)">
                    {formatDateTime(booking.session.startsAt)}
                  </p>
                </div>

                <span
                  className={`rounded-md border px-2 py-1 text-xs font-medium uppercase tracking-wide ${getStatusClass(
                    booking.status,
                  )}`}
                >
                  {booking.status}
                </span>
              </div>

              <div className="mt-4 grid gap-3 text-sm text-(--color-text-secondary) sm:grid-cols-4">
                <div>
                  <p className="text-(--color-text-muted)">Children</p>
                  <p className="font-medium text-(--color-text-primary)">
                    {booking.childCount}
                  </p>
                </div>

                <div>
                  <p className="text-(--color-text-muted)">Pricing</p>
                  <p className="font-medium text-(--color-text-primary)">
                    {getPricingLabel(booking.pricingType)}
                  </p>
                </div>

                <div>
                  <p className="text-(--color-text-muted)">Payment</p>
                  <p className="font-medium text-(--color-text-primary)">
                    {booking.paymentStatus}
                  </p>
                </div>

                <div>
                  <p className="text-(--color-text-muted)">Total</p>
                  <p className="font-medium text-(--color-text-primary)">
                    {formatPrice(booking.totalAmountPence)}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <ButtonLink
                  href={`/account/bookings/${booking.bookingReference}`}
                >
                  View details
                </ButtonLink>

                <ButtonLink
                  href={`/booking/${booking.bookingReference}?token=${booking.bookingAccessToken}`}
                  variant="secondary"
                >
                  Public booking link
                </ButtonLink>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
