"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getParentSession } from "@/lib/parent-auth";
import { getFormString } from "@/lib/form-data";

function validatePhone(phone: string) {
  if (!phone) {
    return true;
  }

  const digits = phone.replace(/\D/g, "");

  return (
    phone.length <= 20 &&
    digits.length >= 10 &&
    digits.length <= 15 &&
    /^\+?[0-9() -]+$/.test(phone)
  );
}

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

  if (!validatePhone(phone)) {
    redirect("/account/profile?error=invalid-phone");
  }

  if (defaultEmergencyContactName && defaultEmergencyContactName.length > 100) {
    redirect("/account/profile?error=invalid-emergency-name");
  }

  if (
    defaultEmergencyContactPhone &&
    !validatePhone(defaultEmergencyContactPhone)
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
      defaultEmergencyContactName: defaultEmergencyContactName || null,
      defaultEmergencyContactPhone: defaultEmergencyContactPhone || null,
    },
  });

  revalidatePath("/account");
  revalidatePath("/account/profile");

  redirect("/account/profile?status=updated");
}
