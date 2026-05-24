import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFormString } from "@/lib/form-data";

export async function POST(request: Request) {
  const formData = await request.formData();

  const bookingReference = getFormString(
    formData,
    "bookingReference",
  ).toUpperCase();

  const parentEmail = getFormString(formData, "parentEmail").toLowerCase();

  if (!bookingReference || !parentEmail) {
    return NextResponse.redirect(new URL("/booking/search?error=missing", request.url), 303);
  }

  const booking = await prisma.booking.findFirst({
    where: {
      bookingReference,
      parentEmail,
    },
    select: {
      bookingReference: true,
      bookingAccessToken: true,
    },
  });

  if (!booking || !booking.bookingAccessToken) {
    return NextResponse.redirect(new URL("/booking/search?error=not-found", request.url), 303);
  }

  return NextResponse.redirect(
    new URL(
      `/booking/${booking.bookingReference}?token=${booking.bookingAccessToken}`,
      request.url
    ),
    303
  );
}
