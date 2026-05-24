import { prisma } from "@/lib/prisma";
import { activateSession, deactivateSession } from "./actions";
import { Button, ButtonLink } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { InputField } from "@/components/ui/form-field";
import {
  AdminList,
  AdminListCard,
  AdminListCardHeader,
  AdminListMeta,
  AdminListMetaItem,
} from "@/components/ui/admin-list";
import { ArrowLeft, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getBookedChildrenCount } from "@/lib/availability";
import { formatDateTime, formatPrice } from "@/lib/formatters";
import { LoadingButtonLink } from "@/components/ui/loading-button-link";

type SessionStatusFilter = "all" | "active" | "inactive";
type SessionTimeFilter = "upcoming" | "past" | "all";

type AdminSessionsPageProps = {
  searchParams?: Promise<{
    search?: string;
    status?: SessionStatusFilter;
    time?: SessionTimeFilter;
  }>;
};

export default async function AdminSessionsPage({
  searchParams,
}: AdminSessionsPageProps) {
  const query = await searchParams;

  const search = query?.search?.trim() ?? "";
  const status = query?.status ?? "all";
  const time = query?.time ?? "upcoming";

  const now = new Date();

  const sessions = await prisma.session.findMany({
    where: {
      ...(search
        ? {
            OR: [
              {
                title: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                description: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                venue: {
                  name: {
                    contains: search,
                    mode: "insensitive",
                  },
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

      ...(time === "upcoming"
        ? {
            startsAt: {
              gt: now,
            },
          }
        : time === "past"
          ? {
              startsAt: {
                lt: now,
              },
            }
          : {}),
    },
    orderBy: {
      startsAt: "asc",
    },
    include: {
      venue: true,
      bookings: {
        where: {
          status: "CONFIRMED",
        },
        select: {
          childCount: true,
        },
      },
    },
  });

  const hasFilters = Boolean(search || status !== "all" || time !== "upcoming");

  return (
    <main className="min-h-(--min-page-height)">
      <section className="mx-auto max-w-5xl px-6 py-8">
        <div className="pt-0 sm:py-10">
          <Breadcrumbs
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Sessions", href: "/admin/sessions" },
            ]}
          />

          <h1 className="mt-3 text-3xl font-semibold">Admin | Sessions</h1>

          <p className="mt-2 flex items-center gap-2 text-sm text-(--color-text-secondary)">
            Manage session dates, capacity and pricing.
          </p>

          <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
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

            <LoadingButtonLink variant="secondary" href="/admin/sessions/new">
              Add new session
            </LoadingButtonLink>
          </div>
        </div>

        <form
          action="/admin/sessions"
          method="GET"
          className="mb-10 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3"
        >
          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-8.5 h-4 w-4 text-(--color-text-muted)"
            />

            <InputField
              label="Search sessions"
              id="search"
              name="search"
              type="search"
              defaultValue={search}
              placeholder="Search by title, description or venue"
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
              className="mt-1 h-9.5 cursor-pointer rounded-lg border border-(--color-brand-border) bg-white px-3 py-1 text-sm text-(--color-text-secondary)"
            >
              <option value="all">All</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label
              htmlFor="time"
              className="block text-sm font-medium text-(--color-text-secondary)"
            >
              Filter by date
            </label>

            <select
              id="time"
              name="time"
              defaultValue={time}
              className="mt-1 h-9.5 cursor-pointer rounded-lg border border-(--color-brand-border) bg-white px-3 py-1 text-sm text-(--color-text-secondary)"
            >
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
              <option value="all">All dates</option>
            </select>
          </div>

          <div className="self-end mt-4 space-x-1.5 sm:mt-0 sm:space-x-3">
            <Button type="submit">Search</Button>

            {hasFilters ? (
              <ButtonLink href="/admin/sessions" variant="secondary">
                Clear
              </ButtonLink>
            ) : null}
          </div>
        </form>

        {hasFilters ? (
          <p className="mb-6 text-sm text-(--color-text-secondary)">
            Showing{" "}
            <span className="font-medium text-(--color-text-primary)">
              {status === "all" ? "all sessions" : `${status} sessions`}
            </span>{" "}
            for{" "}
            <span className="font-medium text-(--color-text-primary)">
              {time === "all" ? "all dates" : time}
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
          {sessions.length === 0 ? (
            <Card>
              {hasFilters
                ? "No sessions match your filters."
                : "No sessions yet."}
            </Card>
          ) : (
            sessions.map((session) => {
              const bookedChildren = getBookedChildrenCount(session.bookings);

              return (
                <AdminListCard
                  key={session.id}
                  className={session.isActive ? "" : "border-(--color-danger)!"}
                >
                  <AdminListCardHeader
                    title={session.title}
                    subtitle={session.venue.name}
                    badge={
                      <span
                        className={`rounded-md border px-2 py-px text-md font-medium ${
                          session.isActive
                            ? "border-(--color-success-soft) bg-(--color-success-soft) text-(--color-success)"
                            : "border-(--color-danger) bg-(--color-danger-soft) text-(--color-danger)"
                        }`}
                      >
                        {session.isActive ? "Active" : "Inactive"}
                      </span>
                    }
                    actions={
                      <>
                        <LoadingButtonLink
                          href={`/admin/sessions/${session.id}/register`}
                          className="w-24"
                        >
                          Register
                        </LoadingButtonLink>

                        <LoadingButtonLink
                          href={`/admin/sessions/${session.id}/edit`}
                          variant="secondary"
                          className="w-24"
                        >
                          Edit
                        </LoadingButtonLink>

                        {session.isActive ? (
                          <ConfirmActionDialog
                            action={deactivateSession.bind(null, session.id)}
                            title="Deactivate this session?"
                            description={`Customers will no longer be able to book "${session.title}" while it is inactive.`}
                            confirmLabel="Deactivate"
                          >
                            Deactivate
                          </ConfirmActionDialog>
                        ) : (
                          <ConfirmActionDialog
                            action={activateSession.bind(null, session.id)}
                            title="Activate this session?"
                            description={`Customers will be able to book "${session.title}" again if it has availability.`}
                            confirmLabel="Activate"
                          >
                            Activate
                          </ConfirmActionDialog>
                        )}
                      </>
                    }
                  />

                  <AdminListMeta>
                    <AdminListMetaItem
                      label="Date/ Time"
                      value={
                        <>
                          <p>{formatDateTime(session.startsAt)}</p>
                          <p className="text-xs text-(--color-text-secondary)">
                            {formatDateTime(session.endsAt)}
                          </p>
                        </>
                      }
                    />
                    <AdminListMetaItem
                      label="Ages"
                      value={`${session.minAge !== null ? session.minAge : "—"}–
                      ${session.maxAge !== null ? session.maxAge : "—"}`}
                    />
                    <AdminListMetaItem
                      label="Booked"
                      value={`${bookedChildren} / ${session.capacity}`}
                    />
                    <AdminListMetaItem
                      label="Price"
                      value={formatPrice(session.pricePence)}
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
