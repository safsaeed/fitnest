import {
  ArrowRight,
  CalendarDays,
  Heart,
  MapPin,
  UsersRound,
} from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const audiences = [
  {
    icon: Heart,
    title: "For parents",
    description:
      "More flexibility to train, reset and make time for your own wellbeing.",
  },
  {
    icon: CalendarDays,
    title: "For children",
    description:
      "A safe, engaging session that makes time at the venue enjoyable too.",
  },
  {
    icon: UsersRound,
    title: "For venues",
    description:
      "A more welcoming, inclusive experience that helps families feel supported.",
  },
];

export default function AboutUsPage() {
  return (
    <main className="min-h-(--min-page-height)">
      <section className="mx-auto max-w-6xl px-6 py-8 sm:px-8 lg:px-6 lg:py-12">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "About us", href: "/about-us" },
          ]}
        />

        <div className="mt-8 grid gap-8 overflow-hidden rounded-lg bg-(--color-brand-soft) p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-(--color-brand)">
              About FitNest Studios
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight md:text-4xl">
              Wellness works better when families are part of the picture.
            </h1>
            <p className="mt-5 max-w-2xl text-(--color-text-secondary) sm:text-md">
              We partner with fitness, wellness and sports venues to create
              family-friendly spaces where parents can prioritise their health
              and wellbeing while children enjoy safe, professionally
              supervised play sessions.
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm">
            <MapPin aria-hidden="true" className="h-6 w-6 text-(--color-brand)" />
            <p className="mt-4 text-sm font-semibold">Our focus</p>
            <p className="mt-2 text-sm leading-6 text-(--color-text-secondary)">
              Making it easier to fit wellbeing into everyday family life.
            </p>
          </div>
        </div>

        <section className="grid gap-10 py-16 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:py-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-(--color-brand)">
              Why we exist
            </p>
            <h2 className="mt-3 text-xl font-semibold">
              Supporting parents without asking them to choose.
            </h2>
          </div>

          <div className="space-y-5 text-(--color-text-secondary)">
            <p>
              Staying active can feel difficult when family life is full. FitNest
              Studios helps remove one of those barriers by bringing supervised
              children&apos;s sessions into the places parents already want to go.
            </p>
            <p>
              Our mission is to help partner venues create more inclusive,
              accessible experiences for families, and to give parents more
              freedom to make wellbeing part of their routine.
            </p>
            <p>
              Together, we&apos;re building welcoming spaces that make wellness
              work for everyone.
            </p>
          </div>
        </section>

        <section>
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-(--color-brand)">
              Everyone benefits
            </p>
            <h2 className="mt-3 text-xl font-semibold">
              A better experience for the whole venue community.
            </h2>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {audiences.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-(--color-brand-soft) text-(--color-brand)">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-(--color-text-secondary)">
                  {description}
                </p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-8 overflow-hidden rounded-lg bg-(--color-brand-soft) p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-center">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-(--color-brand)">
              Find your FitNest session
            </p>
            <h2 className="mt-3 text-xl font-semibold">
              Ready to make a little more room for wellbeing?
            </h2>
            <p className="mt-3 text-(--color-text-secondary)">
              Browse upcoming sessions at our partner venues, or tell us where
              you&apos;d like to see FitNest next.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <ButtonLink href="/book">
              <span className="flex items-center gap-2">
                Browse sessions
                <ArrowRight className="h-4 w-4" />
              </span>
            </ButtonLink>
            <ButtonLink href="/register-interest" variant="secondary">
              Register your interest
            </ButtonLink>
          </div>
        </section>
      </section>
    </main>
  );
}
