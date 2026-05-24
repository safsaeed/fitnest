import { Card } from "@/components/ui/card";
import { LoadingButtonLink } from "@/components/ui/loading-button-link";
import { prisma } from "@/lib/prisma";

type PaymentSuccessPageProps = {
  searchParams?: Promise<{
    booking?: string;
    session_id?: string;
  }>;
};

export default async function PaymentSuccessPage({
  searchParams,
}: PaymentSuccessPageProps) {
  const params = await searchParams;
  const bookingReference = params?.booking;

  const booking = bookingReference
    ? await prisma.booking.findUnique({
        where: {
          bookingReference,
        },
      })
    : null;

  return (
    <main className="min-h-(--min-page-height) flex items-center justify-center p-4">
      <Card className="max-w-md">
        <p className="text-sm font-medium uppercase tracking-wide text-(--color-success) rounded-lg bg-(--color-success-soft) px-3 py-1 w-fit">
          Payment complete
        </p>

        <h1 className="mt-4 text-3xl font-semibold">
          Thanks, your payment was successful
        </h1>

        <p className="mt-4 text-(--color-text-secondary)">
          Your booking is being confirmed. This usually happens straight away,
          but may take a few seconds while payment confirmation is processed.
        </p>

        {bookingReference && (
          <div className="mt-4 rounded-lg border border-gray-200 bg-[#fdfdfd] p-4">
            <p>Your booking reference is:</p>
            <p className="mt-2 text-lg font-semibold">{bookingReference}</p>

            {booking && (
              <p className="mt-2 text-xs text-(--color-text-secondary)">
                Current status: {booking.status} / {booking.paymentStatus}
              </p>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-center gap-4 flex-col sm:flex-row">
          <LoadingButtonLink href="/" className="w-full sm:w-1/2">
            Back to home
          </LoadingButtonLink>
          <LoadingButtonLink
            href="/book"
            variant="secondary"
            className="w-full sm:w-1/2"
          >
            Book another session
          </LoadingButtonLink>
        </div>
      </Card>
    </main>
  );
}
