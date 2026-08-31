import { prisma } from "@/lib/prisma";
import { activateVenue, deactivateVenue, deleteVenue } from "./actions";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { Button, ButtonLink } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ArrowLeft, Search } from "lucide-react";
import {
  AdminList,
  AdminListCard,
  AdminListCardHeader,
} from "@/components/ui/admin-list";
import { InputField } from "@/components/ui/form-field";
import { Card } from "@/components/ui/card";
import { LoadingButtonLink } from "@/components/ui/loading-button-link";
import { Alert } from "@/components/ui/alert";
import {
  StatusViewNav,
  type StatusViewValue,
} from "@/components/ui/status-view-nav";
import type { Prisma } from "@prisma/client";

type VenueStatusFilter = "all" | "active" | "inactive";

function getStatusViewHref({
  status,
  search,
}: {
  status: VenueStatusFilter;
  search: string;
}) {
  const params = new URLSearchParams();

  if (status !== "active") {
    params.set("status", status);
  }

  if (search) {
    params.set("search", search);
  }

  const query = params.toString();
  return query ? `/admin/venues?${query}` : "/admin/venues";
}

type AdminVenuesPageProps = {
  searchParams?: Promise<{
    search?: string;
    status?: VenueStatusFilter;
    deleted?: string;
  }>;
};

export default async function AdminVenuesPage({
  searchParams,
}: AdminVenuesPageProps) {
  const query = await searchParams;
  const search = query?.search?.trim() ?? "";
  const requestedStatus = query?.status;
  const status: VenueStatusFilter =
    requestedStatus === "inactive" || requestedStatus === "all"
      ? requestedStatus
      : "active";

  const venueBaseWhere = {
    ...(search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              city: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              postcode: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  } satisfies Prisma.VenueWhereInput;

  const [venues, statusCounts] = await Promise.all([
    prisma.venue.findMany({
      where: {
        ...venueBaseWhere,
        ...(status === "active"
          ? { isActive: true }
          : status === "inactive"
            ? { isActive: false }
            : {}),
      },
      orderBy: [
        {
          isActive: "desc",
        },
        {
          name: "asc",
        },
      ],
      include: {
        _count: {
          select: {
            sessions: true,
          },
        },
      },
    }),
    prisma.venue.groupBy({
      by: ["isActive"],
      where: venueBaseWhere,
      _count: {
        _all: true,
      },
    }),
  ]);

  const activeVenueCount =
    statusCounts.find((count) => count.isActive)?._count._all ?? 0;
  const inactiveVenueCount =
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
      count: activeVenueCount,
      href: getStatusViewHref({ status: "active", search }),
    },
    {
      value: "inactive",
      label: "Inactive",
      count: inactiveVenueCount,
      href: getStatusViewHref({ status: "inactive", search }),
    },
    {
      value: "all",
      label: "All",
      count: activeVenueCount + inactiveVenueCount,
      href: getStatusViewHref({ status: "all", search }),
    },
  ];

  const hasFilters = Boolean(search || status !== "active");

  return (
    <main className="min-h-(--min-page-height)">
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="pt-0 sm:py-10">
          <Breadcrumbs
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Venues", href: "/admin/venues" },
            ]}
          />

          <h1 className="mt-3 text-3xl font-semibold">Admin | Venues</h1>

          <p className="mt-2 flex items-center gap-2 text-sm text-(--color-text-secondary)">
            Manage partner sports venues.
          </p>

          {query?.deleted === "true" ? (
            <Alert variant="success" className="mt-4">
              Venue deleted.
            </Alert>
          ) : null}

          <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6">
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

            <LoadingButtonLink variant="secondary" href="/admin/venues/new">
              Add new venue
            </LoadingButtonLink>
          </div>
        </div>

        <StatusViewNav
          ariaLabel="Venue status views"
          activeValue={status}
          items={statusViewItems}
        />

        <form
          action="/admin/venues"
          method="GET"
          className="flex gap-1.5 sm:gap-3 mb-10 flex-col sm:flex-row sm:items-center"
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
              label="Search venues"
              id="search"
              name="search"
              type="search"
              defaultValue={search}
              placeholder="Search by name, city or postcode"
              className="pl-9"
            />
          </div>

          <div className="self-end space-x-1.5 sm:space-x-3 mt-4 sm:mt-0">
            <Button type="submit">Search</Button>

            {hasFilters ? (
              <ButtonLink href="/admin/venues" variant="secondary">
                Clear
              </ButtonLink>
            ) : null}
          </div>
        </form>

        {hasFilters ? (
          <p className="mb-6 text-sm text-(--color-text-secondary)">
            Showing{" "}
            <span className="font-medium text-(--color-text-primary)">
              {status === "all" ? "all venues" : `${status} venues`}
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
            .
          </p>
        ) : null}

        <AdminList>
          {venues.length === 0 ? (
            <Card>
              {search
                ? `No ${status === "all" ? "venues" : `${status} venues`} match your search.`
                : status === "all"
                  ? "No venues yet."
                  : `No ${status} venues.`}
            </Card>
          ) : (
            venues.map((venue) => (
              <AdminListCard
                key={venue.id}
                className={venue.isActive ? "" : "border-(--color-danger)!"}
              >
                <AdminListCardHeader
                  title={venue.name}
                  subtitle={
                    <>
                      {venue.addressLine1 || venue.addressLine2 ? (
                        <p>
                          {venue.addressLine1 ?? ""}
                          {venue.addressLine1 && venue.addressLine2 ? ", " : ""}
                          {venue.addressLine2 ?? ""}
                        </p>
                      ) : null}

                      {venue.postcode || venue.city ? (
                        <p>
                          {venue.postcode ?? ""}{" "}
                          {venue.postcode && venue.city ? ", " : ""}
                          {venue.city ?? ""}
                        </p>
                      ) : null}

                      {venue.county || venue.country ? (
                        <p>
                          {venue.county ?? ""}{" "}
                          {venue.county && venue.country ? ", " : ""}
                          {venue.country ?? ""}
                        </p>
                      ) : null}

                      <p className="mt-3 font-medium text-(--color-text-primary)">
                        Sessions Available: {venue._count.sessions}
                      </p>
                    </>
                  }
                  badge={
                    <span
                      className={`rounded-md border px-2 py-px text-md font-medium ${
                        venue.isActive
                          ? "border-(--color-success-soft) bg-(--color-success-soft) text-(--color-success)"
                          : "border-(--color-danger) bg-(--color-danger-soft) text-(--color-danger)"
                      }`}
                    >
                      {venue.isActive ? "Active" : "Inactive"}
                    </span>
                  }
                  actions={
                    <>
                      <LoadingButtonLink
                        href={`/admin/venues/${venue.id}/edit`}
                        className="w-25"
                        variant="secondary"
                      >
                        Edit
                      </LoadingButtonLink>

                      {venue.isActive ? (
                        <ConfirmActionDialog
                          action={deactivateVenue.bind(null, venue.id)}
                          title="Deactivate this venue?"
                          description={`"${venue.name}" will no longer be active. Sessions linked to this venue may become unavailable to customers.`}
                          confirmLabel="Deactivate"
                        >
                          Deactivate
                        </ConfirmActionDialog>
                      ) : (
                        <ConfirmActionDialog
                          action={activateVenue.bind(null, venue.id)}
                          title="Activate this venue?"
                          description={`"${venue.name}" will become active again and can be used for booking flows.`}
                          confirmLabel="Activate"
                        >
                          Activate
                        </ConfirmActionDialog>
                      )}

                      {venue._count.sessions === 0 ? (
                        <ConfirmActionDialog
                          action={deleteVenue.bind(null, venue.id)}
                          title="Delete venue?"
                          description={
                            <div className="space-y-3">
                              <p className="font-medium text-(--color-text-primary)">
                                {venue.name}
                              </p>
                              <p>
                                This venue has no sessions and can be
                                permanently deleted.
                              </p>
                              <p>This action cannot be undone.</p>
                            </div>
                          }
                          confirmLabel="Delete venue"
                        >
                          Delete
                        </ConfirmActionDialog>
                      ) : (
                        <div className="flex flex-col items-start gap-1 relative">
                          <Button
                            type="button"
                            variant="destructive"
                            className="min-w-25"
                            disabled
                            title="Venues with sessions cannot be deleted."
                          >
                            Delete
                          </Button>
                          <span className="max-w-32 text-xs text-(--color-danger) absolute top-10 right-0">
                            {venue._count.sessions} session
                            {venue._count.sessions === 1 ? "" : "s"}
                          </span>
                        </div>
                      )}
                    </>
                  }
                />
              </AdminListCard>
            ))
          )}
        </AdminList>
      </section>
    </main>
  );
}
