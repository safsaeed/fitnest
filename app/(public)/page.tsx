import { Card } from "@/components/ui/card";
import { LoadingButtonLink } from "@/components/ui/loading-button-link";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex min-h-(--min-page-height) items-center justify-center bg-[url('/bg.webp')] bg-cover bg-center bg-no-repeat px-6 pb-10 sm:py-10">
      <Card className="max-w-xl">
        <p className="text-lg font-medium tracking-wide text-(--color-brand)">
          FitNest Studios
        </p>

        <h1 className="mt-4 text-2xl font-semibold">
          Supervised children&apos;s sessions brought to gyms and sports venues.
        </h1>

        <ul className="mt-4 flex flex-col gap-2">
          <li>Qualified supervisors</li>
          <li>Safe and engaging environment</li>
          <li>Flexible scheduling</li>
          <li>Affordable pricing</li>
        </ul>

        <p className="mt-4 text-(--color-text-secondary)">
          Book on-site children&apos;s play sessions at our partner sports
          venues.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <LoadingButtonLink className="flex-1" href="/book">
            Book session
          </LoadingButtonLink>

          <LoadingButtonLink
            className="flex-1"
            variant="secondary"
            href="/booking/search"
          >
            Find my booking
          </LoadingButtonLink>
        </div>

        <div className="mt-6 rounded-lg bg-(--color-brand-soft) p-4">
          <p className="text-sm font-medium">
            Can&apos;t find a venue near you?
          </p>

          <p className="mt-1 text-sm text-(--color-text-secondary)">
            Tell us where you&apos;d like to see future FitNest sessions.
          </p>

          <LoadingButtonLink
            href="/register-interest"
            variant="ghost"
            size="custom"
            className="mt-3 p-0 text-sm hover:bg-transparent hover:brightness-130"
          >
            Register your interest →
          </LoadingButtonLink>
        </div>
      </Card>
    </main>
  );
}
