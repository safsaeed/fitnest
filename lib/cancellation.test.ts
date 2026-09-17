import assert from "node:assert/strict";
import test from "node:test";
import {
  canCancelBooking,
  getCancellationStatus,
  getRefundDeadlineAt,
  isCancellationRefundable,
} from "./cancellation";

const sessionStartsAt = new Date("2026-09-16T18:00:00.000Z");

test("cancellations made more than 24 hours before a session are refundable", () => {
  const now = new Date("2026-09-15T17:59:59.999Z");

  assert.equal(canCancelBooking(sessionStartsAt, now), true);
  assert.equal(isCancellationRefundable(sessionStartsAt, now), true);
  assert.equal(getCancellationStatus(sessionStartsAt, now).isRefundable, true);
});

test("a cancellation exactly 24 hours before a session is refundable", () => {
  const now = new Date("2026-09-15T18:00:00.000Z");

  assert.deepEqual(getRefundDeadlineAt(sessionStartsAt), now);
  assert.equal(isCancellationRefundable(sessionStartsAt, now), true);
});

test("cancellations made within 24 hours are allowed but non-refundable", () => {
  const now = new Date("2026-09-15T18:00:00.001Z");
  const status = getCancellationStatus(sessionStartsAt, now);

  assert.equal(status.canCancel, true);
  assert.equal(status.isRefundable, false);
  assert.match(status.message, /non-refundable/);
});

test("cancellations close when the session starts", () => {
  const status = getCancellationStatus(sessionStartsAt, sessionStartsAt);

  assert.equal(status.canCancel, false);
  assert.equal(status.isRefundable, false);
});
