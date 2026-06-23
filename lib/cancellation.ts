import {
  getSessionCutoffLabel,
  isPastSessionCutoff,
} from "@/lib/session-cutoff";

export function canCancelBooking(sessionStartsAt: Date) {
  return !isPastSessionCutoff(sessionStartsAt);
}

export function getCancellationStatus(sessionStartsAt: Date) {
  const canCancel = canCancelBooking(sessionStartsAt);

  return {
    canCancel,
    message: canCancel
      ? "This booking can be cancelled for a refund."
      : getSessionCutoffLabel("cancellation"),
  };
}
