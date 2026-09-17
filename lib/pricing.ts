import type { Session } from "@prisma/client";

type SessionForPricing = Pick<Session, "pricePence">;

export type BookingPriceSummary = {
  pricingType: "STANDARD";
  unitPricePence: number;
  childCount: number;
  totalAmountPence: number;
  label: string;
};

export function calculateBookingPrice({
  session,
  childCount,
}: {
  session: SessionForPricing;
  childCount: number;
}): BookingPriceSummary {
  const unitPricePence = session.pricePence;

  return {
    pricingType: "STANDARD",
    unitPricePence,
    childCount,
    totalAmountPence: unitPricePence * childCount,
    label: "Session price applied.",
  };
}
