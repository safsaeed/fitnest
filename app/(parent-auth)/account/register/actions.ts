"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createParentSession } from "@/lib/parent-auth";
import { sendAccountWelcomeEmail } from "@/lib/account-emails";
import { getFormString } from "@/lib/form-data";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function registerParent(formData: FormData): Promise<void> {
  const name = getFormString(formData, "name");
  const email = getFormString(formData, "email").toLowerCase();
  const phone = getFormString(formData, "phone");
  const password = getFormString(formData, "password");
  const confirmPassword = getFormString(formData, "confirmPassword");

  if (!name || !email || !password || !confirmPassword) {
    redirect("/account/register?error=missing-required");
  }

  if (!isValidEmail(email)) {
    redirect("/account/register?error=invalid-email");
  }

  if (password.length < 8) {
    redirect("/account/register?error=password-too-short");
  }

  if (password !== confirmPassword) {
    redirect("/account/register?error=password-mismatch");
  }

  const existingParent = await prisma.parentUser.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
    },
  });

  if (existingParent) {
    redirect("/account/register?error=email-exists");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const parentUser = await prisma.parentUser.create({
    data: {
      name,
      email,
      phone: phone || null,
      passwordHash,
      isActive: true,
    },
  });

  const appUrl = process.env.APP_URL;

  if (appUrl) {
    try {
      await sendAccountWelcomeEmail({
        to: parentUser.email,
        parentName: parentUser.name,
        accountUrl: `${appUrl}/account`,
        childrenUrl: `${appUrl}/account/children`,
        membershipUrl: `${appUrl}/account/membership`,
      });
    } catch (error) {
      console.error(
        `Account created but welcome email failed: ${parentUser.id}`,
        error,
      );
    }
  }

  await createParentSession({
    parentUserId: parentUser.id,
    email: parentUser.email,
  });

  redirect("/account");
}
