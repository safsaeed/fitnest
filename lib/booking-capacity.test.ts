import assert from "node:assert/strict";
import test from "node:test";

import { validateBookingCapacity } from "./booking-capacity";

const sessionDate = new Date("2027-06-15T10:00:00.000Z");
const now = new Date("2027-06-01T10:00:00.000Z");

function child(age: number) {
  return {
    dateOfBirth: new Date(
      Date.UTC(
        sessionDate.getUTCFullYear() - age,
        sessionDate.getUTCMonth(),
        sessionDate.getUTCDate(),
      ),
    ),
  };
}

function session(
  bookings: Array<{ childCount: number; children: ReturnType<typeof child>[] }> = [],
) {
  return {
    capacity: 10,
    startsAt: sessionDate,
    isActive: true,
    bookings,
  };
}

test("accepts a request that exactly fills the one-staff allowance", () => {
  const result = validateBookingCapacity({
    session: session(),
    requestedChildren: [child(1), child(1), child(1)],
    now,
  });

  assert.equal(result.ok, true);
  assert.equal(result.staffing?.requestedUnits, 120);
});

test("rejects a crafted request that exceeds staffing capacity", () => {
  const result = validateBookingCapacity({
    session: session([
      {
        childCount: 3,
        children: [child(1), child(1), child(2)],
      },
    ]),
    requestedChildren: [child(3), child(3)],
    now,
  });

  assert.equal(result.ok, false);
  assert.equal(result.constraint, "STAFFING");
  assert.match(result.reason, /staffing limit/);
});

test("still enforces the session headcount capacity", () => {
  const result = validateBookingCapacity({
    session: {
      ...session([{ childCount: 1, children: [child(3)] }]),
      capacity: 2,
    },
    requestedChildren: [child(3), child(3)],
    now,
  });

  assert.equal(result.ok, false);
  assert.equal(result.constraint, "SESSION");
  assert.match(result.reason, /Only 1 spaces/);
});

test("confirmation revalidation rejects a second booking after capacity is consumed", () => {
  const existingBooking = {
    childCount: 2,
    children: [child(1), child(1)],
  };
  const firstRequestedChildren = [child(2)];

  assert.equal(
    validateBookingCapacity({
      session: session([existingBooking]),
      requestedChildren: firstRequestedChildren,
      now,
    }).ok,
    true,
  );

  const secondResult = validateBookingCapacity({
    session: session([
      existingBooking,
      { childCount: 1, children: firstRequestedChildren },
    ]),
    requestedChildren: [child(2)],
    now,
  });

  assert.equal(secondResult.ok, false);
  assert.equal(secondResult.constraint, "STAFFING");
});
