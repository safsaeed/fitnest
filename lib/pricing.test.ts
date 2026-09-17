import assert from "node:assert/strict";
import test from "node:test";
import { calculateBookingPrice } from "./pricing";

test("calculates one session price for every child", () => {
  assert.deepEqual(
    calculateBookingPrice({
      session: { pricePence: 1_200 },
      childCount: 3,
    }),
    {
      pricingType: "STANDARD",
      unitPricePence: 1_200,
      childCount: 3,
      totalAmountPence: 3_600,
      label: "Session price applied.",
    },
  );
});
