"use server";

import crypto from "crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sendParentPasswordResetEmail } from "@/lib/account-emails";
import { getFormString } from "@/lib/form-data";
import { hashPasswordResetToken } from "@/lib/parent-password-reset";

export async function requestParentPasswordReset(
  formData: FormData,
): Promise<void> {
  const email = getFormString(formData, "email").toLowerCase();

  if (!email) {
    redirect("/account/forgot-password?status=sent");
  }

  const parentUser = await prisma.parentUser.findUnique({
    where: {
      email,
    },
  });

  if (!parentUser || !parentUser.isActive) {
    redirect("/account/forgot-password?status=sent");
  }

  const appUrl = process.env.APP_URL;

  if (!appUrl) {
    throw new Error("APP_URL is not set");
  }

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashPasswordResetToken(token);

  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.parentPasswordResetToken.create({
    data: {
      parentUserId: parentUser.id,
      tokenHash,
      expiresAt,
    },
  });

  try {
    await sendParentPasswordResetEmail({
      to: parentUser.email,
      parentName: parentUser.name,
      resetUrl: `${appUrl}/account/reset-password?token=${token}`,
    });
  } catch (error) {
    console.error(
      `Password reset token created but email failed: ${parentUser.id}`,
      error,
    );
  }

  redirect("/account/forgot-password?status=sent");
}
