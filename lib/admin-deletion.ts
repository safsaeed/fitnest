import type { PrismaClient } from "@prisma/client";
import { z } from "zod";

type AdminDeletionClient = Pick<
  PrismaClient,
  "adminUser" | "session" | "venue"
>;

type AdminAuthorizationClient = Pick<PrismaClient, "adminUser">;
type AdminSeriesDeletionClient = Pick<
  PrismaClient,
  "adminUser" | "$transaction"
>;

export type AdminDeletionResult =
  | { success: true; message: string }
  | {
      success: false;
      code: "unauthorized" | "not-found" | "blocked" | "database-error";
      message: string;
    };

const recordIdSchema = z.cuid();

const UNAUTHORIZED_MESSAGE =
  "You are not authorized to perform this deletion.";
const SESSION_NOT_FOUND_MESSAGE = "This session could not be found.";
const SESSION_BLOCKED_MESSAGE =
  "This session cannot be deleted because it has bookings.";
const SESSION_DATABASE_ERROR_MESSAGE =
  "The session could not be deleted. Please try again.";
const SERIES_NOT_FOUND_MESSAGE = "This session series could not be found.";
const SERIES_BLOCKED_MESSAGE =
  "This series cannot be deleted because one or more sessions have bookings.";
const SERIES_DATABASE_ERROR_MESSAGE =
  "The session series could not be deleted. Please try again.";
const VENUE_NOT_FOUND_MESSAGE = "This venue could not be found.";
const VENUE_BLOCKED_MESSAGE =
  "This venue cannot be deleted because sessions are associated with it.";
const VENUE_DATABASE_ERROR_MESSAGE =
  "The venue could not be deleted. Please try again.";

class SessionSeriesDisappearedError extends Error {}

function getPrismaErrorCode(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }

  return null;
}

export async function isAuthorizedAdmin(
  client: AdminAuthorizationClient,
  adminUserId: string | null,
) {
  if (!adminUserId) {
    return false;
  }

  const admin = await client.adminUser.findFirst({
    where: {
      id: adminUserId,
      isActive: true,
      role: {
        in: ["OWNER", "ADMIN"],
      },
    },
    select: {
      id: true,
    },
  });

  return admin !== null;
}

export async function safelyDeleteSessionSeries(
  client: AdminSeriesDeletionClient,
  adminUserId: string | null,
  seriesId: string,
): Promise<AdminDeletionResult> {
  if (!(await isAuthorizedAdmin(client, adminUserId))) {
    return {
      success: false,
      code: "unauthorized",
      message: UNAUTHORIZED_MESSAGE,
    };
  }

  if (!recordIdSchema.safeParse(seriesId).success) {
    return {
      success: false,
      code: "not-found",
      message: SERIES_NOT_FOUND_MESSAGE,
    };
  }

  try {
    return await client.$transaction(async (transaction) => {
      const series = await transaction.sessionSeries.findUnique({
        where: {
          id: seriesId,
        },
        select: {
          id: true,
        },
      });

      if (!series) {
        return {
          success: false,
          code: "not-found",
          message: SERIES_NOT_FOUND_MESSAGE,
        } as const;
      }

      const bookingCount = await transaction.booking.count({
        where: {
          session: {
            seriesId,
          },
        },
      });

      if (bookingCount > 0) {
        return {
          success: false,
          code: "blocked",
          message: SERIES_BLOCKED_MESSAGE,
        } as const;
      }

      // Sessions are deliberately deleted explicitly before their series.
      // There is no cascade from SessionSeries, and Booking -> Session remains
      // restrictive if a booking is created concurrently.
      await transaction.session.deleteMany({
        where: {
          seriesId,
        },
      });

      const deletedSeries = await transaction.sessionSeries.deleteMany({
        where: {
          id: seriesId,
        },
      });

      if (deletedSeries.count !== 1) {
        // Throw so the transaction rolls back the preceding session deletes.
        throw new SessionSeriesDisappearedError();
      }

      return {
        success: true,
        message: "Session series deleted.",
      } as const;
    });
  } catch (error) {
    if (error instanceof SessionSeriesDisappearedError) {
      return {
        success: false,
        code: "not-found",
        message: SERIES_NOT_FOUND_MESSAGE,
      };
    }

    if (getPrismaErrorCode(error) === "P2003") {
      return {
        success: false,
        code: "blocked",
        message: SERIES_BLOCKED_MESSAGE,
      };
    }

    console.error("Failed to delete session series", error);

    return {
      success: false,
      code: "database-error",
      message: SERIES_DATABASE_ERROR_MESSAGE,
    };
  }
}

export async function safelyDeleteSession(
  client: AdminDeletionClient,
  adminUserId: string | null,
  sessionId: string,
): Promise<AdminDeletionResult> {
  if (!(await isAuthorizedAdmin(client, adminUserId))) {
    return {
      success: false,
      code: "unauthorized",
      message: UNAUTHORIZED_MESSAGE,
    };
  }

  if (!recordIdSchema.safeParse(sessionId).success) {
    return {
      success: false,
      code: "not-found",
      message: SESSION_NOT_FOUND_MESSAGE,
    };
  }

  try {
    // The relation predicate makes the eligibility check and delete one atomic
    // statement. The restrictive Booking -> Session foreign key is an
    // additional guard if a booking is created concurrently.
    const deleted = await client.session.deleteMany({
      where: {
        id: sessionId,
        bookings: {
          none: {},
        },
      },
    });

    if (deleted.count === 1) {
      return {
        success: true,
        message: "Session deleted.",
      };
    }

    const existingSession = await client.session.findUnique({
      where: {
        id: sessionId,
      },
      select: {
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });

    if (!existingSession) {
      return {
        success: false,
        code: "not-found",
        message: SESSION_NOT_FOUND_MESSAGE,
      };
    }

    if (existingSession._count.bookings > 0) {
      return {
        success: false,
        code: "blocked",
        message: SESSION_BLOCKED_MESSAGE,
      };
    }

    return {
      success: false,
      code: "database-error",
      message: SESSION_DATABASE_ERROR_MESSAGE,
    };
  } catch (error) {
    if (getPrismaErrorCode(error) === "P2003") {
      return {
        success: false,
        code: "blocked",
        message: SESSION_BLOCKED_MESSAGE,
      };
    }

    console.error("Failed to delete session", error);

    return {
      success: false,
      code: "database-error",
      message: SESSION_DATABASE_ERROR_MESSAGE,
    };
  }
}

export async function safelyDeleteVenue(
  client: AdminDeletionClient,
  adminUserId: string | null,
  venueId: string,
): Promise<AdminDeletionResult> {
  if (!(await isAuthorizedAdmin(client, adminUserId))) {
    return {
      success: false,
      code: "unauthorized",
      message: UNAUTHORIZED_MESSAGE,
    };
  }

  if (!recordIdSchema.safeParse(venueId).success) {
    return {
      success: false,
      code: "not-found",
      message: VENUE_NOT_FOUND_MESSAGE,
    };
  }

  try {
    // This checks all session records, without filtering by date or status, in
    // the same statement that deletes the venue. The restrictive Session ->
    // Venue foreign key remains a second concurrency safeguard.
    const deleted = await client.venue.deleteMany({
      where: {
        id: venueId,
        sessions: {
          none: {},
        },
      },
    });

    if (deleted.count === 1) {
      return {
        success: true,
        message: "Venue deleted.",
      };
    }

    const existingVenue = await client.venue.findUnique({
      where: {
        id: venueId,
      },
      select: {
        _count: {
          select: {
            sessions: true,
          },
        },
      },
    });

    if (!existingVenue) {
      return {
        success: false,
        code: "not-found",
        message: VENUE_NOT_FOUND_MESSAGE,
      };
    }

    if (existingVenue._count.sessions > 0) {
      return {
        success: false,
        code: "blocked",
        message: VENUE_BLOCKED_MESSAGE,
      };
    }

    return {
      success: false,
      code: "database-error",
      message: VENUE_DATABASE_ERROR_MESSAGE,
    };
  } catch (error) {
    if (getPrismaErrorCode(error) === "P2003") {
      return {
        success: false,
        code: "blocked",
        message: VENUE_BLOCKED_MESSAGE,
      };
    }

    console.error("Failed to delete venue", error);

    return {
      success: false,
      code: "database-error",
      message: VENUE_DATABASE_ERROR_MESSAGE,
    };
  }
}
