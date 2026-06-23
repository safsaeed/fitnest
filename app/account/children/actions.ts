"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getParentSession } from "@/lib/parent-auth";

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function getDateValue(formData: FormData, key: string) {
  const value = getStringValue(formData, key);

  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function getSafeReturnTo(formData: FormData) {
  const value = getStringValue(formData, "returnTo");

  if (!value) {
    return null;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  if (value.includes("://")) {
    return null;
  }

  return value;
}

function buildNewChildErrorRedirect({
  error,
  returnTo,
}: {
  error: string;
  returnTo: string | null;
}) {
  const params = new URLSearchParams({
    error,
  });

  if (returnTo) {
    params.set("returnTo", returnTo);
  }

  return `/account/children/new?${params.toString()}`;
}

function getChildInput(formData: FormData) {
  return {
    firstName: getStringValue(formData, "firstName"),
    lastName: getStringValue(formData, "lastName"),
    dateOfBirth: getDateValue(formData, "dateOfBirth"),
    allergies: getStringValue(formData, "allergies"),
    medicalNotes: getStringValue(formData, "medicalNotes"),
  };
}

function validateChildInput(input: ReturnType<typeof getChildInput>) {
  if (!input.firstName || !input.dateOfBirth) {
    return "missing-required";
  }

  if (input.firstName.length > 80 || input.lastName.length > 80) {
    return "invalid-name";
  }

  if (input.allergies.length > 500 || input.medicalNotes.length > 1000) {
    return "invalid-notes";
  }

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  if (input.dateOfBirth > today) {
    return "invalid-date-of-birth";
  }

  return null;
}

export async function createParentChild(formData: FormData): Promise<void> {
  const session = await getParentSession();
  const returnTo = getSafeReturnTo(formData);

  if (!session) {
    const loginParams = new URLSearchParams();

    if (returnTo) {
      loginParams.set("returnTo", returnTo);
    }

    redirect(
      loginParams.size > 0
        ? `/account/login?${loginParams.toString()}`
        : "/account/login",
    );
  }

  const input = getChildInput(formData);
  const error = validateChildInput(input);

  if (error) {
    redirect(
      buildNewChildErrorRedirect({
        error,
        returnTo,
      }),
    );
  }

  await prisma.parentChild.create({
    data: {
      parentUserId: session.parentUserId,
      firstName: input.firstName,
      lastName: input.lastName || null,
      dateOfBirth: input.dateOfBirth!,
      allergies: input.allergies || null,
      medicalNotes: input.medicalNotes || null,
      isActive: true,
    },
  });

  revalidatePath("/account");
  revalidatePath("/account/children");

  if (returnTo) {
    revalidatePath(returnTo);
    redirect(returnTo);
  }

  redirect("/account/children");
}

export async function updateParentChild(
  childId: string,
  formData: FormData,
): Promise<void> {
  const session = await getParentSession();

  if (!session) {
    redirect("/account/login");
  }

  const existingChild = await prisma.parentChild.findFirst({
    where: {
      id: childId,
      parentUserId: session.parentUserId,
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  if (!existingChild) {
    redirect("/account/children?error=not-found");
  }

  const input = getChildInput(formData);
  const error = validateChildInput(input);

  if (error) {
    redirect(`/account/children/${childId}/edit?error=${error}`);
  }

  await prisma.parentChild.update({
    where: {
      id: childId,
    },
    data: {
      firstName: input.firstName,
      lastName: input.lastName || null,
      dateOfBirth: input.dateOfBirth!,
      allergies: input.allergies || null,
      medicalNotes: input.medicalNotes || null,
    },
  });

  revalidatePath("/account");
  revalidatePath("/account/children");
  redirect("/account/children");
}

export async function deactivateParentChild(childId: string): Promise<void> {
  const session = await getParentSession();

  if (!session) {
    redirect("/account/login");
  }

  const existingChild = await prisma.parentChild.findFirst({
    where: {
      id: childId,
      parentUserId: session.parentUserId,
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  if (!existingChild) {
    redirect("/account/children?error=not-found");
  }

  await prisma.parentChild.update({
    where: {
      id: childId,
    },
    data: {
      isActive: false,
    },
  });

  revalidatePath("/account");
  revalidatePath("/account/children");
}
