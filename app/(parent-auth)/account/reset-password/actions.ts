"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sendParentPasswordChangedEmail } from "@/lib/account-emails";
import { getFormString } from "@/lib/form-data";
import { hashPasswordResetToken } from "@/lib/parent-password-reset";

export async function resetParentPassword(formData: FormData): Promise<void> {
  const token = getFormString(formData, "token");
  const password = getFormString(formData, "password");
  const confirmPassword = getFormString(formData, "confirmPassword");

  if (!token || !password || !confirmPassword) {
    redirect("/account/reset-password?error=missing-required");
  }

  if (password.length < 8) {
    redirect(`/account/reset-password?token=${token}&error=password-too-short`);
  }

  if (password !== confirmPassword) {
    redirect(`/account/reset-password?token=${token}&error=password-mismatch`);
  }

  const tokenHash = hashPasswordResetToken(token);

  const resetToken = await prisma.parentPasswordResetToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      parentUser: true,
    },
  });

  if (!resetToken || !resetToken.parentUser.isActive) {
    redirect("/account/reset-password?error=invalid-token");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.parentUser.update({
      where: {
        id: resetToken.parentUserId,
      },
      data: {
        passwordHash,
      },
    }),

    prisma.parentPasswordResetToken.update({
      where: {
        id: resetToken.id,
      },
      data: {
        usedAt: new Date(),
      },
    }),
  ]);

  const appUrl = process.env.APP_URL;

  if (appUrl) {
    try {
      await sendParentPasswordChangedEmail({
        to: resetToken.parentUser.email,
        parentName: resetToken.parentUser.name,
        loginUrl: `${appUrl}/account/login`,
      });
    } catch (error) {
      console.error(
        `Password reset succeeded but notification email failed: ${resetToken.parentUserId}`,
        error,
      );
    }
  }

  redirect("/account/login?status=password-reset");
}
