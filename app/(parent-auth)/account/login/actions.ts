"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createParentSession } from "@/lib/parent-auth";
import { getFormString } from "@/lib/form-data";

export async function loginParent(formData: FormData): Promise<void> {
  const email = getFormString(formData, "email").toLowerCase();
  const password = getFormString(formData, "password");

  if (!email || !password) {
    redirect("/account/login?error=missing-required");
  }

  const parentUser = await prisma.parentUser.findUnique({
    where: {
      email,
    },
  });

  if (!parentUser || !parentUser.isActive) {
    redirect("/account/login?error=invalid-login");
  }

  const passwordMatches = await bcrypt.compare(
    password,
    parentUser.passwordHash,
  );

  if (!passwordMatches) {
    redirect("/account/login?error=invalid-login");
  }

  await createParentSession({
    parentUserId: parentUser.id,
    email: parentUser.email,
  });

  redirect("/account");
}
