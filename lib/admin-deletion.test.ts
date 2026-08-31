import assert from "node:assert/strict";
import test from "node:test";

import {
  safelyDeleteSession,
  safelyDeleteSessionSeries,
  safelyDeleteVenue,
} from "./admin-deletion";

const ADMIN_ID = "cm12345678901234567890123";
const SESSION_ID = "cm22345678901234567890123";
const VENUE_ID = "cm32345678901234567890123";
const SERIES_ID = "cm42345678901234567890123";

type TestState = {
  admins: Map<string, { isActive: boolean; role: "OWNER" | "ADMIN" }>;
  sessions: Map<
    string,
    {
      venueId: string;
      seriesId: string | null;
      bookingIds: string[];
      startsAt: Date;
    }
  >;
  venues: Map<string, { sessionIds: string[] }>;
  series: Map<string, { sessionIds: string[] }>;
  sessionDeleteError?: unknown;
  venueDeleteError?: unknown;
};

function createState(): TestState {
  return {
    admins: new Map([
      [ADMIN_ID, { isActive: true, role: "ADMIN" }],
    ]),
    sessions: new Map(),
    venues: new Map(),
    series: new Map(),
  };
}

function addVenue(state: TestState, venueId = VENUE_ID) {
  state.venues.set(venueId, { sessionIds: [] });
}

function addSession({
  state,
  sessionId = SESSION_ID,
  venueId = VENUE_ID,
  bookingCount = 0,
  seriesId = null,
  startsAt = new Date("2027-01-01T10:00:00Z"),
}: {
  state: TestState;
  sessionId?: string;
  venueId?: string;
  bookingCount?: number;
  seriesId?: string | null;
  startsAt?: Date;
}) {
  if (!state.venues.has(venueId)) {
    addVenue(state, venueId);
  }

  state.sessions.set(sessionId, {
    venueId,
    seriesId,
    bookingIds: Array.from(
      { length: bookingCount },
      (_, index) => `booking-${index + 1}`,
    ),
    startsAt,
  });
  state.venues.get(venueId)!.sessionIds.push(sessionId);

  if (seriesId) {
    const series = state.series.get(seriesId) ?? { sessionIds: [] };
    series.sessionIds.push(sessionId);
    state.series.set(seriesId, series);
  }
}

function createClient(state: TestState) {
  const client = {
    adminUser: {
      async findFirst({ where }: { where: { id: string } }) {
        const admin = state.admins.get(where.id);
        return admin?.isActive ? { id: where.id } : null;
      },
    },
    session: {
      async deleteMany({
        where,
      }: {
        where: { id?: string; seriesId?: string };
      }) {
        if (state.sessionDeleteError) {
          throw state.sessionDeleteError;
        }

        if (where.seriesId) {
          const series = state.series.get(where.seriesId);

          if (!series) {
            return { count: 0 };
          }

          const sessions = series.sessionIds
            .map((id) => state.sessions.get(id))
            .filter((session) => session !== undefined);

          if (sessions.some((session) => session.bookingIds.length > 0)) {
            throw { code: "P2003" };
          }

          for (const sessionId of series.sessionIds) {
            state.sessions.delete(sessionId);
          }

          const count = series.sessionIds.length;
          series.sessionIds = [];
          return { count };
        }

        const session = where.id ? state.sessions.get(where.id) : undefined;

        if (!session || session.bookingIds.length > 0) {
          return { count: 0 };
        }

        state.sessions.delete(where.id!);
        const venue = state.venues.get(session.venueId);
        if (venue) {
          venue.sessionIds = venue.sessionIds.filter((id) => id !== where.id);
        }
        if (session.seriesId) {
          const series = state.series.get(session.seriesId);
          if (series) {
            series.sessionIds = series.sessionIds.filter(
              (id) => id !== where.id,
            );
          }
        }

        return { count: 1 };
      },
      async findUnique({ where }: { where: { id: string } }) {
        const session = state.sessions.get(where.id);
        return session
          ? { _count: { bookings: session.bookingIds.length } }
          : null;
      },
    },
    venue: {
      async deleteMany({ where }: { where: { id: string } }) {
        if (state.venueDeleteError) {
          throw state.venueDeleteError;
        }

        const venue = state.venues.get(where.id);

        if (!venue || venue.sessionIds.length > 0) {
          return { count: 0 };
        }

        state.venues.delete(where.id);
        return { count: 1 };
      },
      async findUnique({ where }: { where: { id: string } }) {
        const venue = state.venues.get(where.id);
        return venue
          ? { _count: { sessions: venue.sessionIds.length } }
          : null;
      },
    },
    sessionSeries: {
      async findUnique({ where }: { where: { id: string } }) {
        return state.series.has(where.id) ? { id: where.id } : null;
      },
      async deleteMany({ where }: { where: { id: string } }) {
        if (!state.series.has(where.id)) {
          return { count: 0 };
        }

        state.series.delete(where.id);
        return { count: 1 };
      },
    },
    booking: {
      async count({ where }: { where: { session: { seriesId: string } } }) {
        const series = state.series.get(where.session.seriesId);

        return (series?.sessionIds ?? []).reduce(
          (total, sessionId) =>
            total + (state.sessions.get(sessionId)?.bookingIds.length ?? 0),
          0,
        );
      },
    },
  };

  Object.assign(client, {
    async $transaction<T>(callback: (transaction: typeof client) => Promise<T>) {
      return callback(client);
    },
  });

  return client as unknown as Parameters<typeof safelyDeleteSession>[0] &
    Parameters<typeof safelyDeleteSessionSeries>[0];
}

test("admin can delete a session with zero bookings", async () => {
  const state = createState();
  addSession({ state });

  const result = await safelyDeleteSession(
    createClient(state),
    ADMIN_ID,
    SESSION_ID,
  );

  assert.deepEqual(result, { success: true, message: "Session deleted." });
  assert.equal(state.sessions.has(SESSION_ID), false);
});

for (const bookingCount of [1, 3]) {
  test(`admin cannot delete a session with ${bookingCount} booking${bookingCount === 1 ? "" : "s"}`, async () => {
    const state = createState();
    addSession({ state, bookingCount });

    const result = await safelyDeleteSession(
      createClient(state),
      ADMIN_ID,
      SESSION_ID,
    );

    assert.equal(result.success, false);
    assert.equal(result.success ? null : result.code, "blocked");
    assert.equal(state.sessions.has(SESSION_ID), true);
    assert.equal(
      state.sessions.get(SESSION_ID)?.bookingIds.length,
      bookingCount,
    );
  });
}

test("non-admin cannot delete a session", async () => {
  const state = createState();
  addSession({ state });

  const result = await safelyDeleteSession(createClient(state), null, SESSION_ID);

  assert.equal(result.success, false);
  assert.equal(result.success ? null : result.code, "unauthorized");
  assert.equal(state.sessions.has(SESSION_ID), true);
});

test("invalid and nonexistent session IDs are handled safely", async () => {
  const state = createState();
  addSession({ state });

  for (const sessionId of ["not-a-cuid", "cm99999999999999999999999"]) {
    const result = await safelyDeleteSession(
      createClient(state),
      ADMIN_ID,
      sessionId,
    );

    assert.equal(result.success, false);
    assert.equal(result.success ? null : result.code, "not-found");
  }

  assert.equal(state.sessions.has(SESSION_ID), true);
});

test("admin can delete a venue with zero sessions", async () => {
  const state = createState();
  addVenue(state);

  const result = await safelyDeleteVenue(
    createClient(state),
    ADMIN_ID,
    VENUE_ID,
  );

  assert.deepEqual(result, { success: true, message: "Venue deleted." });
  assert.equal(state.venues.has(VENUE_ID), false);
});

for (const [label, startsAt] of [
  ["future", new Date("2027-01-01T10:00:00Z")],
  ["past", new Date("2020-01-01T10:00:00Z")],
] as const) {
  test(`admin cannot delete a venue with a ${label} session`, async () => {
    const state = createState();
    addSession({ state, startsAt });

    const result = await safelyDeleteVenue(
      createClient(state),
      ADMIN_ID,
      VENUE_ID,
    );

    assert.equal(result.success, false);
    assert.equal(result.success ? null : result.code, "blocked");
    assert.equal(state.venues.has(VENUE_ID), true);
    assert.equal(state.sessions.has(SESSION_ID), true);
    assert.equal(state.sessions.get(SESSION_ID)?.startsAt, startsAt);
  });
}

test("non-admin cannot delete a venue", async () => {
  const state = createState();
  addVenue(state);

  const result = await safelyDeleteVenue(createClient(state), null, VENUE_ID);

  assert.equal(result.success, false);
  assert.equal(result.success ? null : result.code, "unauthorized");
  assert.equal(state.venues.has(VENUE_ID), true);
});

test("invalid and nonexistent venue IDs are handled safely", async () => {
  const state = createState();
  addVenue(state);

  for (const venueId of ["not-a-cuid", "cm99999999999999999999999"]) {
    const result = await safelyDeleteVenue(
      createClient(state),
      ADMIN_ID,
      venueId,
    );

    assert.equal(result.success, false);
    assert.equal(result.success ? null : result.code, "not-found");
  }

  assert.equal(state.venues.has(VENUE_ID), true);
});

test("a concurrent booking foreign key race leaves the session untouched", async () => {
  const state = createState();
  addSession({ state });
  const client = createClient(state);
  state.sessionDeleteError = {
    code: "P2003",
    message: "raw constraint details",
  };

  const sessionResult = await safelyDeleteSession(client, ADMIN_ID, SESSION_ID);

  assert.deepEqual(sessionResult, {
    success: false,
    code: "blocked",
    message: "This session cannot be deleted because it has bookings.",
  });
  assert.equal(state.sessions.has(SESSION_ID), true);
});

test("a concurrent session foreign key race leaves the venue untouched", async () => {
  const state = createState();
  addSession({ state });
  const client = createClient(state);

  state.venueDeleteError = {
    code: "P2003",
    message: "raw constraint details",
  };

  const venueResult = await safelyDeleteVenue(client, ADMIN_ID, VENUE_ID);

  assert.deepEqual(venueResult, {
    success: false,
    code: "blocked",
    message:
      "This venue cannot be deleted because sessions are associated with it.",
  });
  assert.equal(state.venues.has(VENUE_ID), true);
});

test("admin can delete an entire unbooked session series", async () => {
  const state = createState();
  addSession({ state, seriesId: SERIES_ID });
  addSession({
    state,
    sessionId: "cm52345678901234567890123",
    seriesId: SERIES_ID,
  });

  const result = await safelyDeleteSessionSeries(
    createClient(state),
    ADMIN_ID,
    SERIES_ID,
  );

  assert.deepEqual(result, {
    success: true,
    message: "Session series deleted.",
  });
  assert.equal(state.series.has(SERIES_ID), false);
  assert.equal(state.sessions.size, 0);
});

test("one booking blocks the entire series deletion without partial changes", async () => {
  const state = createState();
  addSession({ state, seriesId: SERIES_ID });
  addSession({
    state,
    sessionId: "cm52345678901234567890123",
    seriesId: SERIES_ID,
    bookingCount: 1,
  });

  const result = await safelyDeleteSessionSeries(
    createClient(state),
    ADMIN_ID,
    SERIES_ID,
  );

  assert.deepEqual(result, {
    success: false,
    code: "blocked",
    message:
      "This series cannot be deleted because one or more sessions have bookings.",
  });
  assert.equal(state.series.has(SERIES_ID), true);
  assert.equal(state.sessions.size, 2);
});

test("non-admin and invalid series deletion requests are rejected", async () => {
  const state = createState();
  addSession({ state, seriesId: SERIES_ID });
  const client = createClient(state);

  const unauthorized = await safelyDeleteSessionSeries(
    client,
    null,
    SERIES_ID,
  );
  const invalid = await safelyDeleteSessionSeries(
    client,
    ADMIN_ID,
    "not-a-cuid",
  );

  assert.equal(unauthorized.success, false);
  assert.equal(unauthorized.success ? null : unauthorized.code, "unauthorized");
  assert.equal(invalid.success, false);
  assert.equal(invalid.success ? null : invalid.code, "not-found");
  assert.equal(state.series.has(SERIES_ID), true);
  assert.equal(state.sessions.size, 1);
});
