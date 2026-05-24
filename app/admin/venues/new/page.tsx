import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ButtonLink } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { createVenue } from "../actions";
import { VenueForm } from "../venue-form";

type NewVenuePageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function NewVenuePage({
  searchParams,
}: NewVenuePageProps) {
  const params = await searchParams;

  return (
    <main className="min-h-(--min-page-height)">
      <section className="mx-auto max-w-5xl px-6 py-8">
        <div className="pb-10 sm:py-10">
          <Breadcrumbs
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Venues", href: "/admin/venues" },
              { label: "New venue", href: "/admin/venues/new" },
            ]}
          />

          <h1 className="mt-3 text-3xl font-semibold">Add venue</h1>

          <p className="mt-2 flex items-center gap-2 text-sm text-(--color-text-secondary)">
            Create a new partner venue.
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
          action={createVenue}
          submitLabel="Create venue"
          error={params?.error}
        />
      </section>
    </main>
  );
}
