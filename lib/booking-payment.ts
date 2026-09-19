export const CHECKOUT_EXPIRY_MINUTES = 30;
export const CHECKOUT_EXPIRY_SECONDS = CHECKOUT_EXPIRY_MINUTES * 60;

export const PAYMENT_CANCELLED_REASON = "Payment cancelled by customer.";
export const PAYMENT_EXPIRED_REASON = "Payment window expired.";
export const PAYMENT_START_FAILED_REASON = "Payment checkout could not be started.";
export const PAYMENT_CLOSED_BY_ADMIN_REASON =
  "Incomplete payment closed by an administrator.";

type BookingPaymentState = {
  status: string;
  paymentStatus: string;
  cancellationReason?: string | null;
};

export type BookingPaymentTone = "success" | "warning" | "danger" | "neutral";

export type BookingPaymentDisplay = {
  label: string;
  title: string;
  message: string;
  tone: BookingPaymentTone;
};

export function getBookingPaymentDisplay(
  booking: BookingPaymentState,
): BookingPaymentDisplay {
  if (booking.status === "CONFIRMED" && booking.paymentStatus === "PAID") {
    return {
      label: "Confirmed",
      title: "Booking confirmed",
      message:
        "Your booking is confirmed. Please keep the booking reference for your records.",
      tone: "success",
    };
  }

  if (booking.status === "PENDING" && booking.paymentStatus === "PENDING") {
    return {
      label: "Awaiting payment",
      title: "Complete your payment",
      message: `Your place is not confirmed until payment is complete. You can return to checkout for about ${CHECKOUT_EXPIRY_MINUTES} minutes after starting the booking.`,
      tone: "warning",
    };
  }

  if (booking.status === "PENDING" && booking.paymentStatus === "PAID") {
    return {
      label: "Payment received",
      title: "Payment received",
      message:
        "Your payment was received, but the booking still needs attention. Please contact the team before attending.",
      tone: "warning",
    };
  }

  if (booking.status === "REFUNDED" || booking.paymentStatus === "REFUNDED") {
    return {
      label: "Cancelled and refunded",
      title: "Booking cancelled and refunded",
      message: "This booking has been cancelled and the payment was refunded.",
      tone: "danger",
    };
  }

  if (booking.status === "CANCELLED" && booking.paymentStatus === "FAILED") {
    const expired = booking.cancellationReason === PAYMENT_EXPIRED_REASON;

    return {
      label: expired ? "Payment expired" : "Payment cancelled",
      title: expired ? "Payment window expired" : "Payment cancelled",
      message: expired
        ? "Payment was not completed within the checkout window, so this booking was not confirmed. You have not been charged."
        : "Payment was not completed, so this booking was not confirmed. You have not been charged.",
      tone: "danger",
    };
  }

  if (booking.status === "PENDING" && booking.paymentStatus === "FAILED") {
    return {
      label: "Payment failed",
      title: "Payment not completed",
      message:
        "The payment was not completed and the booking is not confirmed. Please contact the team if you need help.",
      tone: "danger",
    };
  }

  if (booking.status === "CANCELLED") {
    return {
      label: "Cancelled",
      title: "Booking cancelled",
      message: "This booking has been cancelled without a refund.",
      tone: "danger",
    };
  }

  return {
    label: "Needs attention",
    title: "Booking needs attention",
    message: "Please contact the team for help with this booking.",
    tone: "neutral",
  };
}

export function getBookingPaymentBadgeClass(tone: BookingPaymentTone) {
  if (tone === "success") {
    return "border-(--color-success-border) bg-(--color-success-soft) text-(--color-success)";
  }

  if (tone === "warning") {
    return "border-(--color-warning-border) bg-(--color-warning-soft) text-(--color-warning)";
  }

  if (tone === "danger") {
    return "border-(--color-danger-border) bg-(--color-danger-soft) text-(--color-danger)";
  }

  return "border-gray-200 bg-gray-50 text-gray-800";
}
