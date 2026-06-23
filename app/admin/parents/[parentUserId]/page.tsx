import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { formatDate, formatDateTime, formatPrice } from "@/lib/formatters";

type AdminParentDetailPageProps = {
  params: Promise<{
    parentUserId: string;
  }>;
};

function formatNullableDate(date?: Date | null) {
  if (!date) {
    return "—";
  }

  return formatDate(date);
}

function getMembershipBadgeClass(status?: string | null) {
  if (status === "ACTIVE") {
    return "border-(--color-success-hover) bg-(--color-success-soft) text-(--color-success)";
  }

  if (status === "PAST_DUE" || status === "UNPAID") {
    return "border-(--color-danger-hover) bg-(--color-danger-soft) text-(--color-danger)";
  }

  if (status === "CANCELLED") {
    return "border-(--color-brand-border) bg-(--color-brand-soft) text-(--color-text-secondary)";
  }

  return "border-(--color-warning-hover) bg-(--color-warning-soft) text-(--color-warning)";
}

function getBookingBadgeClass(status: string) {
  if (status === "CONFIRMED") {
    return "border-(--color-success-hover) bg-(--color-success-soft) text-(--color-success)";
  }

  if (status === "PENDING") {
    return "border-(--color-warning-hover) bg-(--color-warning-soft) text-(--color-warning)";
  }

  return "border-(--color-danger-hover) bg-(--color-danger-soft) text-(--color-danger)";
}

function getMembershipLabel(status?: string | null) {
  if (!status) {
    return "No membership";
  }

  if (status === "ACTIVE") {
    return "Active";
  }

  if (status === "INCOMPLETE") {
    return "Incomplete";
  }

  if (status === "PAST_DUE") {
    return "Past due";
  }

  if (status === "UNPAID") {
    return "Unpaid";
  }

  if (status === "CANCELLED") {
    return "Cancelled";
  }

  return status;
}

function getPricingLabel(pricingType: string) {
  return pricingType === "MEMBER" ? "Member price" : "Standard price";
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="border-b border-gray-100 py-3 last:border-b-0">
      <p className="text-xs font-medium uppercase tracking-wide text-(--color-text-muted)">
        {label}
      </p>
      <div className="mt-1 text-sm text-(--color-text-primary)">{value}</div>
    </div>
  );
}

export default async function AdminParentDetailPage({
  params,
}: AdminParentDetailPageProps) {
  const { parentUserId } = await params;

  const parent = await prisma.parentUser.findUnique({
    where: {
      id: parentUserId,
    },
    include: {
      membership: true,
      children: {
        orderBy: {
          createdAt: "asc",
        },
      },
      bookings: {
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
        },
      },
    },
  });

  if (!parent) {
    notFound();
  }

  const activeChildren = parent.children.filter((child) => child.isActive);
  const inactiveChildren = parent.children.filter((child) => !child.isActive);

  return (
    <main className="min-h-(--min-page-height)">
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="pb-10 sm:py-10">
          <Breadcrumbs
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Parents", href: "/admin/parents" },
              { label: parent.name, href: `/admin/parents/${parent.id}` },
            ]}
          />

          <h1 className="mt-3 text-3xl font-semibold">{parent.name}</h1>

          <p className="mt-2 text-sm text-(--color-text-secondary)">
            Parent account, membership, saved children and account-linked
            bookings.
          </p>

          <ButtonLink
            href="/admin/parents"
            variant="ghost"
            size="custom"
            className="mt-6 p-0 text-sm text-(--color-brand) hover:bg-transparent hover:brightness-130"
          >
            <span className="flex items-center">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Parents
            </span>
          </ButtonLink>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="text-lg font-semibold">Parent details</h2>

            <div className="mt-4">
              <DetailRow label="Name" value={parent.name} />
              <DetailRow label="Email" value={parent.email} />
              <DetailRow label="Phone" value={parent.phone || "—"} />
              <DetailRow
                label="Active account"
                value={parent.isActive ? "Yes" : "No"}
              />
              <DetailRow
                label="Default emergency contact"
                value={parent.defaultEmergencyContactName || "—"}
              />
              <DetailRow
                label="Default emergency phone"
                value={parent.defaultEmergencyContactPhone || "—"}
              />
              <DetailRow
                label="Created"
                value={formatDateTime(parent.createdAt)}
              />
            </div>
          </Card>

          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="text-lg font-semibold">Membership</h2>

              <span
                className={`rounded-lg border px-2 py-1 text-xs font-medium ${getMembershipBadgeClass(
                  parent.membership?.status,
                )}`}
              >
                {getMembershipLabel(parent.membership?.status)}
              </span>
            </div>

            <div className="mt-4">
              <DetailRow
                label="Status"
                value={getMembershipLabel(parent.membership?.status)}
              />
              <DetailRow
                label="Stripe customer ID"
                value={parent.stripeCustomerId || "—"}
              />
              <DetailRow
                label="Stripe subscription ID"
                value={parent.membership?.stripeSubscriptionId || "—"}
              />
              <DetailRow
                label="Stripe price ID"
                value={parent.membership?.stripePriceId || "—"}
              />
              <DetailRow
                label="Current period start"
                value={formatNullableDate(
                  parent.membership?.currentPeriodStart,
                )}
              />
              <DetailRow
                label="Current period end"
                value={formatNullableDate(parent.membership?.currentPeriodEnd)}
              />
              <DetailRow
                label="Cancel at period end"
                value={parent.membership?.cancelAtPeriodEnd ? "Yes" : "No"}
              />
              <DetailRow
                label="Cancelled at"
                value={formatNullableDate(parent.membership?.cancelledAt)}
              />
            </div>
          </Card>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="text-lg font-semibold">Saved children</h2>

            <div className="mt-4 space-y-4">
              {activeChildren.length === 0 ? (
                <p className="text-sm text-(--color-text-secondary)">
                  No active saved children.
                </p>
              ) : (
                activeChildren.map((child) => (
                  <div
                    key={child.id}
                    className="rounded-lg border border-(--color-brand-border) bg-(--color-brand-soft) p-4"
                  >
                    <p className="font-medium">
                      {[child.firstName, child.lastName]
                        .filter(Boolean)
                        .join(" ")}
                    </p>

                    <p className="mt-1 text-sm text-(--color-text-secondary)">
                      Date of birth: {formatDate(child.dateOfBirth)}
                    </p>

                    <p className="mt-1 text-sm text-(--color-text-secondary)">
                      Allergies: {child.allergies || "—"}
                    </p>

                    <p className="mt-1 text-sm text-(--color-text-secondary)">
                      Medical notes: {child.medicalNotes || "—"}
                    </p>
                  </div>
                ))
              )}

              {inactiveChildren.length > 0 ? (
                <p className="text-xs text-(--color-text-muted)">
                  {inactiveChildren.length} inactive child profile
                  {inactiveChildren.length === 1 ? "" : "s"} hidden from this
                  list.
                </p>
              ) : null}
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold">Recent bookings</h2>

            <div className="mt-4 space-y-4">
              {parent.bookings.length === 0 ? (
                <p className="text-sm text-(--color-text-secondary)">
                  No account-linked bookings.
                </p>
              ) : (
                parent.bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="rounded-lg border border-(--color-brand-border) bg-(--color-brand-soft) p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-(--color-text-muted)">
                          {booking.bookingReference}
                        </p>

                        <p className="mt-1 font-medium">
                          {booking.session.title}
                        </p>

                        <p className="mt-1 text-sm text-(--color-text-secondary)">
                          {booking.session.venue.name}
                        </p>

                        <p className="mt-1 text-sm text-(--color-text-secondary)">
                          {formatDateTime(booking.session.startsAt)}
                        </p>
                      </div>

                      <span
                        className={`rounded-lg border px-2 py-1 text-xs font-medium ${getBookingBadgeClass(
                          booking.status,
                        )}`}
                      >
                        {booking.status}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                      <p>
                        <span className="text-(--color-text-muted)">Pricing:</span>{" "}
                        {getPricingLabel(booking.pricingType)}
                      </p>

                      <p>
                        <span className="text-(--color-text-muted)">Unit price:</span>{" "}
                        {formatPrice(booking.unitPricePence)}
                      </p>

                      <p>
                        <span className="text-(--color-text-muted)">Children:</span>{" "}
                        {booking.childCount}
                      </p>

                      <p>
                        <span className="text-(--color-text-muted)">Total:</span>{" "}
                        {formatPrice(booking.totalAmountPence)}
                      </p>

                      <p>
                        <span className="text-(--color-text-muted)">Payment:</span>{" "}
                        {booking.paymentStatus}
                      </p>

                      <p>
                        <span className="text-(--color-text-muted)">Refund:</span>{" "}
                        {booking.refundStatus}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <ButtonLink
                        href={`/admin/bookings/${booking.id}`}
                        variant="secondary"
                        size="sm"
                      >
                        View booking
                      </ButtonLink>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}
