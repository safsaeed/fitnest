"use server";

import { getFormValue } from "@/lib/form-data";
import { prisma } from "@/lib/prisma";
import type { VenueInterestStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

const allowedStatuses: VenueInterestStatus[] = [
  "NEW",
  "REVIEWED",
  "CONTACTED",
  "ARCHIVED",
];

export async function updateVenueInterestStatus(
  interestId: string,
  formData: FormData,
) {
  const status = getFormValue(formData, "status") as VenueInterestStatus;

  if (!allowedStatuses.includes(status)) {
    return;
  }

  await prisma.venueInterest.update({
    where: {
      id: interestId,
    },
    data: {
      status,
    },
  });

  revalidatePath("/admin/interests");
}
