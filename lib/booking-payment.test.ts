import assert from "node:assert/strict";
import test from "node:test";
import {
  getBookingPaymentDisplay,
  PAYMENT_EXPIRED_REASON,
} from "./booking-payment";

test("presents an unpaid pending booking as awaiting payment", () => {
  const display = getBookingPaymentDisplay({
    status: "PENDING",
    paymentStatus: "PENDING",
  });

  assert.equal(display.label, "Awaiting payment");
  assert.equal(display.tone, "warning");
  assert.match(display.message, /not confirmed/);
});

test("distinguishes an expired checkout from a customer cancellation", () => {
  const expired = getBookingPaymentDisplay({
    status: "CANCELLED",
    paymentStatus: "FAILED",
    cancellationReason: PAYMENT_EXPIRED_REASON,
  });
  const cancelled = getBookingPaymentDisplay({
    status: "CANCELLED",
    paymentStatus: "FAILED",
    cancellationReason: "Payment cancelled by customer.",
  });

  assert.equal(expired.label, "Payment expired");
  assert.equal(cancelled.label, "Payment cancelled");
});

test("flags a paid pending booking for attention", () => {
  const display = getBookingPaymentDisplay({
    status: "PENDING",
    paymentStatus: "PAID",
  });

  assert.equal(display.label, "Payment received");
  assert.equal(display.tone, "warning");
});
