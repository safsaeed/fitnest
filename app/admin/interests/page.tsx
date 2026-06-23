import { prisma } from "@/lib/prisma";
import type { VenueInterestStatus } from "@prisma/client";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { updateVenueInterestStatus } from "./actions";
import { formatDateTime } from "@/lib/formatters";
import { SubmitButton } from "@/components/ui/submit-button";

type AdminInterestsPageProps = {
  searchParams?: Promise<{
    status?: string;
  }>;
};

const statuses: Array<"all" | VenueInterestStatus> = [
  "all",
  "NEW",
  "REVIEWED",
  "CONTACTED",
  "ARCHIVED",
];

function getStatusBadgeClass(status: VenueInterestStatus) {
  if (status === "NEW") {
    return "bg-(--color-warning-soft) text-(--color-warning)";
  }

  if (status === "CONTACTED") {
    return "bg-(--color-success-soft) text-(--color-success)";
  }

  if (status === "ARCHIVED") {
    return "bg-(--color-danger-soft) text-(--color-danger)";
  }

  return "bg-gray-100 text-(--color-text-secondary)";
}

function formatStatus(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export default async function AdminInterestsPage({
  searchParams,
}: AdminInterestsPageProps) {
  const params = await searchParams;
  const selectedStatus = params?.status ?? "all";

  const statusFilter = statuses.includes(selectedStatus as never)
    ? selectedStatus
    : "all";

  const interests = await prisma.venueInterest.findMany({
    where:
      statusFilter === "all"
        ? {}
        : {
            status: statusFilter as VenueInterestStatus,
          },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="min-h-(--min-page-height)">
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="pt-0 sm:py-10">
          <Breadcrumbs
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Venue interest", href: "/admin/interests" },
            ]}
          />

          <h1 className="mt-3 text-3xl font-semibold">Admin | Interests</h1>

          <p className="mt-2 flex items-center gap-2 text-sm text-(--color-text-secondary)">
            Review venue suggestions submitted by parents.
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

            <form
              action="/admin/interests"
              method="GET"
              className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end"
            >
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
                  defaultValue={statusFilter}
                  className="mt-1 h-9.5 cursor-pointer rounded-lg border border-(--color-brand-border) bg-white px-3 py-1 text-sm text-(--color-text-secondary)"
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status === "all" ? "All" : formatStatus(status)}
                    </option>
                  ))}
                </select>
              </div>

              <Button type="submit">Apply</Button>
            </form>
          </div>
        </div>

        <div className="space-y-4">
          {interests.length === 0 ? (
            <Card>
              <p className="text-(--color-text-secondary)">
                No venue interest submissions found.
              </p>
            </Card>
          ) : (
            interests.map((interest) => (
              <Card key={interest.id} className="">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold">
                        {interest.venueName}
                      </h2>

                      <span
                        className={`rounded-md px-3 py-1 text-xs font-medium border ${getStatusBadgeClass(
                          interest.status,
                        )}`}
                      >
                        {formatStatus(interest.status)}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-(--color-text-secondary)">
                      {interest.city}
                    </p>

                    <p className="mt-1 text-sm text-(--color-text-secondary)">
                      {interest.parentEmail}
                    </p>

                    {interest.notes ? (
                      <p className="mt-4 rounded-lg bg-gray-50 py-2 px-3 text-sm text-(--color-text-secondary)">
                        {interest.notes}
                      </p>
                    ) : null}

                    <p className="mt-3 text-xs text-(--color-text-muted)">
                      Submitted {formatDateTime(interest.createdAt)}
                    </p>
                  </div>

                  <form
                    action={updateVenueInterestStatus.bind(null, interest.id)}
                    className="flex shrink-0 gap-2"
                  >
                    <select
                      name="status"
                      defaultValue={interest.status}
                      className=" rounded-md border border-(--color-brand-border) px-2 text-sm text-(--color-text-secondary)"
                    >
                      <option value="NEW">New</option>
                      <option value="REVIEWED">Reviewed</option>
                      <option value="CONTACTED">Contacted</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>

                    <SubmitButton variant="secondary" type="submit">
                      Update
                    </SubmitButton>
                  </form>
                </div>
              </Card>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
