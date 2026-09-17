import assert from "node:assert/strict";
import test from "node:test";
import {
  getSessionAvailability,
  validateBookingAvailability,
} from "./availability";

function sessionStartingAt(startsAt: string) {
  return {
    capacity: 10,
    startsAt: new Date(startsAt),
    isActive: true,
    bookings: [],
  };
}

test("bookings remain open until the session starts", () => {
  const session = sessionStartingAt("2026-09-15T18:00:00.000Z");
  const now = new Date("2026-09-15T17:59:59.999Z");

  assert.equal(getSessionAvailability(session, now).canBook, true);
  assert.equal(
    validateBookingAvailability({ session, requestedChildCount: 1, now }).ok,
    true,
  );
});

test("bookings close when the session starts", () => {
  const session = sessionStartingAt("2026-09-15T18:00:00.000Z");
  const now = new Date("2026-09-15T18:00:00.000Z");
  const availability = getSessionAvailability(session, now);

  assert.equal(availability.canBook, false);
  assert.equal(availability.statusLabel, "Session expired");
  assert.deepEqual(
    validateBookingAvailability({ session, requestedChildCount: 1, now }),
    {
      ok: false,
      reason: "This session has expired.",
      availability,
    },
  );
});
