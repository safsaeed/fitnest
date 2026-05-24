type BookingForAvailability = {
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

export function getSessionAvailability(session: SessionForAvailability) {
  const bookedChildrenCount = getBookedChildrenCount(session.bookings);
  const spacesRemaining = Math.max(session.capacity - bookedChildrenCount, 0);

  const now = new Date();
  const twoHoursFromNow = new Date(now.getTime() + 1000 * 60 * 60 * 2);

  const isWithinBookingCutoff = session.startsAt <= twoHoursFromNow;
  const isFull = spacesRemaining <= 0;
  const isPast = session.startsAt <= now;

  const canBook =
    session.isActive && !isPast && !isFull && !isWithinBookingCutoff;

  let statusLabel = "Available";

  if (!session.isActive) {
    statusLabel = "Unavailable";
  } else if (isPast) {
    statusLabel = "Session expired";
  } else if (isFull) {
    statusLabel = "Fully booked";
  } else if (isWithinBookingCutoff) {
    statusLabel = "Booking closed";
  }

  return {
    bookedChildrenCount,
    spacesRemaining,
    isFull,
    isPast,
    isWithinBookingCutoff,
    canBook,
    statusLabel,
  };
}

export function validateBookingAvailability({
  session,
  requestedChildCount,
}: {
  session: SessionForAvailability;
  requestedChildCount: number;
}) {
  const availability = getSessionAvailability(session);

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

  if (availability.isWithinBookingCutoff) {
    return {
      ok: false as const,
      reason: "Bookings close 2 hours before session start.",
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
