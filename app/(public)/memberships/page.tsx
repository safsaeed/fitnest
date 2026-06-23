import {
  ArrowRight,
  CalendarDays,
  Check,
  CirclePoundSterling,
  UsersRound,
  Tally1,
  Tally2,
  Tally3,
} from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const membershipBenefits = [
  {
    icon: CirclePoundSterling,
    title: "All venues, one membership",
    description:
      "Use your membership at any FitNest venue and enjoy discounted prices.",
  },
  {
    icon: UsersRound,
    title: "One membership for your family",
    description:
      "Member pricing applies to every child saved on your parent account.",
  },
  {
    icon: CalendarDays,
    title: "Flexible around your plans",
    description:
      "Cancel when you need to and keep your benefits until the current paid period ends.",
  },
];

const howItWorks = [
  {
    icon: Tally1,
    title: "Create your account",
    description:
      "Save your details and add the children you book sessions for.",
  },
  {
    icon: Tally2,
    title: "Start your membership",
    description: "Choose the £10/month membership from your account.",
  },
  {
    icon: Tally3,
    title: "Book an eligible session",
    description:
      "Member pricing is applied automatically when a session has a member rate.",
  },
];

export default function MembershipsPage() {
  return (
    <main className="min-h-(--min-page-height)">
      <section className="mx-auto max-w-6xl px-6 py-8 sm:px-8 lg:px-6 lg:py-18">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Memberships", href: "/memberships" },
          ]}
        />

        <div className="mt-10 grid gap-8 overflow-hidden rounded-lg bg-(--color-brand-soft) p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-center">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-(--color-brand)">
              FitNest membership
            </p>
            <h1 className="mt-3 font-semibold text-2xl md:text-4xl">
              More time for wellbeing, with better value for your family.
            </h1>
            <p className="mt-5 text-base leading-7 text-(--color-text-secondary) sm:text-md">
              Become a FitNest member for £10/month and access member pricing on
              all sessions for all the children on your
              account.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/account/membership" size="lg">
                <span className="flex gap-1 items-center">
                  Start membership
                  <ArrowRight className="h-4 w-4" />
                </span>
              </ButtonLink>
              <ButtonLink
                href="/account/register"
                variant="secondary"
                size="lg"
              >
                Create an account
              </ButtonLink>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-(--color-text-secondary)">
              Simple monthly membership
            </p>
            <p className="mt-3 text-6xl font-semibold text-(--color-brand)">
              £10
              <span className="ml-1 text-base font-medium text-(--color-text-secondary)">
                / month
              </span>
            </p>
            <ul className="mt-6 space-y-3 text-sm text-(--color-text-secondary)">
              <MembershipListItem>
                Save 30% or more on all sessions
              </MembershipListItem>
              <MembershipListItem>
                Unlock exclusive prices
              </MembershipListItem>
              <MembershipListItem>
                Perfect for parents booking regularly
              </MembershipListItem>
            </ul>
          </div>
        </div>

        <div className="mt-16 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-(--color-brand)">
            Membership benefits
          </p>
          <h2 className="mt-3 text-xl font-semibold">
            Built to make regular movement feel more achievable.
          </h2>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {membershipBenefits.map(({ icon: Icon, title, description }) => (
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

        <div className="mt-16 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-(--color-brand)">
            How it works
          </p>
          <h2 className="mt-3 text-xl font-semibold">
            Three simple steps to member pricing.
          </h2>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {howItWorks.map(({ icon: Icon, title, description }) => (
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

        <section className="mt-16 grid gap-8 overflow-hidden rounded-lg bg-(--color-brand-soft) p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-center">
          <div className="max-w-2xl">
            <h2 className="text-xl font-semibold">
              Already have a parent account?
            </h2>
            <p className="mt-3 text-(--color-text-secondary) text-md">
              Start, manage or cancel your membership from your account at any
              time. If a payment is unresolved, member pricing pauses until it
              is sorted.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <ButtonLink href="/account/membership">
              <span className="flex gap-1 items-center">
                Manage membership
                <ArrowRight className="h-4 w-4" />
              </span>
            </ButtonLink>
            <ButtonLink href="/book" variant="secondary">
              Browse sessions
            </ButtonLink>
          </div>
        </section>
      </section>
    </main>
  );
}

function MembershipListItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check
        aria-hidden="true"
        className="mt-0.5 h-4 w-4 shrink-0 text-(--color-brand)"
      />
      <span>{children}</span>
    </li>
  );
}
