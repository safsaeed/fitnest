import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateAgeAtDate,
  calculateStaffingSummary,
  calculateStaffingUnits,
  getStaffingAvailability,
  getStaffingUnitsForAge,
  validateStaffingAvailability,
} from "./staffing";

const sessionDate = new Date("2027-06-15T10:00:00.000Z");

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

test("assigns exact staffing units to each age group", () => {
  assert.equal(getStaffingUnitsForAge(1), 40);
  assert.equal(getStaffingUnitsForAge(2), 24);
  assert.equal(getStaffingUnitsForAge(3), 15);
  assert.equal(getStaffingUnitsForAge(12), 15);
});

test("uses the child’s age on the session date at birthday boundaries", () => {
  assert.equal(
    calculateAgeAtDate(new Date("2024-06-15T00:00:00.000Z"), sessionDate),
    3,
  );
  assert.equal(
    calculateAgeAtDate(new Date("2024-06-16T00:00:00.000Z"), sessionDate),
    2,
  );
  assert.equal(
    calculateAgeAtDate(new Date("2024-06-14T00:00:00.000Z"), sessionDate),
    3,
  );
});

test("allows a mixed-age group that fits one member of staff", () => {
  const children = [child(1), child(2), child(2), child(3), child(4)];

  assert.equal(
    calculateStaffingUnits({ children, sessionDate }),
    118,
  );
  assert.equal(
    validateStaffingAvailability({
      existingChildren: [],
      requestedChildren: children,
      sessionDate,
    }).ok,
    true,
  );
});

test("rejects a mixed-age group that needs more than one member of staff", () => {
  const result = validateStaffingAvailability({
    existingChildren: [
      child(1),
      child(2),
      child(2),
      child(3),
      child(4),
    ],
    requestedChildren: [child(3)],
    sessionDate,
  });

  assert.equal(result.ok, false);
  assert.equal(result.existingUnits, 118);
  assert.equal(result.requestedUnits, 15);
});

test("offers only the 3+ group when fewer than 24 staffing units remain", () => {
  const availability = getStaffingAvailability({
    children: [child(1), child(1), child(2), child(3)],
    sessionDate,
  });

  assert.equal(availability.usedUnits, 119);
  assert.deepEqual(availability.bookableAgeGroups, []);

  const age3OnlyAvailability = getStaffingAvailability({
    children: [child(1), child(1), child(2)],
    sessionDate,
  });

  assert.equal(age3OnlyAvailability.remainingUnits, 16);
  assert.deepEqual(
    age3OnlyAvailability.bookableAgeGroups.map((group) => group.key),
    ["AGE_3_PLUS"],
  );
  assert.equal(age3OnlyAvailability.maxAdditionalChildren, 1);
});

test("respects the session age range when reporting bookable age groups", () => {
  const availability = getStaffingAvailability({
    children: [],
    sessionDate,
    minAge: 4,
    maxAge: 8,
  });

  assert.deepEqual(
    availability.bookableAgeGroups.map((group) => group.key),
    ["AGE_3_PLUS"],
  );
  assert.equal(availability.maxAdditionalChildren, 8);
});

test("keeps the staffing summary aligned with exact staffing units", () => {
  const summary = calculateStaffingSummary({
    children: [child(1), child(2), child(3)],
    sessionDate,
  });

  assert.equal(summary.staffingFraction, 0.658);
  assert.equal(summary.requiredStaff, 1);
});
