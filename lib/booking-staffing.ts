import { formatAgeRequirement } from "./formatters";
import {
  calculateAgeAtDate,
  getBookableStaffingAgeGroups,
  getStaffingUnitsForAge,
  STAFFING_UNITS_PER_STAFF,
  type StaffingAgeGroupRule,
} from "./staffing";

type GuestStaffingInput = {
  dateOfBirthValues: string[];
  sessionDate: Date;
  staffingUnitsRemaining: number;
  headcountSpacesRemaining: number;
  minAge: number;
  maxAge: number | null;
};

export function formatDateInputValue(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function latestDateOfBirthForAge(
  sessionDate: Date,
  minimumAge: number,
) {
  const latestDate = new Date(sessionDate);
  latestDate.setUTCFullYear(latestDate.getUTCFullYear() - minimumAge);

  return formatDateInputValue(latestDate);
}

export function earliestDateOfBirthForAge(
  sessionDate: Date,
  maximumAge: number,
) {
  const earliestDate = new Date(sessionDate);
  earliestDate.setUTCFullYear(
    earliestDate.getUTCFullYear() - maximumAge - 1,
  );
  earliestDate.setUTCDate(earliestDate.getUTCDate() + 1);

  return formatDateInputValue(earliestDate);
}

export function getStaffingUnitsForDateValue(
  dateValue: string,
  sessionDate: Date,
) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return 0;
  }

  const dateOfBirth = new Date(`${dateValue}T00:00:00.000Z`);

  if (Number.isNaN(dateOfBirth.getTime())) {
    return 0;
  }

  return getStaffingUnitsForAge(calculateAgeAtDate(dateOfBirth, sessionDate));
}

export function getBookableStaffingAgeRange({
  groups,
  minAge,
  maxAge,
}: {
  groups: readonly StaffingAgeGroupRule[];
  minAge: number;
  maxAge: number | null;
}) {
  const firstGroup = groups[0];
  const lastGroup = groups.at(-1);

  if (!firstGroup || !lastGroup) {
    return null;
  }

  const groupMaximumAge = lastGroup.maxAge;
  const effectiveMaximumAge =
    maxAge === null
      ? groupMaximumAge
      : groupMaximumAge === null
        ? maxAge
        : Math.min(maxAge, groupMaximumAge);

  return {
    minAge: Math.max(minAge, firstGroup.minAge),
    maxAge: effectiveMaximumAge,
  };
}

export function formatStaffingAgeRangeLabel(
  minAge: number,
  maxAge: number | null,
) {
  if (maxAge === null) {
    return `Ages ${minAge}+`;
  }

  if (minAge === maxAge) {
    return `Age ${minAge}`;
  }

  return `Ages ${minAge}-${maxAge}`;
}

export function formatAdditionalChildAgeAvailability({
  groups,
  isDynamicallyRestricted,
  hasSelectedChildren,
  minAge,
  maxAge,
}: {
  groups: readonly StaffingAgeGroupRule[];
  isDynamicallyRestricted: boolean;
  hasSelectedChildren: boolean;
  minAge: number;
  maxAge: number | null;
}) {
  if (groups.length === 0) {
    return hasSelectedChildren
      ? "Your selected children fit the staffing limit. You can continue to payment, but you can’t add another child."
      : "No children can currently be added within the staffing limit.";
  }

  if (!isDynamicallyRestricted) {
    return "Any child within this session’s age range can be added, subject to the remaining spaces.";
  }

  const ageRange = getBookableStaffingAgeRange({ groups, minAge, maxAge });

  if (!ageRange) {
    return "No children can currently be added within the staffing limit.";
  }

  return `${formatAgeRequirement(ageRange.minAge, ageRange.maxAge)} This is due to the remaining staffing availability.`;
}

export function getBookingStaffingSelectionState({
  selectedStaffingUnits,
  staffingUnitsRemaining,
  minAge,
  maxAge,
}: {
  selectedStaffingUnits: number;
  staffingUnitsRemaining: number;
  minAge: number;
  maxAge: number | null;
}) {
  const remainingStaffingUnits =
    staffingUnitsRemaining - selectedStaffingUnits;
  const sessionAgeGroups = getBookableStaffingAgeGroups({
    remainingUnits: STAFFING_UNITS_PER_STAFF,
    minAge,
    maxAge,
  });
  const bookableAgeGroups = getBookableStaffingAgeGroups({
    remainingUnits: Math.max(remainingStaffingUnits, 0),
    minAge,
    maxAge,
  });

  return {
    remainingStaffingUnits,
    staffingExceeded: remainingStaffingUnits < 0,
    bookableAgeGroups,
    sessionAgeGroups,
    isDynamicallyAgeRestricted:
      bookableAgeGroups.length < sessionAgeGroups.length,
  };
}

export function getGuestBookingStaffingState({
  dateOfBirthValues,
  sessionDate,
  staffingUnitsRemaining,
  headcountSpacesRemaining,
  minAge,
  maxAge,
}: GuestStaffingInput) {
  const unitsByChild = dateOfBirthValues.map((dateValue) =>
    getStaffingUnitsForDateValue(dateValue, sessionDate),
  );
  const selectedStaffingUnits = unitsByChild.reduce(
    (total, units) => total + units,
    0,
  );
  const selectionState = getBookingStaffingSelectionState({
    selectedStaffingUnits,
    staffingUnitsRemaining,
    minAge,
    maxAge,
  });
  const lightestSessionChildUnits = Math.min(
    ...selectionState.sessionAgeGroups.map((group) => group.unitsPerChild),
  );
  const childrenAwaitingDates = unitsByChild.filter(
    (units) => units === 0,
  ).length;
  const staffingUnitsAfterPlaceholders =
    selectionState.remainingStaffingUnits -
    (Number.isFinite(lightestSessionChildUnits)
      ? childrenAwaitingDates * lightestSessionChildUnits
      : 0);

  return {
    unitsByChild,
    selectedStaffingUnits,
    ...selectionState,
    lightestSessionChildUnits: Number.isFinite(lightestSessionChildUnits)
      ? lightestSessionChildUnits
      : null,
    hasSelectedChildren: unitsByChild.some((units) => units > 0),
    canAddChild:
      dateOfBirthValues.length < headcountSpacesRemaining &&
      Number.isFinite(lightestSessionChildUnits) &&
      staffingUnitsAfterPlaceholders >= lightestSessionChildUnits,
  };
}

export function getGuestChildStaffingRestriction({
  childIndex,
  dateOfBirthValues,
  sessionDate,
  staffingUnitsRemaining,
  headcountSpacesRemaining,
  minAge,
  maxAge,
}: GuestStaffingInput & { childIndex: number }) {
  const state = getGuestBookingStaffingState({
    dateOfBirthValues,
    sessionDate,
    staffingUnitsRemaining,
    headcountSpacesRemaining,
    minAge,
    maxAge,
  });
  const currentChildUnits = state.unitsByChild[childIndex] ?? 0;
  const otherChildrenAwaitingDates = state.unitsByChild.filter(
    (units, index) => index !== childIndex && units === 0,
  ).length;
  const reservedUnitsForOtherChildren =
    state.lightestSessionChildUnits === null
      ? 0
      : otherChildrenAwaitingDates * state.lightestSessionChildUnits;
  const unitsAvailableForChild =
    staffingUnitsRemaining -
    (state.selectedStaffingUnits - currentChildUnits) -
    reservedUnitsForOtherChildren;
  const ageGroups = getBookableStaffingAgeGroups({
    remainingUnits: Math.max(unitsAvailableForChild, 0),
    minAge,
    maxAge,
  });

  return {
    ageGroups,
    minimumAge: Math.max(minAge, ageGroups[0]?.minAge ?? minAge),
    unitsAvailableForChild,
  };
}
