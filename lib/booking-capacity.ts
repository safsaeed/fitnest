import {
  validateBookingAvailability,
  type BookingForAvailability,
} from "./availability";
import {
  validateStaffingAvailability,
  type ChildForStaffing,
} from "./staffing";

type ConfirmedBookingForCapacity = BookingForAvailability & {
  children: ChildForStaffing[];
};

type SessionForBookingCapacity = {
  capacity: number;
  startsAt: Date;
  isActive: boolean;
  bookings: ConfirmedBookingForCapacity[];
};

export function validateBookingCapacity({
  session,
  requestedChildren,
  now,
}: {
  session: SessionForBookingCapacity;
  requestedChildren: ChildForStaffing[];
  now?: Date;
}) {
  const availabilityCheck = validateBookingAvailability({
    session,
    requestedChildCount: requestedChildren.length,
    now,
  });

  if (!availabilityCheck.ok) {
    return {
      ok: false as const,
      constraint: "SESSION" as const,
      reason: availabilityCheck.reason,
      availability: availabilityCheck.availability,
    };
  }

  const staffingCheck = validateStaffingAvailability({
    existingChildren: session.bookings.flatMap(
      (booking) => booking.children,
    ),
    requestedChildren,
    sessionDate: session.startsAt,
  });

  if (!staffingCheck.ok) {
    return {
      ok: false as const,
      constraint: "STAFFING" as const,
      reason: staffingCheck.reason,
      availability: availabilityCheck.availability,
      staffing: staffingCheck,
    };
  }

  return {
    ok: true as const,
    availability: availabilityCheck.availability,
    staffing: staffingCheck,
  };
}
