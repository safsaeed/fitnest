"use server";

import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import {
  safelyDeleteVenue,
  type AdminDeletionResult,
} from "@/lib/admin-deletion";
import { getFormBoolean, getFormString } from "@/lib/form-data";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 100;

const MAX_ADDRESS_LINE_LENGTH = 150;
const MAX_CITY_LENGTH = 80;
const MAX_COUNTY_LENGTH = 80;
const MAX_COUNTRY_LENGTH = 80;
const MAX_POSTCODE_LENGTH = 10;

const UK_POSTCODE_PATTERN = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i;

function normalisePostcode(postcode: string) {
  return postcode.toUpperCase().replace(/\s+/g, " ").trim();
}

function getVenueInput(formData: FormData) {
  const country = getFormString(formData, "country") || "UK";

  return {
    name: getFormString(formData, "name"),
    addressLine1: getFormString(formData, "addressLine1"),
    addressLine2: getFormString(formData, "addressLine2"),
    city: getFormString(formData, "city"),
    county: getFormString(formData, "county"),
    postcode: normalisePostcode(getFormString(formData, "postcode")),
    country,
    isActive: getFormBoolean(formData, "isActive"),
  };
}

function validateVenueInput(input: ReturnType<typeof getVenueInput>) {
  if (!input.name) {
    return "missing-name";
  }

  if (
    input.name.length < MIN_NAME_LENGTH ||
    input.name.length > MAX_NAME_LENGTH
  ) {
    return "invalid-name";
  }

  if (
    input.addressLine1.length > MAX_ADDRESS_LINE_LENGTH ||
    input.addressLine2.length > MAX_ADDRESS_LINE_LENGTH ||
    input.city.length > MAX_CITY_LENGTH ||
    input.county.length > MAX_COUNTY_LENGTH ||
    input.country.length < 2 ||
    input.country.length > MAX_COUNTRY_LENGTH
  ) {
    return "invalid-address";
  }

  if (input.postcode.length > MAX_POSTCODE_LENGTH) {
    return "invalid-postcode";
  }

  const isUkVenue = ["UK", "GB", "UNITED KINGDOM"].includes(
    input.country.toUpperCase(),
  );

  if (
    isUkVenue &&
    input.postcode &&
    !UK_POSTCODE_PATTERN.test(input.postcode)
  ) {
    return "invalid-postcode";
  }

  return null;
}

export async function createVenue(formData: FormData): Promise<void> {
  const input = getVenueInput(formData);
  const error = validateVenueInput(input);

  if (error) {
    redirect(`/admin/venues/new?error=${error}`);
  }

  await prisma.venue.create({
    data: {
      name: input.name,
      addressLine1: input.addressLine1 || null,
      addressLine2: input.addressLine2 || null,
      city: input.city || null,
      county: input.county || null,
      postcode: input.postcode || null,
      country: input.country,
      isActive: input.isActive,
    },
  });

  revalidatePath("/admin/venues");
  redirect("/admin/venues");
}

export async function updateVenue(
  venueId: string,
  formData: FormData,
): Promise<void> {
  const input = getVenueInput(formData);
  const error = validateVenueInput(input);

  if (error) {
    redirect(`/admin/venues/${venueId}/edit?error=${error}`);
  }

  await prisma.venue.update({
    where: {
      id: venueId,
    },
    data: {
      name: input.name,
      addressLine1: input.addressLine1 || null,
      addressLine2: input.addressLine2 || null,
      city: input.city || null,
      county: input.county || null,
      postcode: input.postcode || null,
      country: input.country,
      isActive: input.isActive,
    },
  });

  revalidatePath("/admin/venues");
  redirect("/admin/venues");
}

export async function deactivateVenue(venueId: string): Promise<void> {
  await prisma.venue.update({
    where: {
      id: venueId,
    },
    data: {
      isActive: false,
    },
  });

  revalidatePath("/admin/venues");
}

export async function activateVenue(venueId: string): Promise<void> {
  await prisma.venue.update({
    where: {
      id: venueId,
    },
    data: {
      isActive: true,
    },
  });

  revalidatePath("/admin/venues");
}

export async function deleteVenue(
  venueId: string,
): Promise<AdminDeletionResult> {
  const adminSession = await getAdminSession();
  const result = await safelyDeleteVenue(
    prisma,
    adminSession?.adminUserId ?? null,
    venueId,
  );

  if (result.success) {
    revalidatePath("/admin/venues");
    redirect("/admin/venues?deleted=true");
  }

  return result;
}
