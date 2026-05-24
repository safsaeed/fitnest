"use server";

import { getFormValue } from "@/lib/form-data";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function registerVenueInterest(formData: FormData) {
  const parentEmail = getFormValue(formData, "parentEmail").toLowerCase();
  const city = getFormValue(formData, "city");
  const venueName = getFormValue(formData, "venueName");
  const notes = getFormValue(formData, "notes");

  if (!parentEmail || !city || !venueName) {
    redirect("/register-interest?error=missing-required");
  }

  if (
    parentEmail.length > 80 ||
    city.length > 50 ||
    venueName.length > 150 ||
    notes.length > 200
  ) {
    redirect("/register-interest?error=invalid");
  }

  await prisma.venueInterest.create({
    data: {
      parentEmail,
      city,
      venueName,
      notes: notes || null,
    },
  });

  redirect("/register-interest?success=true");
}
