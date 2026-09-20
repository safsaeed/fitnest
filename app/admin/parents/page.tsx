import { prisma } from "@/lib/prisma";
import { Button, ButtonLink } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { InputField } from "@/components/ui/form-field";
import { Card } from "@/components/ui/card";
import {
  AdminList,
  AdminListCard,
  AdminListCardHeader,
  AdminListMeta,
  AdminListMetaItem,
} from "@/components/ui/admin-list";
import { LoadingButtonLink } from "@/components/ui/loading-button-link";
import { ArrowLeft, Search } from "lucide-react";
import { formatPrice } from "@/lib/formatters";
import { getAccountDeletionStatusLabel } from "@/lib/account-deletion";

type AdminParentsPageProps = {
  searchParams?: Promise<{
    search?: string;
  }>;
};

export default async function AdminParentsPage({
  searchParams,
}: AdminParentsPageProps) {
  const query = await searchParams;
  const search = query?.search?.trim() ?? "";

  const parents = await prisma.parentUser.findMany({
    where: search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              email: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              phone: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }
      : undefined,
    include: {
      children: {
        where: {
          isActive: true,
        },
        select: {
          id: true,
        },
      },
      bookings: {
        select: {
          totalAmountPence: true,
          paymentStatus: true,
        },
      },
      deletionRequest: {
        select: {
          status: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalPaidRevenuePence = parents.reduce((total, parent) => {
    const parentPaidTotal = parent.bookings
      .filter((booking) => booking.paymentStatus === "PAID")
      .reduce((bookingTotal, booking) => {
        return bookingTotal + booking.totalAmountPence;
      }, 0);

    return total + parentPaidTotal;
  }, 0);

  return (
    <main className="min-h-(--min-page-height)">
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="pb-10 sm:py-10">
          <Breadcrumbs
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Parents", href: "/admin/parents" },
            ]}
          />

          <h1 className="mt-3 text-3xl font-semibold">Admin | Parents</h1>

          <p className="mt-2 text-sm text-(--color-text-secondary)">
            View parent accounts, saved children and linked bookings.
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
          <Card className="p-4 sm:p-4">
            <p className="text-sm text-(--color-text-secondary)">Parents</p>
            <p className="text-lg font-semibold text-(--color-brand)">
              {parents.length}
            </p>
          </Card>

          <Card className="p-4 sm:p-4">
            <p className="text-sm text-(--color-text-secondary)">
              Paid booking revenue
            </p>
            <p className="text-lg font-semibold text-(--color-brand)">
              {formatPrice(totalPaidRevenuePence)}
            </p>
          </Card>
        </div>

        <form
          action="/admin/parents"
          method="GET"
          className="mb-10 flex flex-row items-center gap-1.5 sm:gap-3"
        >
          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-8.5 h-4 w-4 text-(--color-text-muted)"
            />

            <InputField
              label="Search parents"
              id="search"
              name="search"
              type="search"
              defaultValue={search}
              placeholder="Search by name, email or phone"
              className="pl-9"
            />
          </div>

          <div className="self-end space-x-1.5 sm:space-x-3">
            <Button type="submit">Search</Button>

            {search ? (
              <ButtonLink href="/admin/parents" variant="secondary">
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
          {parents.length === 0 ? (
            <Card>
              {search
                ? "No parents match your search."
                : "No parent accounts yet."}
            </Card>
          ) : (
            parents.map((parent) => {
              const paidRevenuePence = parent.bookings
                .filter((booking) => booking.paymentStatus === "PAID")
                .reduce((total, booking) => {
                  return total + booking.totalAmountPence;
                }, 0);

              return (
                <AdminListCard key={parent.id}>
                  <AdminListCardHeader
                    title={parent.name}
                    subtitle={
                      <>
                        <p>
                          {parent.email}
                          {parent.phone ? ` · ${parent.phone}` : ""}
                        </p>
                        <p className="mt-1 text-xs text-(--color-text-muted)">
                          Created {parent.createdAt.toLocaleDateString("en-GB")}
                        </p>
                      </>
                    }
                    actions={
                      <LoadingButtonLink
                        href={`/admin/parents/${parent.id}`}
                        variant="secondary"
                      >
                        View parent
                      </LoadingButtonLink>
                    }
                  />

                  <AdminListMeta>
                    <AdminListMetaItem
                      label="Account status"
                      value={
                        parent.isActive
                          ? "Active"
                          : parent.deletionRequest
                            ? `Inactive · ${getAccountDeletionStatusLabel(parent.deletionRequest.status)}`
                            : "Inactive"
                      }
                    />
                    <AdminListMetaItem
                      label="Saved children"
                      value={parent.children.length}
                    />
                    <AdminListMetaItem
                      label="Bookings"
                      value={parent.bookings.length}
                    />
                    <AdminListMetaItem
                      label="Paid booking revenue"
                      value={formatPrice(paidRevenuePence)}
                    />
                  </AdminListMeta>
                </AdminListCard>
              );
            })
          )}
        </AdminList>
      </section>
    </main>
  );
}
