"use server";

import { prisma } from "@/lib/prisma";
import {
  addDays,
  combineDateAndTime,
  getNowWithoutSeconds,
} from "@/lib/date-time";
import {
  getFormBoolean,
  getFormDateOnly,
  getFormNumber,
  getFormString,
} from "@/lib/form-data";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const MIN_CAPACITY = 1;
const MAX_CAPACITY = 500;

const MIN_PRICE_POUNDS = 0;
const MAX_PRICE_POUNDS = 1000;

const MIN_ALLOWED_AGE = 0;
const MAX_ALLOWED_AGE = 18;

const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 1000;

const MAX_BULK_SESSIONS = 100;

function isWholeNumber(value: number) {
  return Number.isInteger(value);
}

function isValidCapacity(capacity: number) {
  return (
    isWholeNumber(capacity) &&
    capacity >= MIN_CAPACITY &&
    capacity <= MAX_CAPACITY
  );
}

function isValidPrice(pricePounds: number) {
  return pricePounds >= MIN_PRICE_POUNDS && pricePounds <= MAX_PRICE_POUNDS;
}

function isValidAge(age: number | null) {
  return (
    age === null ||
    (isWholeNumber(age) && age >= MIN_ALLOWED_AGE && age <= MAX_ALLOWED_AGE)
  );
}

function getDatesBetween({
  startsOn,
  endsOn,
  repeatPattern,
}: {
  startsOn: Date;
  endsOn: Date;
  repeatPattern: string;
}) {
  const dates: Date[] = [];
  let current = new Date(startsOn);

  const intervalDays =
    repeatPattern === "daily"
      ? 1
      : repeatPattern === "every-other-day"
        ? 2
        : repeatPattern === "weekly"
          ? 7
          : repeatPattern === "every-other-week"
            ? 14
            : 7;

  while (current <= endsOn) {
    dates.push(new Date(current));
    current = addDays(current, intervalDays);
  }

  return dates;
}

function validateCommonSessionFields({
  venueId,
  title,
  description,
  capacity,
  pricePounds,
  memberPricePounds,
  minAge,
  maxAge,
}: {
  venueId: string;
  title: string;
  description: string;
  capacity: number;
  pricePounds: number;
  memberPricePounds: number | null;
  minAge: number | null;
  maxAge: number | null;
}) {
  if (!venueId || !title) {
    return "missing-required";
  }

  if (
    title.length > MAX_TITLE_LENGTH ||
    description.length > MAX_DESCRIPTION_LENGTH
  ) {
    return "invalid-text";
  }

  if (!isValidCapacity(capacity)) {
    return "invalid-capacity";
  }

  if (!isValidPrice(pricePounds)) {
    return "invalid-price";
  }

  if (memberPricePounds !== null && !isValidPrice(memberPricePounds)) {
    return "invalid-member-price";
  }

  if (memberPricePounds !== null && memberPricePounds > pricePounds) {
    return "member-price-too-high";
  }

  if (!isValidAge(minAge) || !isValidAge(maxAge)) {
    return "invalid-age";
  }

  if (minAge !== null && maxAge !== null && maxAge < minAge) {
    return "invalid-age-range";
  }

  return null;
}

function validateSessionInput({
  venueId,
  title,
  description,
  startsAt,
  endsAt,
  capacity,
  pricePounds,
  memberPricePounds,
  minAge,
  maxAge,
  mode,
}: {
  venueId: string;
  title: string;
  description: string;
  startsAt: Date | null;
  endsAt: Date | null;
  capacity: number;
  pricePounds: number;
  memberPricePounds: number | null;
  minAge: number | null;
  maxAge: number | null;
  mode: "create" | "edit";
}) {
  const commonError = validateCommonSessionFields({
    venueId,
    title,
    description,
    capacity,
    pricePounds,
    memberPricePounds,
    minAge,
    maxAge,
  });

  if (commonError) {
    return commonError;
  }

  if (!startsAt || !endsAt) {
    return "missing-required";
  }

  if (mode === "create" && startsAt < getNowWithoutSeconds()) {
    return "start-in-past";
  }

  if (endsAt <= startsAt) {
    return "invalid-dates";
  }

  return null;
}

function getSessionInput(formData: FormData) {
  const venueId = getFormString(formData, "venueId");
  const title = getFormString(formData, "title");
  const description = getFormString(formData, "description");

  const singleDate = getFormDateOnly(formData, "singleDate");
  const singleStartTime = getFormString(formData, "singleStartTime");
  const singleEndTime = getFormString(formData, "singleEndTime");

  const startsAt =
    singleDate && singleStartTime
      ? combineDateAndTime(singleDate, singleStartTime)
      : null;

  const endsAt =
    singleDate && singleEndTime
      ? combineDateAndTime(singleDate, singleEndTime)
      : null;

  const capacity = getFormNumber(formData, "capacity") ?? 10;
  const pricePounds = getFormNumber(formData, "pricePounds") ?? 10;
  const memberPricePounds = getFormNumber(formData, "memberPricePounds");
  const minAge = getFormNumber(formData, "minAge");
  const maxAge = getFormNumber(formData, "maxAge");

  return {
    venueId,
    title,
    description,
    startsAt,
    endsAt,
    capacity,
    pricePounds,
    memberPricePounds,
    minAge,
    maxAge,
    isActive: getFormBoolean(formData, "isActive"),
  };
}

function getRepeatingSessionInput(formData: FormData) {
  const venueId = getFormString(formData, "venueId");
  const title = getFormString(formData, "title");
  const description = getFormString(formData, "description");

  const startsOn = getFormDateOnly(formData, "startsOn");
  const endsOn = getFormDateOnly(formData, "endsOn");

  const startTime = getFormString(formData, "startTime");
  const endTime = getFormString(formData, "endTime");
  const repeatPattern = getFormString(formData, "repeatPattern");

  const capacity = getFormNumber(formData, "capacity") ?? 10;
  const pricePounds = getFormNumber(formData, "pricePounds") ?? 10;
  const memberPricePounds = getFormNumber(formData, "memberPricePounds");
  const minAge = getFormNumber(formData, "minAge");
  const maxAge = getFormNumber(formData, "maxAge");

  return {
    venueId,
    title,
    description,
    startsOn,
    endsOn,
    startTime,
    endTime,
    repeatPattern,
    capacity,
    pricePounds,
    memberPricePounds,
    minAge,
    maxAge,
  };
}

function pricePoundsToPence(pricePounds: number) {
  return Math.round(pricePounds * 100);
}

function optionalPricePoundsToPence(pricePounds: number | null) {
  return pricePounds === null ? null : pricePoundsToPence(pricePounds);
}

async function createSingleSessionFromForm(formData: FormData): Promise<void> {
  const input = getSessionInput(formData);

  const error = validateSessionInput({
    ...input,
    mode: "create",
  });

  if (error) {
    redirect(`/admin/sessions/new?error=${error}`);
  }

  await prisma.session.create({
    data: {
      venueId: input.venueId,
      title: input.title,
      description: input.description || null,
      startsAt: input.startsAt!,
      endsAt: input.endsAt!,
      capacity: input.capacity,
      pricePence: pricePoundsToPence(input.pricePounds),
      memberPricePence: optionalPricePoundsToPence(input.memberPricePounds),
      minAge: input.minAge,
      maxAge: input.maxAge,
      isActive: true,
    },
  });

  revalidatePath("/admin/sessions");
  redirect("/admin/sessions");
}

async function createRepeatingSessionsFromForm(
  formData: FormData,
): Promise<void> {
  const input = getRepeatingSessionInput(formData);

  const commonError = validateCommonSessionFields({
    venueId: input.venueId,
    title: input.title,
    description: input.description,
    capacity: input.capacity,
    pricePounds: input.pricePounds,
    memberPricePounds: input.memberPricePounds,
    minAge: input.minAge,
    maxAge: input.maxAge,
  });

  if (commonError) {
    redirect(`/admin/sessions/new?error=${commonError}`);
  }

  if (
    !input.startsOn ||
    !input.endsOn ||
    !input.startTime ||
    !input.endTime ||
    !input.repeatPattern
  ) {
    redirect("/admin/sessions/new?error=missing-required");
  }

  if (input.endsOn < input.startsOn) {
    redirect("/admin/sessions/new?error=invalid-date-range");
  }

  const firstStartsAt = combineDateAndTime(input.startsOn, input.startTime);
  const firstEndsAt = combineDateAndTime(input.startsOn, input.endTime);

  if (!firstStartsAt || !firstEndsAt) {
    redirect("/admin/sessions/new?error=missing-required");
  }

  if (firstStartsAt < getNowWithoutSeconds()) {
    redirect("/admin/sessions/new?error=start-in-past");
  }

  if (firstEndsAt <= firstStartsAt) {
    redirect("/admin/sessions/new?error=invalid-dates");
  }

  const sessionDates = getDatesBetween({
    startsOn: input.startsOn,
    endsOn: input.endsOn,
    repeatPattern: input.repeatPattern,
  });

  if (sessionDates.length === 0) {
    redirect("/admin/sessions/new?error=no-sessions");
  }

  if (sessionDates.length > MAX_BULK_SESSIONS) {
    redirect("/admin/sessions/new?error=too-many-sessions");
  }

  const standardPricePence = pricePoundsToPence(input.pricePounds);
  const memberPricePence = optionalPricePoundsToPence(input.memberPricePounds);

  const sessionsToCreate = sessionDates.map((date) => {
    const startsAt = combineDateAndTime(date, input.startTime);
    const endsAt = combineDateAndTime(date, input.endTime);

    if (!startsAt || !endsAt) {
      throw new Error("Invalid session time.");
    }

    return {
      venueId: input.venueId,
      title: input.title,
      description: input.description || null,
      startsAt,
      endsAt,
      capacity: input.capacity,
      pricePence: standardPricePence,
      memberPricePence,
      minAge: input.minAge,
      maxAge: input.maxAge,
      isActive: true,
    };
  });

  await prisma.session.createMany({
    data: sessionsToCreate,
  });

  revalidatePath("/admin/sessions");
  redirect("/admin/sessions");
}

export async function createSessionFromForm(formData: FormData): Promise<void> {
  const mode = getFormString(formData, "mode");

  if (mode === "repeating") {
    await createRepeatingSessionsFromForm(formData);
    return;
  }

  await createSingleSessionFromForm(formData);
}

export async function createSession(formData: FormData): Promise<void> {
  await createSingleSessionFromForm(formData);
}

export async function bulkCreateSessions(formData: FormData): Promise<void> {
  await createRepeatingSessionsFromForm(formData);
}

export async function updateSession(
  sessionId: string,
  formData: FormData,
): Promise<void> {
  const input = getSessionInput(formData);

  const error = validateSessionInput({
    ...input,
    mode: "edit",
  });

  if (error) {
    redirect(`/admin/sessions/${sessionId}/edit?error=${error}`);
  }

  await prisma.session.update({
    where: {
      id: sessionId,
    },
    data: {
      venueId: input.venueId,
      title: input.title,
      description: input.description || null,
      startsAt: input.startsAt!,
      endsAt: input.endsAt!,
      capacity: input.capacity,
      pricePence: pricePoundsToPence(input.pricePounds),
      memberPricePence: optionalPricePoundsToPence(input.memberPricePounds),
      minAge: input.minAge,
      maxAge: input.maxAge,
      isActive: input.isActive,
    },
  });

  revalidatePath("/admin/sessions");
  redirect("/admin/sessions");
}

export async function deactivateSession(sessionId: string): Promise<void> {
  await prisma.session.update({
    where: {
      id: sessionId,
    },
    data: {
      isActive: false,
    },
  });

  revalidatePath("/admin/sessions");
}

export async function activateSession(sessionId: string): Promise<void> {
  await prisma.session.update({
    where: {
      id: sessionId,
    },
    data: {
      isActive: true,
    },
  });

  revalidatePath("/admin/sessions");
}
