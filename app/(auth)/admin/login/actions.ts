"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createAdminSession } from "@/lib/auth";
import { getFormString, getFormValue } from "@/lib/form-data";

export async function loginAdmin(formData: FormData): Promise<void> {
  const email = getFormString(formData, "email").toLowerCase();
  const password = getFormValue(formData, "password");

  if (!email || !password) {
    redirect("/admin/login?error=missing");
  }

  const adminUser = await prisma.adminUser.findUnique({
    where: { email },
  });

  if (!adminUser || !adminUser.isActive) {
    redirect("/admin/login?error=invalid");
  }

  const passwordMatches = await bcrypt.compare(
    password,
    adminUser.passwordHash
  );

  if (!passwordMatches) {
    redirect("/admin/login?error=invalid");
  }

  await createAdminSession({
    adminUserId: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
  });

  redirect("/admin");
}
