const REFUND_WINDOW_MS = 24 * 60 * 60 * 1000;

export function getRefundDeadlineAt(sessionStartsAt: Date) {
  return new Date(sessionStartsAt.getTime() - REFUND_WINDOW_MS);
}

export function canCancelBooking(
  sessionStartsAt: Date,
  now = new Date(),
) {
  return now < sessionStartsAt;
}

export function isCancellationRefundable(
  sessionStartsAt: Date,
  now = new Date(),
) {
  return canCancelBooking(sessionStartsAt, now) &&
    now <= getRefundDeadlineAt(sessionStartsAt);
}

export function getCancellationStatus(
  sessionStartsAt: Date,
  now = new Date(),
) {
  const canCancel = canCancelBooking(sessionStartsAt, now);
  const isRefundable = isCancellationRefundable(sessionStartsAt, now);

  let message =
    "This booking can be cancelled for a full refund until 24 hours before the session.";

  if (!canCancel) {
    message = "This booking can no longer be cancelled because the session has started.";
  } else if (!isRefundable) {
    message =
      "This booking can still be cancelled, but cancellations within 24 hours of the session are non-refundable.";
  }

  return {
    canCancel,
    isRefundable,
    refundDeadlineAt: getRefundDeadlineAt(sessionStartsAt),
    message,
  };
}
