"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { isAuthorizedAdmin } from "@/lib/admin-deletion";
import { closePendingCheckout } from "@/lib/booking-payment.server";
import { PAYMENT_CLOSED_BY_ADMIN_REASON } from "@/lib/booking-payment";
import { prisma } from "@/lib/prisma";

type ClosePendingBookingResult =
  | { success: true; message: string }
  | { success: false; message: string };

export async function closePendingBooking(
  bookingId: string,
): Promise<ClosePendingBookingResult> {
  const adminSession = await getAdminSession();

  if (
    !(await isAuthorizedAdmin(prisma, adminSession?.adminUserId ?? null))
  ) {
    return {
      success: false,
      message: "You are not authorized to close this booking.",
    };
  }

  if (!z.cuid().safeParse(bookingId).success) {
    return {
      success: false,
      message: "This booking could not be found.",
    };
  }

  try {
    const result = await closePendingCheckout({
      bookingId,
      reason: PAYMENT_CLOSED_BY_ADMIN_REASON,
    });

    revalidatePath("/admin");
    revalidatePath("/admin/bookings");
    revalidatePath(`/admin/bookings/${bookingId}`);

    if (result === "payment-completed") {
      return {
        success: true,
        message: "Payment had completed, so the booking was confirmed.",
      };
    }

    return {
      success: true,
      message:
        result === "closed"
          ? "The incomplete payment was closed."
          : "This booking was already closed.",
    };
  } catch (error) {
    console.error(`Could not close pending booking ${bookingId}`, error);
    return {
      success: false,
      message: "The incomplete payment could not be closed. Please try again.",
    };
  }
}
