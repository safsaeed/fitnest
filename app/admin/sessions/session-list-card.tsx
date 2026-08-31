import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { Button } from "@/components/ui/button";
import {
  AdminList,
  AdminListCard,
  AdminListCardHeader,
  AdminListMeta,
  AdminListMetaItem,
} from "@/components/ui/admin-list";
import { LoadingButtonLink } from "@/components/ui/loading-button-link";
import { getBookedChildrenCount } from "@/lib/availability";
import {
  formatDateTime,
  formatFullDateTime,
  formatLongDate,
  formatPrice,
} from "@/lib/formatters";
import { getRepeatPatternLabel } from "@/lib/session-series";
import {
  activateSession,
  deactivateSession,
  deleteSession,
  deleteSessionSeries,
} from "./actions";

export type AdminSessionItem = {
  id: string;
  seriesId: string | null;
  title: string;
  startsAt: Date;
  endsAt: Date;
  capacity: number;
  pricePence: number;
  memberPricePence: number | null;
  minAge: number | null;
  maxAge: number | null;
  isActive: boolean;
  venue: {
    name: string;
  };
  bookings: Array<{
    childCount: number;
  }>;
  _count: {
    bookings: number;
  };
};

export type AdminSessionSeriesSummary = {
  id: string;
  title: string;
  repeatPattern: string;
  startsOn: Date;
  endsOn: Date;
  totalSessions: number;
  bookingCount: number;
  venueCount: number;
};

export function SessionOccurrenceCard({
  session,
}: {
  session: AdminSessionItem;
}) {
  const bookedChildren = getBookedChildrenCount(session.bookings);
  const bookingCount = session._count.bookings;

  return (
    <AdminListCard
      className={session.isActive ? "" : "border-(--color-danger)!"}
    >
      <AdminListCardHeader
        title={session.title}
        subtitle={session.venue.name}
        badge={
          <span
            className={`rounded-md border px-2 py-px text-md font-medium ${
              session.isActive
                ? "border-(--color-success-soft) bg-(--color-success-soft) text-(--color-success)"
                : "border-(--color-danger) bg-(--color-danger-soft) text-(--color-danger)"
            }`}
          >
            {session.isActive ? "Active" : "Inactive"}
          </span>
        }
        actions={
          <>
            <LoadingButtonLink
              href={`/admin/sessions/${session.id}/register`}
              className="w-24"
            >
              Register
            </LoadingButtonLink>

            <LoadingButtonLink
              href={`/admin/sessions/${session.id}/edit`}
              variant="secondary"
              className="w-24"
            >
              Edit
            </LoadingButtonLink>

            {session.isActive ? (
              <ConfirmActionDialog
                action={deactivateSession.bind(null, session.id)}
                title="Deactivate this session?"
                description={`Customers will no longer be able to book "${session.title}" while it is inactive.`}
                confirmLabel="Deactivate"
              >
                Deactivate
              </ConfirmActionDialog>
            ) : (
              <ConfirmActionDialog
                action={activateSession.bind(null, session.id)}
                title="Activate this session?"
                description={`Customers will be able to book "${session.title}" again if it has availability.`}
                confirmLabel="Activate"
              >
                Activate
              </ConfirmActionDialog>
            )}

            {bookingCount === 0 ? (
              <ConfirmActionDialog
                action={deleteSession.bind(null, session.id)}
                title="Delete session?"
                description={
                  <div className="space-y-3">
                    <p>
                      This session has no bookings and can be permanently
                      deleted.
                    </p>
                    <div className="font-medium text-(--color-text-primary)">
                      <p>{session.title}</p>
                      <p>{formatFullDateTime(session.startsAt)}</p>
                      <p>{session.venue.name}</p>
                    </div>
                    <p>
                      Only this occurrence will be deleted. This action cannot
                      be undone.
                    </p>
                  </div>
                }
                confirmLabel="Delete session"
              >
                Delete
              </ConfirmActionDialog>
            ) : (
              <div className="relative flex flex-col items-start gap-1">
                <Button
                  type="button"
                  variant="destructive"
                  className="min-w-25"
                  disabled
                  title="Sessions with bookings cannot be deleted."
                >
                  Delete
                </Button>
                <span className="absolute right-0 top-10 max-w-32 text-xs text-(--color-danger)">
                  {bookingCount} booking{bookingCount === 1 ? "" : "s"}
                </span>
              </div>
            )}
          </>
        }
      />

      <AdminListMeta>
        <AdminListMetaItem
          label="Date/ Time"
          value={
            <>
              <p>{formatDateTime(session.startsAt)}</p>
              <p className="text-xs text-(--color-text-secondary)">
                {formatDateTime(session.endsAt)}
              </p>
            </>
          }
        />
        <AdminListMetaItem
          label="Ages"
          value={`${session.minAge !== null ? session.minAge : "—"}–${
            session.maxAge !== null ? session.maxAge : "—"
          }`}
        />
        <AdminListMetaItem
          label="Booked"
          value={`${bookedChildren} / ${session.capacity}`}
        />
        <AdminListMetaItem
          label="Standard price"
          value={formatPrice(session.pricePence)}
        />
        <AdminListMetaItem
          label="Member price"
          value={
            session.memberPricePence !== null
              ? formatPrice(session.memberPricePence)
              : "—"
          }
        />
      </AdminListMeta>
    </AdminListCard>
  );
}

export function SessionSeriesCard({
  series,
  occurrences,
  filteredVenueName,
  filteredStatus,
}: {
  series: AdminSessionSeriesSummary;
  occurrences: AdminSessionItem[];
  filteredVenueName?: string;
  filteredStatus?: "active" | "inactive";
}) {
  return (
    <AdminListCard className="border-2 border-(--color-brand-border)">
      <AdminListCardHeader
        title={series.title}
        subtitle={
          <div className="space-y-1">
            <p>
              {getRepeatPatternLabel(series.repeatPattern)} ·{" "}
              {formatLongDate(series.startsOn)}–{formatLongDate(series.endsOn)}
            </p>
            <p>
              Showing {occurrences.length}
              {filteredStatus ? ` ${filteredStatus}` : ""} occurrence
              {occurrences.length === 1 ? "" : "s"} of {series.totalSessions}
              total
              {filteredVenueName
                ? ` at ${filteredVenueName}`
                : series.venueCount > 1
                  ? ` across ${series.venueCount} venues`
                  : ""}
              .
            </p>
          </div>
        }
        badge={
          <span className="rounded-md border border-(--color-brand-border) bg-(--color-brand-soft) px-2 py-px text-sm font-medium text-(--color-brand)">
            Repeating series
          </span>
        }
        actions={
          <>
            <LoadingButtonLink
              href={`/admin/sessions/series/${series.id}/edit`}
              variant="secondary"
            >
              Edit series
            </LoadingButtonLink>

            {series.bookingCount === 0 ? (
              <ConfirmActionDialog
                action={deleteSessionSeries.bind(null, series.id)}
                title="Delete entire series?"
                description={
                  <div className="space-y-3">
                    <p className="font-medium text-(--color-text-primary)">
                      {series.title}
                    </p>
                    <p>
                      All {series.totalSessions} occurrence
                      {series.totalSessions === 1 ? "" : "s"} in this series
                      have no bookings and will be permanently deleted.
                    </p>
                    <p>
                      This deletes the entire series, including past and future
                      occurrences. This action cannot be undone.
                    </p>
                  </div>
                }
                confirmLabel="Delete entire series"
              >
                Delete series
              </ConfirmActionDialog>
            ) : (
              <div className="relative flex flex-col items-start gap-1">
                <Button
                  type="button"
                  variant="destructive"
                  className="min-w-25"
                  disabled
                  title="A series with bookings cannot be deleted."
                >
                  Delete series
                </Button>
                <span className="absolute right-0 top-10 max-w-40 text-right text-xs text-(--color-danger)">
                  {series.bookingCount} booking
                  {series.bookingCount === 1 ? "" : "s"} across series
                </span>
              </div>
            )}
          </>
        }
      />

      <details className="mt-6 rounded-lg bg-(--color-brand-soft) p-4">
        <summary className="cursor-pointer font-medium text-(--color-brand)">
          View matching occurrences ({occurrences.length})
        </summary>
        <AdminList className="mt-4">
          {occurrences.map((session) => (
            <SessionOccurrenceCard key={session.id} session={session} />
          ))}
        </AdminList>
      </details>
    </AdminListCard>
  );
}
