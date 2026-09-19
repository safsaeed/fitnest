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
import { Alert } from "@/components/ui/alert";
import {
  StatusViewNav,
  type StatusViewValue,
} from "@/components/ui/status-view-nav";
import {
  getBookingPaymentBadgeClass,
  getBookingPaymentDisplay,
} from "@/lib/booking-payment";
import type { Prisma } from "@prisma/client";

type BookingStatusFilter = "confirmed" | "pending" | "closed" | "all";

type AdminBookingsPageProps = {
  searchParams?: Promise<{
    search?: string;
    status?: BookingStatusFilter;
  }>;
};

function getStatusWhere(status: BookingStatusFilter): Prisma.BookingWhereInput {
  if (status === "confirmed") {
    return { status: "CONFIRMED" };
  }

  if (status === "pending") {
    return { status: "PENDING" };
  }

  if (status === "closed") {
    return { status: { in: ["CANCELLED", "REFUNDED"] } };
  }

  return {};
}

function getStatusViewHref({
  status,
  search,
}: {
  status: BookingStatusFilter;
  search: string;
}) {
  const params = new URLSearchParams();

  if (status !== "confirmed") {
    params.set("status", status);
  }

  if (search) {
    params.set("search", search);
  }

  const query = params.toString();
  return query ? `/admin/bookings?${query}` : "/admin/bookings";
}

function getBookingSourceLabel(parentUserId: string | null) {
  return parentUserId ? "Account" : "Guest";
}

export default async function AdminBookingsPage({
  searchParams,
}: AdminBookingsPageProps) {
  const query = await searchParams;
  const search = query?.search?.trim() ?? "";
  const requestedStatus = query?.status;
  const status: BookingStatusFilter =
    requestedStatus === "pending" ||
    requestedStatus === "closed" ||
    requestedStatus === "all"
      ? requestedStatus
      : "confirmed";

  const bookingBaseWhere = {
    ...(search
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
      : {}),
  } satisfies Prisma.BookingWhereInput;

  const [bookings, confirmedCount, pendingCount, closedCount, allCount] =
    await Promise.all([
      prisma.booking.findMany({
        where: {
          ...bookingBaseWhere,
          ...getStatusWhere(status),
        },
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
          parentUser: true,
        },
      }),
      prisma.booking.count({
        where: { ...bookingBaseWhere, ...getStatusWhere("confirmed") },
      }),
      prisma.booking.count({
        where: { ...bookingBaseWhere, ...getStatusWhere("pending") },
      }),
      prisma.booking.count({
        where: { ...bookingBaseWhere, ...getStatusWhere("closed") },
      }),
      prisma.booking.count({ where: bookingBaseWhere }),
    ]);

  const statusViewItems: Array<{
    value: StatusViewValue;
    label: string;
    count: number;
    href: string;
  }> = [
    {
      value: "confirmed",
      label: "Confirmed",
      count: confirmedCount,
      href: getStatusViewHref({ status: "confirmed", search }),
    },
    {
      value: "pending",
      label: "Awaiting payment",
      count: pendingCount,
      href: getStatusViewHref({ status: "pending", search }),
    },
    {
      value: "closed",
      label: "Closed",
      count: closedCount,
      href: getStatusViewHref({ status: "closed", search }),
    },
    {
      value: "all",
      label: "All",
      count: allCount,
      href: getStatusViewHref({ status: "all", search }),
    },
  ];

  const totalRevenuePence = bookings
    .filter((booking) => booking.paymentStatus === "PAID")
    .reduce((total, booking) => total + booking.totalAmountPence, 0);

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

        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <Card className="sm:py-4 sm:px-4">
            <p className="text-sm text-(--color-text-secondary)">
              Bookings in this view
            </p>
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

          <Card className="sm:col-span-2 sm:px-4 sm:py-4">
            <p className="text-sm text-(--color-text-secondary)">
              Paid revenue in this view
            </p>
            <p className="text-lg font-semibold text-(--color-brand)">
              {formatPrice(totalRevenuePence)}
            </p>
          </Card>
        </div>

        <StatusViewNav
          ariaLabel="Booking status views"
          activeValue={status}
          items={statusViewItems}
        />

        {status === "pending" ? (
          <Alert className="mb-6">
            <p className="font-semibold">These bookings are not confirmed</p>
            <p className="mt-1">
              They do not count towards the session register or capacity. New
              payment windows close automatically after about 30 minutes; use the
              booking detail page to close an older incomplete payment.
            </p>
          </Alert>
        ) : null}

        <form
          action="/admin/bookings"
          method="GET"
          className="flex gap-1.5 sm:gap-3 mb-10 flex-row items-center"
        >
          {status !== "confirmed" ? (
            <input type="hidden" name="status" value={status} />
          ) : null}

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
              <ButtonLink
                href={getStatusViewHref({ status, search: "" })}
                variant="secondary"
              >
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
            bookings.map((booking) => {
              const display = getBookingPaymentDisplay(booking);

              return (
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
                      className={`rounded-md border px-2 py-1 text-xs ${getBookingPaymentBadgeClass(display.tone)}`}
                    >
                      {display.label}
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
                    value={
                      booking.paymentStatus === "PAID"
                        ? "Paid"
                        : booking.paymentStatus === "REFUNDED"
                          ? "Refunded"
                          : "Not paid"
                    }
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
              );
            })
          )}
        </AdminList>
      </section>
    </main>
  );
}
