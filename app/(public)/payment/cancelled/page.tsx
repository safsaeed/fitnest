import { Card } from "@/components/ui/card";
import { LoadingButtonLink } from "@/components/ui/loading-button-link";
import { prisma } from "@/lib/prisma";

type PaymentCancelledPageProps = {
  searchParams?: Promise<{
    booking?: string;
  }>;
};

export default async function PaymentCancelledPage({
  searchParams,
}: PaymentCancelledPageProps) {
  const params = await searchParams;
  const bookingReference = params?.booking;

  const booking = bookingReference
    ? await prisma.booking.findUnique({
        where: {
          bookingReference,
        },
        include: {
          session: {
            include: {
              venue: true,
            },
          },
        },
      })
    : null;

  return (
    <main className="min-h-(--min-page-height) flex items-center justify-center p-4">
      <Card className="max-w-md">
        <p className="text-sm font-medium uppercase tracking-wide text-(--color-danger) rounded-lg bg-(--color-danger-soft) px-3 py-1 w-fit">
          Payment cancelled
        </p>

        <h1 className="mt-4 text-3xl font-semibold text-gray-900">
          Your booking has not been confirmed
        </h1>

        <p className="mt-4 text-(--color-text-secondary)">
          Payment was cancelled or not completed. No confirmed booking has been
          made.
        </p>

        {booking && (
          <div className="mt-4 rounded-lg border border-gray-200 bg-[#fdfdfd] p-4">
            <p>
              <span className="text-(--color-text-secondary)">
                Booking reference:
              </span>{" "}
              {booking.bookingReference}
            </p>
            <p className="mt-2">
              <span className="text-(--color-text-secondary)">Session:</span>{" "}
              {booking.session.title}
            </p>
            <p className="mt-2">
              <span className="text-(--color-text-secondary)">Venue:</span>{" "}
              {booking.session.venue.name}
            </p>
            <p className="mt-2">
              <span className="text-(--color-text-secondary)">Status:</span>{" "}
              {booking.status}
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-center gap-4 flex-col sm:flex-row">
          {booking ? (
            <LoadingButtonLink
              className="w-full sm:w-1/2"
              href={`/book/${booking.session.venueId}/${booking.sessionId}`}
            >
              Try payment again
            </LoadingButtonLink>
          ) : (
            <LoadingButtonLink href="/" className="w-full sm:w-1/2">
              Back to home
            </LoadingButtonLink>
          )}

          <LoadingButtonLink
            href="/book"
            variant="secondary"
            className="w-full sm:w-1/2"
          >
            Pick another session
          </LoadingButtonLink>
        </div>
      </Card>
    </main>
  );
}
