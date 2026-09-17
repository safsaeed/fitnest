import assert from "node:assert/strict";
import test from "node:test";

import {
  earliestDateOfBirthForAge,
  formatAdditionalChildAgeAvailability,
  getBookableStaffingAgeRange,
  getGuestBookingStaffingState,
  getGuestChildStaffingRestriction,
  latestDateOfBirthForAge,
} from "./booking-staffing";

const sessionDate = new Date("2027-06-15T10:00:00.000Z");

test("a selection that uses the final staffing units can still proceed", () => {
  const state = getGuestBookingStaffingState({
    dateOfBirthValues: ["2026-06-15"],
    sessionDate,
    staffingUnitsRemaining: 40,
    headcountSpacesRemaining: 5,
    minAge: 1,
    maxAge: 8,
  });

  assert.equal(state.remainingStaffingUnits, 0);
  assert.equal(state.staffingExceeded, false);
  assert.deepEqual(state.bookableAgeGroups, []);
  assert.match(
    formatAdditionalChildAgeAvailability({
      groups: state.bookableAgeGroups,
      isDynamicallyRestricted: state.isDynamicallyAgeRestricted,
      hasSelectedChildren: state.hasSelectedChildren,
      minAge: 1,
      maxAge: 8,
    }),
    /continue to payment/,
  );
});

test("blank child rows reserve enough capacity for every child to be completed", () => {
  const input = {
    dateOfBirthValues: ["", ""],
    sessionDate,
    staffingUnitsRemaining: 30,
    headcountSpacesRemaining: 5,
    minAge: 1,
    maxAge: 8,
  };
  const state = getGuestBookingStaffingState(input);
  const firstChild = getGuestChildStaffingRestriction({
    ...input,
    childIndex: 0,
  });

  assert.equal(state.canAddChild, false);
  assert.equal(firstChild.minimumAge, 3);
  assert.deepEqual(
    firstChild.ageGroups.map((group) => group.key),
    ["AGE_3_PLUS"],
  );
});

test("staffing messages respect the session maximum age", () => {
  const state = getGuestBookingStaffingState({
    dateOfBirthValues: [""],
    sessionDate,
    staffingUnitsRemaining: 15,
    headcountSpacesRemaining: 5,
    minAge: 1,
    maxAge: 3,
  });
  const ageRange = getBookableStaffingAgeRange({
    groups: state.bookableAgeGroups,
    minAge: 1,
    maxAge: 3,
  });

  assert.deepEqual(ageRange, { minAge: 3, maxAge: 3 });
  assert.match(
    formatAdditionalChildAgeAvailability({
      groups: state.bookableAgeGroups,
      isDynamicallyRestricted: state.isDynamicallyAgeRestricted,
      hasSelectedChildren: false,
      minAge: 1,
      maxAge: 3,
    }),
    /must be 3 years old/,
  );
});

test("date input bounds are calculated from the session date", () => {
  assert.equal(latestDateOfBirthForAge(sessionDate, 3), "2024-06-15");
  assert.equal(earliestDateOfBirthForAge(sessionDate, 5), "2021-06-16");
});
