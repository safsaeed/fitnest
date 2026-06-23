"use server";

import { redirect } from "next/navigation";
import { destroyParentSession } from "@/lib/parent-auth";

export async function logoutParent() {
  await destroyParentSession();
  redirect("/account/login");
}
