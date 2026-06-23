import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateVenue } from "../../actions";
import { VenueForm } from "../../venue-form";
import { ButtonLink } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

type EditVenuePageProps = {
  params: Promise<{
    venueId: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function EditVenuePage({
  params,
  searchParams,
}: EditVenuePageProps) {
  const { venueId } = await params;
  const query = await searchParams;

  const venue = await prisma.venue.findUnique({
    where: {
      id: venueId,
    },
  });

  if (!venue) {
    notFound();
  }

  const updateVenueWithId = updateVenue.bind(null, venue.id);

  return (
    <main className="min-h-(--min-page-height)">
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="pb-10 sm:py-10">
          <Breadcrumbs
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Venues", href: "/admin/venues" },
              { label: venue.name, href: `/admin/venues/${venue.id}/edit` },
            ]}
          />

          <h1 className="mt-3 text-3xl font-semibold">Edit venue</h1>

          <p className="mt-2 flex items-center gap-2 text-sm text-(--color-text-secondary)">
            Update venue details and status.
          </p>

          <ButtonLink
            href="/admin/venues"
            variant="ghost"
            size="custom"
            className="mt-6 p-0 text-sm text-(--color-brand) hover:bg-transparent hover:brightness-130"
          >
            <span className="flex items-center">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Venues
            </span>
          </ButtonLink>
        </div>

        <VenueForm
          venue={venue}
          action={updateVenueWithId}
          submitLabel="Save changes"
          error={query?.error}
        />
      </section>
    </main>
  );
}
