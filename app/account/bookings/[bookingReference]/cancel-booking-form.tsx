"use client";

import { ConfirmActionDialog } from "@/components/confirm-action-dialog";

type AccountCancelBookingFormProps = {
  bookingReference: string;
  token: string;
  isRefundable: boolean;
};

export function AccountCancelBookingForm({
  bookingReference,
  token,
  isRefundable,
}: AccountCancelBookingFormProps) {
  return (
    <ConfirmActionDialog
      formAction="/api/bookings/cancel"
      formMethod="POST"
      hiddenFields={[
        { name: "bookingReference", value: bookingReference },
        { name: "token", value: token },
      ]}
      title={isRefundable ? "Cancel and refund this booking?" : "Cancel this booking?"}
      description={
        isRefundable
          ? "This will cancel the booking and issue a full refund. This action cannot usually be undone."
          : "This cancellation is within 24 hours of the session, so no refund will be issued. This action cannot usually be undone."
      }
      confirmLabel={isRefundable ? "Yes, cancel and refund" : "Yes, cancel booking"}
      cancelLabel="Keep booking"
    >
      {isRefundable ? "Cancel booking and refund" : "Cancel booking"}
    </ConfirmActionDialog>
  );
}
