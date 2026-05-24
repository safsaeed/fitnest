type ChildForStaffing = {
  dateOfBirth: Date | null;
};

type StaffingGroup = {
  key: "UNDER_2" | "AGE_2" | "AGE_3_PLUS";
  label: string;
  childCount: number;
  ratio: number;
  fraction: number;
};

export type StaffingSummary = {
  totalChildren: number;
  youngestAge: number | null;
  requiredStaff: number;
  staffingFraction: number;
  label: string;
  groups: StaffingGroup[];
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

  const groups: StaffingGroup[] = [
    {
      key: "UNDER_2",
      label: "Under 2",
      childCount: under2Count,
      ratio: 3,
      fraction: roundToThreeDecimals(under2Count / 3),
    },
    {
      key: "AGE_2",
      label: "Age 2",
      childCount: age2Count,
      ratio: 5,
      fraction: roundToThreeDecimals(age2Count / 5),
    },
    {
      key: "AGE_3_PLUS",
      label: "Age 3+",
      childCount: age3PlusCount,
      ratio: 8,
      fraction: roundToThreeDecimals(age3PlusCount / 8),
    },
  ];

  const staffingFraction = roundToThreeDecimals(
    groups.reduce((total, group) => total + group.fraction, 0)
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