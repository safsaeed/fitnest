import { prisma } from "@/lib/prisma";
import { Button, ButtonLink } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ArrowLeft, Search } from "lucide-react";
import {
  AdminList,
  AdminListCard,
  AdminListCardHeader,
  AdminListMeta,
  AdminListMetaItem,
} from "@/components/ui/admin-list";
import { InputField } from "@/components/ui/form-field";
import { Card } from "@/components/ui/card";
import { formatDateTime, formatPrice } from "@/lib/formatters";
import { LoadingButtonLink } from "@/components/ui/loading-button-link";

type AdminBookingsPageProps = {
  searchParams?: Promise<{
    search?: string;
  }>;
};

function getPricingLabel(pricingType: string) {
  return pricingType === "MEMBER" ? "Member price" : "Standard price";
}

function getBookingSourceLabel(parentUserId: string | null) {
  return parentUserId ? "Account" : "Guest";
}

export default async function AdminBookingsPage({
  searchParams,
}: AdminBookingsPageProps) {
  const query = await searchParams;
  const search = query?.search?.trim() ?? "";

  const bookings = await prisma.booking.findMany({
    where: search
      ? {
          OR: [
            {
              bookingReference: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              parentEmail: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              parentName: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              parentUser: {
                email: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
            {
              parentUser: {
                name: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
          ],
        }
      : undefined,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      session: {
        include: {
          venue: true,
        },
      },
      children: true,
      parentUser: {
        include: {
          membership: true,
        },
      },
    },
  });

  const totalRevenuePence = bookings
    .filter((booking) => booking.paymentStatus === "PAID")
    .reduce((total, booking) => total + booking.totalAmountPence, 0);

  const memberPricedBookingCount = bookings.filter(
    (booking) => booking.pricingType === "MEMBER",
  ).length;

  const accountBookingCount = bookings.filter(
    (booking) => booking.parentUserId,
  ).length;

  return (
    <main className="min-h-(--min-page-height)">
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="pb-10 sm:py-10">
          <Breadcrumbs
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Bookings", href: "/admin/bookings" },
            ]}
          />

          <h1 className="mt-3 text-3xl font-semibold">Admin | Bookings</h1>

          <p className="mt-2 flex items-center gap-2 text-sm text-(--color-text-secondary)">
            View parent bookings, payments and children attending sessions.
          </p>

          <ButtonLink
            href="/admin"
            variant="ghost"
            size="custom"
            className="mt-6 p-0 text-sm text-(--color-brand) hover:bg-transparent hover:brightness-130"
          >
            <span className="flex items-center">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Dashboard
            </span>
          </ButtonLink>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card className="sm:py-4 sm:px-4">
            <p className="text-sm text-(--color-text-secondary)">Bookings</p>
            <p className="text-lg font-semibold text-(--color-brand)">
              {bookings.length}
            </p>
          </Card>

          <Card className="sm:py-4 sm:px-4">
            <p className="text-sm text-(--color-text-secondary)">
              Account bookings
            </p>
            <p className="text-lg font-semibold text-(--color-brand)">
              {accountBookingCount}
            </p>
          </Card>

          <Card className="sm:py-4 sm:px-4">
            <p className="text-sm text-(--color-text-secondary)">
              Member-priced bookings
            </p>
            <p className="text-lg font-semibold text-(--color-brand)">
              {memberPricedBookingCount}
            </p>
          </Card>

          <Card className="sm:py-4 sm:px-4 sm:col-span-3">
            <p className="text-sm text-(--color-text-secondary)">
              Paid revenue in this view
            </p>
            <p className="text-lg font-semibold text-(--color-brand)">
              {formatPrice(totalRevenuePence)}
            </p>
          </Card>
        </div>

        <form
          action="/admin/bookings"
          method="GET"
          className="flex gap-1.5 sm:gap-3 mb-10 flex-row items-center"
        >
          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-8.5 h-4 w-4 text-(--color-text-muted)"
            />

            <InputField
              label="Search bookings"
              id="search"
              name="search"
              type="search"
              defaultValue={search}
              placeholder="Search by reference, parent name or email"
              className="pl-9"
            />
          </div>

          <div className="self-end space-x-1.5 sm:space-x-3">
            <Button type="submit">Search</Button>

            {search ? (
              <ButtonLink href="/admin/bookings" variant="secondary">
                Clear
              </ButtonLink>
            ) : null}
          </div>
        </form>

        {search ? (
          <p className="mb-6 text-sm text-(--color-text-secondary)">
            Showing results for{" "}
            <span className="font-medium text-(--color-text-primary)">
              “{search}”
            </span>
            .
          </p>
        ) : null}

        <AdminList>
          {bookings.length === 0 ? (
            <Card>
              {search ? "No bookings match your search." : "No bookings yet."}
            </Card>
          ) : (
            bookings.map((booking) => (
              <AdminListCard key={booking.id}>
                <AdminListCardHeader
                  title={booking.bookingReference}
                  subtitle={
                    <>
                      {booking.parentName}
                      <span className="mx-2">-</span>
                      {booking.parentEmail}
                    </>
                  }
                  badge={
                    <span
                      className={`rounded-md px-2 py-1 text-xs ${
                        booking.status === "CONFIRMED"
                          ? "bg-(--color-success-soft) text-(--color-success)"
                          : booking.status === "PENDING"
                            ? "bg-(--color-warning-soft) text-(--color-warning)"
                            : "bg-(--color-danger-soft) text-(--color-danger)"
                      }`}
                    >
                      {booking.status}
                    </span>
                  }
                  actions={
                    <LoadingButtonLink
                      href={`/admin/bookings/${booking.id}`}
                      className="w-25"
                      variant="secondary"
                    >
                      View
                    </LoadingButtonLink>
                  }
                />

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700">
                    {getBookingSourceLabel(booking.parentUserId)} booking
                  </span>

                  <span
                    className={`rounded-md border px-2 py-1 text-xs font-medium ${
                      booking.pricingType === "MEMBER"
                        ? "border-green-200 bg-green-50 text-green-800"
                        : "border-gray-200 bg-gray-50 text-gray-700"
                    }`}
                  >
                    {getPricingLabel(booking.pricingType)}
                  </span>

                  {booking.parentUser?.membership ? (
                    <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-800">
                      Membership: {booking.parentUser.membership.status}
                    </span>
                  ) : null}
                </div>

                <AdminListMeta>
                  <AdminListMetaItem
                    label={booking.session.venue.name}
                    value={booking.session.title}
                  />

                  <AdminListMetaItem
                    label="Date"
                    value={formatDateTime(booking.session.startsAt)}
                  />

                  <AdminListMetaItem
                    label="Children"
                    value={booking.childCount}
                  />

                  <AdminListMetaItem
                    label="Unit price"
                    value={formatPrice(booking.unitPricePence)}
                  />

                  <AdminListMetaItem
                    label="Total"
                    value={<div>{formatPrice(booking.totalAmountPence)}</div>}
                  />

                  <AdminListMetaItem
                    label="Payment"
                    value={booking.paymentStatus}
                  />
                </AdminListMeta>

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
              </AdminListCard>
            ))
          )}
        </AdminList>
      </section>
    </main>
  );
}
