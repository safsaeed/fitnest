"use client";

import { ConfirmActionDialog } from "@/components/confirm-action-dialog";

type CancelBookingFormProps = {
  bookingReference: string;
  token: string;
};

export function CancelBookingForm({
  bookingReference,
  token,
}: CancelBookingFormProps) {
  return (
    <ConfirmActionDialog
      formAction="/api/bookings/cancel"
      formMethod="POST"
      hiddenFields={[
        { name: "bookingReference", value: bookingReference },
        { name: "token", value: token },
      ]}
      title="Cancel and refund this booking?"
      description="This will cancel the booking and start a refund. This action cannot usually be undone."
      confirmLabel="Yes, cancel and refund"
      cancelLabel="Keep booking"
    >
      Cancel booking and refund
    </ConfirmActionDialog>
  );
}