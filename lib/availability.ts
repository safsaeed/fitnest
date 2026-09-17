export type BookingForAvailability = {
  childCount: number;
};

type SessionForAvailability = {
  capacity: number;
  startsAt: Date;
  isActive: boolean;
  bookings: BookingForAvailability[];
};

export function getBookedChildrenCount(bookings: BookingForAvailability[]) {
  return bookings.reduce((total, booking) => total + booking.childCount, 0);
}

export function getSessionAvailability(
  session: SessionForAvailability,
  now = new Date(),
) {
  const bookedChildrenCount = getBookedChildrenCount(session.bookings);
  const spacesRemaining = Math.max(session.capacity - bookedChildrenCount, 0);

  const isFull = spacesRemaining <= 0;
  const isPast = session.startsAt <= now;

  const canBook = session.isActive && !isPast && !isFull;

  let statusLabel = "Available";

  if (!session.isActive) {
    statusLabel = "Unavailable";
  } else if (isPast) {
    statusLabel = "Session expired";
  } else if (isFull) {
    statusLabel = "Fully booked";
  }

  return {
    bookedChildrenCount,
    spacesRemaining,
    isFull,
    isPast,
    canBook,
    statusLabel,
  };
}

export function validateBookingAvailability({
  session,
  requestedChildCount,
  now = new Date(),
}: {
  session: SessionForAvailability;
  requestedChildCount: number;
  now?: Date;
}) {
  const availability = getSessionAvailability(session, now);

  if (!session.isActive) {
    return {
      ok: false as const,
      reason: "This session is unavailable.",
      availability,
    };
  }

  if (availability.isPast) {
    return {
      ok: false as const,
      reason: "This session has expired.",
      availability,
    };
  }

  if (requestedChildCount > availability.spacesRemaining) {
    return {
      ok: false as const,
      reason: `Only ${availability.spacesRemaining} spaces are remaining for this session.`,
      availability,
    };
  }

  return {
    ok: true as const,
    availability,
  };
}
