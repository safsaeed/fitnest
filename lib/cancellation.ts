export function canCancelBooking(sessionStartsAt: Date) {
  const now = new Date();
  const twentyFourHoursFromNow = new Date(
    now.getTime() + 1000 * 60 * 60 * 24
  );

  return sessionStartsAt > twentyFourHoursFromNow;
}

export function getCancellationStatus(sessionStartsAt: Date) {
  const canCancel = canCancelBooking(sessionStartsAt);

  return {
    canCancel,
    message: canCancel
      ? "This booking can be cancelled for a refund."
      : "Cancellations are only available more than 24 hours before the session starts.",
  };
}