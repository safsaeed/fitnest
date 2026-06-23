import {
  ArrowRight,
  CalendarDays,
  Heart,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { LoadingButtonLink } from "@/components/ui/loading-button-link";

const benefits = [
  {
    icon: ShieldCheck,
    title: "A safe, supported space",
    description:
      "Your child can play and relax while you take time for your own wellbeing.",
  },
  {
    icon: CalendarDays,
    title: "Simple to fit around life",
    description:
      "Choose a convenient session at one of our partner gyms and sports venues.",
  },
  {
    icon: Heart,
    title: "Made for families",
    description:
      "A warm, engaging experience that helps parents keep moving without compromise.",
  },
];

export default function HomePage() {
  return (
    <main>
      <section className="relative isolate overflow-hidden border-b border-(--color-brand-soft)">
        <div className="absolute inset-0 -z-20 bg-[url('/bg.webp')] bg-cover bg-center" />
        <div className="absolute inset-0 -z-10 bg-white/75" />

        <div className="mx-auto grid min-h-136 max-w-7xl items-center gap-10 px-6 py-16 sm:px-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)] lg:px-10 lg:py-24">
          <div className="max-w-3xl">
            <h1 className="mt-6 max-w-2xl font-semibold tracking-tight text-2xl md:text-4xl">
              Make time for you, while they have a brilliant time too.
            </h1>

            <p className="mt-6 max-w-xl text-(--color-text-secondary) sm:text-md">
              FitNest Studios brings supervised children&apos;s play sessions to
              gyms and sports venues, making it easier for parents to prioritise
              their health and wellbeing.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LoadingButtonLink href="/book" size="lg">
                <span className="flex gap-2 items-center">
                  Find a session
                  <ArrowRight className="h-4 w-4" />
                </span>
              </LoadingButtonLink>
              <LoadingButtonLink
                href="/booking/search"
                variant="secondary"
                size="lg"
              >
                Find my booking
              </LoadingButtonLink>
            </div>

            <p className="mt-5 text-sm text-(--color-text-secondary)">
              Already booking with us? Create an account to save children and
              manage bookings in one place.
            </p>
            <LoadingButtonLink
              href="/memberships"
              variant="ghost"
              size="custom"
              className="mt-3 p-0 text-sm hover:bg-transparent"
            >
              <span className="flex gap-2 items-center">
                Explore membership benefits
                <ArrowRight className="h-4 w-4" />
              </span>
            </LoadingButtonLink>
          </div>

          <aside className="rounded-lg  bg-white p-6 shadow-md sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-(--color-brand)">
              Designed around real life
            </p>
            <h2 className="mt-3 text-xl font-semibold">
              More freedom, together.
            </h2>

            <div className="mt-6 space-y-5">
              <HeroPoint
                title="For parents"
                description="Keep your routine, train, unwind or simply take a breather."
              />
              <HeroPoint
                title="For children"
                description="Enjoy a friendly, engaging session in a space made for play."
              />
              <HeroPoint
                title="For venues"
                description="Create a more welcoming wellbeing experience for families."
              />
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-(--color-brand)">
            Family first
          </p>
          <h2 className="mt-3 text-xl font-semibold">
            A better way to keep moving as a family.
          </h2>
          <p className="mt-4 text-(--color-text-secondary)">
            We&apos;re here to make wellness feel possible, practical and
            enjoyable for families.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {benefits.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="rounded-md bg-white p-6 shadow-sm transition hover:-translate-y-px hover:shadow-md"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-(--color-brand-soft) text-(--color-brand)">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-(--color-text-secondary)">
                {description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-(--color-brand-soft)">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:px-10">
          <div className="max-w-2xl">
            <div className="flex items-end gap-2 text-(--color-brand)">
              <MapPin aria-hidden="true" className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-wide">
                Bringing FitNest closer to you
              </p>
            </div>
            <h2 className="mt-3 text-xl font-semibold">
              Don&apos;t see your venue yet?
            </h2>
            <p className="mt-3 text-(--color-text-secondary)">
              Tell us where you&apos;d like to see future sessions. We&apos;re
              growing our network of family-friendly venues.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <LoadingButtonLink href="/register-interest">
              <span className="flex gap-2 items-center">
                Register your interest
                <ArrowRight className="h-4 w-4" />
              </span>
            </LoadingButtonLink>
            <LoadingButtonLink href="/about-us" variant="secondary">
              Learn about FitNest
            </LoadingButtonLink>
          </div>
        </div>
      </section>
    </main>
  );
}

function HeroPoint({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-(--color-brand)" />
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-(--color-text-secondary)">
          {description}
        </p>
      </div>
    </div>
  );
}
