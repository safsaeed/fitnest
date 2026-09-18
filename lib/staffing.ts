import { DEFAULT_SESSION_MIN_AGE } from "./session-age";

export type ChildForStaffing = {
  dateOfBirth: Date | null;
};

export type StaffingAgeGroupKey = "UNDER_2" | "AGE_2" | "AGE_3_PLUS";

export type StaffingGroup = {
  key: StaffingAgeGroupKey;
  label: string;
  childCount: number;
  ratio: number;
  fraction: number;
};

export type StaffingAgeGroupRule = {
  key: StaffingAgeGroupKey;
  label: string;
  minAge: number;
  maxAge: number | null;
  ratio: number;
  unitsPerChild: number;
};

export const STAFFING_UNITS_PER_STAFF = 120;
export const STAFF_PER_SESSION = 1;

export const STAFFING_AGE_GROUPS: readonly StaffingAgeGroupRule[] = [
  {
    key: "UNDER_2",
    label: "Under 2",
    minAge: 0,
    maxAge: 1,
    ratio: 3,
    unitsPerChild: 40,
  },
  {
    key: "AGE_2",
    label: "Age 2",
    minAge: 2,
    maxAge: 2,
    ratio: 5,
    unitsPerChild: 24,
  },
  {
    key: "AGE_3_PLUS",
    label: "Age 3+",
    minAge: 3,
    maxAge: null,
    ratio: 8,
    unitsPerChild: 15,
  },
];

export type StaffingSummary = {
  totalChildren: number;
  youngestAge: number | null;
  requiredStaff: number;
  staffingFraction: number;
  label: string;
  groups: StaffingGroup[];
};

export type StaffingAvailability = {
  capacityUnits: number;
  usedUnits: number;
  remainingUnits: number;
  isOverCapacity: boolean;
  bookableAgeGroups: readonly StaffingAgeGroupRule[];
  maxAdditionalChildren: number;
};

export function calculateAgeAtDate(dateOfBirth: Date, sessionDate: Date) {
  let age = sessionDate.getFullYear() - dateOfBirth.getFullYear();

  const hasHadBirthdayThisYear =
    sessionDate.getMonth() > dateOfBirth.getMonth() ||
    (sessionDate.getMonth() === dateOfBirth.getMonth() &&
      sessionDate.getDate() >= dateOfBirth.getDate());

  if (!hasHadBirthdayThisYear) {
    age--;
  }

  return age;
}

export function getStaffingAgeGroup(age: number) {
  if (age < 2) {
    return STAFFING_AGE_GROUPS[0];
  }

  if (age === 2) {
    return STAFFING_AGE_GROUPS[1];
  }

  return STAFFING_AGE_GROUPS[2];
}

export function getStaffingUnitsForAge(age: number) {
  return getStaffingAgeGroup(age).unitsPerChild;
}

export function calculateStaffingUnits({
  children,
  sessionDate,
}: {
  children: ChildForStaffing[];
  sessionDate: Date;
}) {
  return children.reduce((total, child) => {
    if (!child.dateOfBirth) {
      return total;
    }

    const age = calculateAgeAtDate(child.dateOfBirth, sessionDate);

    if (!Number.isFinite(age)) {
      return total;
    }

    return total + getStaffingUnitsForAge(age);
  }, 0);
}

function ageGroupOverlapsSessionRange(
  group: StaffingAgeGroupRule,
  minAge: number,
  maxAge: number | null,
) {
  const groupMaxAge = group.maxAge ?? Number.POSITIVE_INFINITY;
  const sessionMaxAge = maxAge ?? Number.POSITIVE_INFINITY;

  return group.minAge <= sessionMaxAge && groupMaxAge >= minAge;
}

export function getBookableStaffingAgeGroups({
  remainingUnits,
  minAge = DEFAULT_SESSION_MIN_AGE,
  maxAge = null,
}: {
  remainingUnits: number;
  minAge?: number;
  maxAge?: number | null;
}) {
  return STAFFING_AGE_GROUPS.filter(
    (group) =>
      ageGroupOverlapsSessionRange(group, minAge, maxAge) &&
      group.unitsPerChild <= remainingUnits,
  );
}

export function getStaffingAvailability({
  children,
  sessionDate,
  minAge = DEFAULT_SESSION_MIN_AGE,
  maxAge = null,
  staffCount = STAFF_PER_SESSION,
}: {
  children: ChildForStaffing[];
  sessionDate: Date;
  minAge?: number;
  maxAge?: number | null;
  staffCount?: number;
}): StaffingAvailability {
  const capacityUnits = staffCount * STAFFING_UNITS_PER_STAFF;
  const usedUnits = calculateStaffingUnits({ children, sessionDate });
  const remainingUnits = Math.max(capacityUnits - usedUnits, 0);

  const bookableAgeGroups = getBookableStaffingAgeGroups({
    remainingUnits,
    minAge,
    maxAge,
  });

  const lightestBookableChildUnits = Math.min(
    ...bookableAgeGroups.map((group) => group.unitsPerChild),
  );

  return {
    capacityUnits,
    usedUnits,
    remainingUnits,
    isOverCapacity: usedUnits > capacityUnits,
    bookableAgeGroups,
    maxAdditionalChildren: Number.isFinite(lightestBookableChildUnits)
      ? Math.floor(remainingUnits / lightestBookableChildUnits)
      : 0,
  };
}

export function validateStaffingAvailability({
  existingChildren,
  requestedChildren,
  sessionDate,
  staffCount = STAFF_PER_SESSION,
}: {
  existingChildren: ChildForStaffing[];
  requestedChildren: ChildForStaffing[];
  sessionDate: Date;
  staffCount?: number;
}) {
  const capacityUnits = staffCount * STAFFING_UNITS_PER_STAFF;
  const existingUnits = calculateStaffingUnits({
    children: existingChildren,
    sessionDate,
  });
  const requestedUnits = calculateStaffingUnits({
    children: requestedChildren,
    sessionDate,
  });

  if (existingUnits + requestedUnits > capacityUnits) {
    return {
      ok: false as const,
      reason:
        "The selected children’s ages exceed the staffing limit for this session.",
      capacityUnits,
      existingUnits,
      requestedUnits,
    };
  }

  return {
    ok: true as const,
    capacityUnits,
    existingUnits,
    requestedUnits,
  };
}

function roundToThreeDecimals(value: number) {
  return Math.round(value * 1000) / 1000;
}

export function calculateStaffingSummary({
  children,
  sessionDate,
}: {
  children: ChildForStaffing[];
  sessionDate: Date;
}): StaffingSummary {
  const ages = children
    .map((child) => {
      if (!child.dateOfBirth) return null;
      return calculateAgeAtDate(child.dateOfBirth, sessionDate);
    })
    .filter((age): age is number => typeof age === "number");

  if (ages.length === 0) {
    return {
      totalChildren: children.length,
      youngestAge: null,
      requiredStaff: 0,
      staffingFraction: 0,
      label: "No valid child dates of birth found.",
      groups: [
        {
          key: "UNDER_2",
          label: "Under 2",
          childCount: 0,
          ratio: 3,
          fraction: 0,
        },
        {
          key: "AGE_2",
          label: "Age 2",
          childCount: 0,
          ratio: 5,
          fraction: 0,
        },
        {
          key: "AGE_3_PLUS",
          label: "Age 3+",
          childCount: 0,
          ratio: 8,
          fraction: 0,
        },
      ],
    };
  }

  const under2Count = ages.filter((age) => age < 2).length;
  const age2Count = ages.filter((age) => age === 2).length;
  const age3PlusCount = ages.filter((age) => age >= 3).length;

  const groupCounts: Record<StaffingAgeGroupKey, number> = {
    UNDER_2: under2Count,
    AGE_2: age2Count,
    AGE_3_PLUS: age3PlusCount,
  };

  const groups: StaffingGroup[] = STAFFING_AGE_GROUPS.map((group) => ({
    key: group.key,
    label: group.label,
    childCount: groupCounts[group.key],
    ratio: group.ratio,
    fraction: roundToThreeDecimals(
      (groupCounts[group.key] * group.unitsPerChild) /
        STAFFING_UNITS_PER_STAFF,
    ),
  }));

  const staffingFraction = roundToThreeDecimals(
    calculateStaffingUnits({ children, sessionDate }) /
      STAFFING_UNITS_PER_STAFF,
  );

  return {
    totalChildren: ages.length,
    youngestAge: Math.min(...ages),
    requiredStaff: Math.ceil(staffingFraction),
    staffingFraction,
    label:
      "Staffing is calculated by adding each age group's staffing fraction, then rounding up.",
    groups,
  };
}
