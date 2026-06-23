import type { Membership, Session } from "@prisma/client";

type SessionForPricing = Pick<Session, "pricePence" | "memberPricePence">;

type MembershipForPricing = Pick<
  Membership,
  "status" | "currentPeriodEnd" | "cancelAtPeriodEnd"
> | null;

export type BookingPriceSummary = {
  pricingType: "STANDARD" | "MEMBER";
  unitPricePence: number;
  childCount: number;
  totalAmountPence: number;
  label: string;
};

export function hasActiveMembership(membership: MembershipForPricing) {
  if (!membership) {
    return false;
  }

  if (membership.status !== "ACTIVE") {
    return false;
  }

  /*
    If cancellation is scheduled but the status is still ACTIVE,
    the parent should continue receiving member benefits until
    Stripe ends the subscription at the period end.
  */
  return true;
}

export function calculateBookingPrice({
  session,
  membership,
  childCount,
}: {
  session: SessionForPricing;
  membership: MembershipForPricing;
  childCount: number;
}): BookingPriceSummary {
  const canUseMemberPrice =
    hasActiveMembership(membership) && session.memberPricePence !== null;

  const pricingType = canUseMemberPrice ? "MEMBER" : "STANDARD";
  const unitPricePence = canUseMemberPrice
    ? session.memberPricePence!
    : session.pricePence;

  return {
    pricingType,
    unitPricePence,
    childCount,
    totalAmountPence: unitPricePence * childCount,
    label:
      pricingType === "MEMBER"
        ? "Member price applied."
        : "Standard price applied.",
  };
}
