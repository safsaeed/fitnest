import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getParentSession } from "@/lib/parent-auth";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

type AccountMembershipPageProps = {
  searchParams?: Promise<{
    status?: string;
  }>;
};

type MembershipNotice = {
  type: "success" | "warning" | "error";
  message: string;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
  }).format(date);
}

function getMembershipStatusLabel(status?: string | null) {
  if (!status) {
    return "No active membership";
  }

  if (status === "ACTIVE") {
    return "Active";
  }

  if (status === "INCOMPLETE") {
    return "Payment not completed";
  }

  if (status === "PAST_DUE") {
    return "Payment issue";
  }

  if (status === "CANCELLED") {
    return "Cancelled";
  }

  if (status === "UNPAID") {
    return "Unpaid";
  }

  return status;
}

function getNotice(status?: string): MembershipNotice | null {
  if (status === "checkout-success") {
    return {
      type: "success",
      message:
        "Membership checkout completed. Your membership status will update shortly once payment is confirmed.",
    };
  }

  if (status === "checkout-cancelled") {
    return {
      type: "warning",
      message: "Membership checkout was cancelled. You have not been charged.",
    };
  }

  if (status === "checkout-error") {
    return {
      type: "error",
      message: "Could not start membership checkout. Please try again.",
    };
  }

  if (status === "already-active") {
    return {
      type: "warning",
      message: "Your membership is already active.",
    };
  }

  if (status === "no-stripe-customer") {
    return {
      type: "warning",
      message:
        "We could not open billing management because no Stripe customer exists for this account yet.",
    };
  }

  if (status === "portal-return") {
    return {
      type: "warning",
      message:
        "You have returned from billing management. Any membership changes will update shortly.",
    };
  }

  return null;
}

export default async function AccountMembershipPage({
  searchParams,
}: AccountMembershipPageProps) {
  const session = await getParentSession();

  if (!session) {
    redirect("/account/login");
  }

  const query = await searchParams;

  const parentUser = await prisma.parentUser.findFirst({
    where: {
      id: session.parentUserId,
      isActive: true,
    },
    include: {
      membership: true,
    },
  });

  if (!parentUser) {
    redirect("/account/login");
  }

  const notice = getNotice(query?.status);
  const membership = parentUser.membership;
  const isActive = membership?.status === "ACTIVE";
  const hasStripeCustomer = Boolean(parentUser.stripeCustomerId);

  const canStartMembership =
    !isActive &&
    membership?.status !== "PAST_DUE" &&
    membership?.status !== "UNPAID";

  const canManageMembership = hasStripeCustomer && Boolean(membership);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Membership"
        description="Become a member for £10/month and get discounted session prices for all children on your account."
      />

      {notice && (
        <Alert variant={notice.type}>
          {notice.message}
        </Alert>
      )}

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">
              Current membership
            </h2>

            <p className="mt-2 text-sm text-(--color-text-secondary)">
              Status:{" "}
              <span className="font-medium text-(--color-text-primary)">
                {getMembershipStatusLabel(membership?.status)}
              </span>
            </p>

            {membership?.currentPeriodEnd && (
              <p className="mt-1 text-sm text-(--color-text-secondary)">
                Current period ends: {formatDate(membership.currentPeriodEnd)}
              </p>
            )}

            {membership?.cancelAtPeriodEnd &&
              membership.status === "ACTIVE" && (
                <Alert variant="warning" className="mt-2">
                  Your membership is scheduled to cancel. You will keep member
                  benefits until the end of your current paid period.
                </Alert>
              )}

            {membership?.status === "PAST_DUE" && (
                <Alert variant="error" className="mt-2">
                Your membership payment failed. Member pricing is unavailable
                until payment is resolved. Open billing management to update
                your payment method.
                </Alert>
            )}

            {membership?.status === "UNPAID" && (
                <Alert variant="error" className="mt-2">
                Your membership is unpaid. Member pricing is unavailable until
                billing is resolved.
                </Alert>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:items-end">
            {isActive ? (
              <Button
                type="button"
                disabled
                variant="secondary"
              >
                Membership active
              </Button>
            ) : canStartMembership ? (
              <form action="/api/membership/checkout" method="POST">
                <Button type="submit">
                  Start membership
                </Button>
              </form>
            ) : null}

            {canManageMembership ? (
              <form action="/api/membership/portal" method="POST">
                <Button type="submit" variant="secondary">
                  Manage billing
                </Button>
              </form>
            ) : null}
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">
          Membership benefits
        </h2>

        <ul className="mt-4 space-y-2 text-sm text-(--color-text-secondary)">
          <li>• £10/month membership.</li>
          <li>• Discounted prices on sessions with member pricing.</li>
          <li>• Discount applies to all children saved on your account.</li>
          <li>
            • Cancel any time and keep benefits until the paid period ends.
          </li>
          <li>
            • If payment fails, member pricing stops until payment is resolved.
          </li>
        </ul>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">
          How member pricing works
        </h2>

        <p className="mt-2 text-sm text-(--color-text-secondary)">
          When your membership is active, checkout automatically applies the
          member price to sessions that have a member price set. If a session
          does not have a member price, the standard price applies.
        </p>

        <p className="mt-2 text-sm text-(--color-text-secondary)">
          The discount is calculated securely during checkout, so the price
          shown at payment is the price recorded on your booking.
        </p>
      </Card>
    </div>
  );
}
