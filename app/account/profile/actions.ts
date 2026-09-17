"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getParentSession } from "@/lib/parent-auth";
import { getFormString } from "@/lib/form-data";
import {
  emergencyContactNameSchema,
  emergencyContactPhoneSchema,
  phoneSchema,
} from "@/lib/validation/contact";

export async function updateParentProfile(formData: FormData): Promise<void> {
  const session = await getParentSession();

  if (!session) {
    redirect("/account/login");
  }

  const name = getFormString(formData, "name");
  const phone = getFormString(formData, "phone");
  const defaultEmergencyContactName = getFormString(
    formData,
    "defaultEmergencyContactName",
  );
  const defaultEmergencyContactPhone = getFormString(
    formData,
    "defaultEmergencyContactPhone",
  );

  if (!name || name.length < 2 || name.length > 100) {
    redirect("/account/profile?error=invalid-name");
  }

  if (phone && !phoneSchema.safeParse(phone).success) {
    redirect("/account/profile?error=invalid-phone");
  }

  if (!defaultEmergencyContactName || !defaultEmergencyContactPhone) {
    redirect("/account/profile?error=missing-emergency-contact");
  }

  if (
    !emergencyContactNameSchema.safeParse(defaultEmergencyContactName).success
  ) {
    redirect("/account/profile?error=invalid-emergency-name");
  }

  if (
    !emergencyContactPhoneSchema.safeParse(defaultEmergencyContactPhone).success
  ) {
    redirect("/account/profile?error=invalid-emergency-phone");
  }

  await prisma.parentUser.update({
    where: {
      id: session.parentUserId,
    },
    data: {
      name,
      phone: phone || null,
      defaultEmergencyContactName,
      defaultEmergencyContactPhone,
    },
  });

  revalidatePath("/account");
  revalidatePath("/account/profile");

  redirect("/account/profile?status=updated");
}
