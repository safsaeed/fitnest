import { prisma } from "@/lib/prisma";
import { activateVenue, deactivateVenue } from "./actions";
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

type VenueStatusFilter = "all" | "active" | "inactive";

type AdminVenuesPageProps = {
  searchParams?: Promise<{
    search?: string;
    status?: VenueStatusFilter;
  }>;
};

export default async function AdminVenuesPage({
  searchParams,
}: AdminVenuesPageProps) {
  const query = await searchParams;
  const search = query?.search?.trim() ?? "";
  const status = query?.status ?? "all";

  const venues = await prisma.venue.findMany({
    where: {
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
  });

  const hasFilters = Boolean(search || status !== "all");

  return (
    <main className="min-h-(--min-page-height)">
      <section className="mx-auto max-w-5xl px-6 py-8">
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

        <form
          action="/admin/venues"
          method="GET"
          className="flex gap-1.5 sm:gap-3 mb-10 flex-col sm:flex-row sm:items-center"
        >
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

          <div className="flex flex-col">
            <label
              htmlFor="status"
              className="block text-sm font-medium text-(--color-text-secondary)"
            >
              Filter by status
            </label>

            <select
              id="status"
              name="status"
              defaultValue={status}
              className="mt-1 rounded-lg border border-(--color-brand-border) text-(--color-text-secondary) cursor-pointer bg-white px-3 py-1 text-sm h-9.5"
            >
              <option value="all">All</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>
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
              {hasFilters ? "No venues match your filters." : "No venues yet."}
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
