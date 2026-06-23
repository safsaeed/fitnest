"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getParentSession } from "@/lib/parent-auth";
import { sendParentPasswordChangedEmail } from "@/lib/account-emails";
import { getFormString } from "@/lib/form-data";

export async function changeParentPassword(formData: FormData): Promise<void> {
  const session = await getParentSession();

  if (!session) {
    redirect("/account/login");
  }

  const currentPassword = getFormString(formData, "currentPassword");
  const newPassword = getFormString(formData, "newPassword");
  const confirmPassword = getFormString(formData, "confirmPassword");

  if (!currentPassword || !newPassword || !confirmPassword) {
    redirect("/account/password?error=missing-required");
  }

  if (newPassword.length < 8) {
    redirect("/account/password?error=password-too-short");
  }

  if (newPassword !== confirmPassword) {
    redirect("/account/password?error=password-mismatch");
  }

  const parentUser = await prisma.parentUser.findFirst({
    where: {
      id: session.parentUserId,
      isActive: true,
    },
  });

  if (!parentUser) {
    redirect("/account/login");
  }

  const passwordMatches = await bcrypt.compare(
    currentPassword,
    parentUser.passwordHash,
  );

  if (!passwordMatches) {
    redirect("/account/password?error=invalid-current-password");
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.parentUser.update({
    where: {
      id: parentUser.id,
    },
    data: {
      passwordHash,
    },
  });

  const appUrl = process.env.APP_URL;

  if (appUrl) {
    try {
      await sendParentPasswordChangedEmail({
        to: parentUser.email,
        parentName: parentUser.name,
        loginUrl: `${appUrl}/account/login`,
      });
    } catch (error) {
      console.error(
        `Password changed but notification email failed: ${parentUser.id}`,
        error,
      );
    }
  }

  redirect("/account/password?status=updated");
}
