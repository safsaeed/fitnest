import type { AccountDeletionRequestStatus } from "@prisma/client";
import { ArrowLeft } from "lucide-react";
import {
  ACCOUNT_DELETION_REQUEST_STATUSES,
  getAccountDeletionStatusLabel,
} from "@/lib/account-deletion";
import { formatDateTime } from "@/lib/formatters";
import { prisma } from "@/lib/prisma";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TextareaField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { updateAccountDeletionRequest } from "./actions";

type AdminAccountDeletionRequestsPageProps = {
  searchParams?: Promise<{
    status?: string;
  }>;
};

const filters = ["all", ...ACCOUNT_DELETION_REQUEST_STATUSES] as const;

function getStatusBadgeClass(status: AccountDeletionRequestStatus) {
  if (status === "PENDING") {
    return "bg-(--color-warning-soft) text-(--color-warning)";
  }

  if (status === "IN_REVIEW") {
    return "bg-(--color-brand-soft) text-(--color-brand)";
  }

  if (status === "COMPLETED") {
    return "bg-(--color-success-soft) text-(--color-success)";
  }

  if (status === "DECLINED") {
    return "bg-(--color-danger-soft) text-(--color-danger)";
  }

  return "bg-gray-100 text-(--color-text-secondary)";
}

export default async function AdminAccountDeletionRequestsPage({
  searchParams,
}: AdminAccountDeletionRequestsPageProps) {
  const params = await searchParams;
  const requestedFilter = params?.status ?? "all";
  const selectedStatus = filters.includes(requestedFilter as never)
    ? requestedFilter
    : "all";
  const now = new Date();

  const [requests, openRequestCount] = await Promise.all([
    prisma.accountDeletionRequest.findMany({
      where:
        selectedStatus === "all"
          ? undefined
          : {
              status: selectedStatus as AccountDeletionRequestStatus,
            },
      include: {
        parentUser: {
          select: {
            id: true,
            isActive: true,
          },
        },
      },
      orderBy: [{ requestedAt: "desc" }],
    }),
    prisma.accountDeletionRequest.count({
      where: {
        status: {
          in: ["PENDING", "IN_REVIEW"],
        },
      },
    }),
  ]);

  return (
    <main className="min-h-(--min-page-height)">
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="pb-10 sm:py-10">
          <Breadcrumbs
            items={[
              { label: "Dashboard", href: "/admin" },
              {
                label: "Deletion requests",
                href: "/admin/account-deletion-requests",
              },
            ]}
          />

          <h1 className="mt-3 text-3xl font-semibold">
            Admin | Account deletion requests
          </h1>
          <p className="mt-2 text-sm text-(--color-text-secondary)">
            Track privacy requests, their response deadline, and the outcome of
            your data review.
          </p>

          <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <ButtonLink
              href="/admin"
              variant="ghost"
              size="custom"
              className="self-start p-0 text-sm hover:bg-transparent hover:brightness-130"
            >
              <span className="flex items-center">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to Dashboard
              </span>
            </ButtonLink>

            <form
              action="/admin/account-deletion-requests"
              method="GET"
              className="flex items-end gap-3"
            >
              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-(--color-text-secondary)"
                >
                  Filter by status
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={selectedStatus}
                  className="mt-1 h-9.5 rounded-lg border border-(--color-brand-border) bg-white px-3 text-sm"
                >
                  <option value="all">All</option>
                  {ACCOUNT_DELETION_REQUEST_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {getAccountDeletionStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit">Apply</Button>
            </form>
          </div>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <Card className="p-4 sm:p-4" interactive={false}>
            <p className="text-sm text-(--color-text-secondary)">
              Open requests
            </p>
            <p className="text-lg font-semibold text-(--color-warning)">
              {openRequestCount}
            </p>
          </Card>
          <Card className="p-4 sm:p-4" interactive={false}>
            <p className="text-sm text-(--color-text-secondary)">
              Showing
            </p>
            <p className="text-lg font-semibold text-(--color-brand)">
              {requests.length}
            </p>
          </Card>
        </div>

        <div className="space-y-4">
          {requests.length === 0 ? (
            <Card interactive={false}>
              <p className="text-(--color-text-secondary)">
                No account deletion requests found.
              </p>
            </Card>
          ) : (
            requests.map((request) => {
              const isOpen =
                request.status === "PENDING" ||
                request.status === "IN_REVIEW";
              const isOverdue = isOpen && request.responseDueAt < now;

              return (
                <Card key={request.id} interactive={false}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold">
                          {request.requesterName}
                        </h2>
                        <span
                          className={`rounded-md border px-3 py-1 text-xs font-medium ${getStatusBadgeClass(request.status)}`}
                        >
                          {getAccountDeletionStatusLabel(request.status)}
                        </span>
                        {isOverdue ? (
                          <span className="rounded-md border border-(--color-danger-hover) bg-(--color-danger-soft) px-3 py-1 text-xs font-medium text-(--color-danger)">
                            Overdue
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-2 text-sm text-(--color-text-secondary)">
                        {request.requesterEmail}
                      </p>
                      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-(--color-text-muted)">
                            Requested
                          </dt>
                          <dd className="mt-1">
                            {formatDateTime(request.requestedAt)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-(--color-text-muted)">
                            Response due
                          </dt>
                          <dd
                            className={`mt-1 ${isOverdue ? "font-semibold text-(--color-danger)" : ""}`}
                          >
                            {formatDateTime(request.responseDueAt)}
                          </dd>
                        </div>
                      </dl>

                      {request.parentUser ? (
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <ButtonLink
                            href={`/admin/parents/${request.parentUser.id}`}
                            variant="secondary"
                            size="sm"
                          >
                            View parent
                          </ButtonLink>
                          <span className="text-xs text-(--color-text-muted)">
                            Account is {request.parentUser.isActive ? "active" : "inactive"}
                          </span>
                        </div>
                      ) : (
                        <p className="mt-4 text-xs text-(--color-text-muted)">
                          The parent account record is no longer linked.
                        </p>
                      )}
                    </div>

                    <form
                      action={updateAccountDeletionRequest.bind(
                        null,
                        request.id,
                      )}
                      className="w-full space-y-3 lg:max-w-md"
                    >
                      <div>
                        <label
                          htmlFor={`status-${request.id}`}
                          className="block text-sm font-medium text-(--color-text-secondary)"
                        >
                          Request status
                        </label>
                        <select
                          id={`status-${request.id}`}
                          name="status"
                          defaultValue={request.status}
                          className="mt-1 w-full rounded-lg border border-(--color-brand-border) bg-white px-3 py-2 text-sm"
                        >
                          {ACCOUNT_DELETION_REQUEST_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {getAccountDeletionStatusLabel(status)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <TextareaField
                        label="Internal resolution notes"
                        name="resolutionNotes"
                        rows={3}
                        maxLength={2_000}
                        defaultValue={request.resolutionNotes ?? ""}
                        hint="Record what was deleted, retained, or why the request could not be completed."
                      />

                      <SubmitButton variant="secondary">
                        Save request
                      </SubmitButton>
                    </form>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}
