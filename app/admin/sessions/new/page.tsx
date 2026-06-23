import { prisma } from "@/lib/prisma";
import { createSessionFromForm } from "../actions";
import { NewSessionForm } from "./new-session-form";
import { ButtonLink } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ArrowLeft } from "lucide-react";

type NewSessionPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function NewSessionPage({
  searchParams,
}: NewSessionPageProps) {
  const params = await searchParams;

  const venues = await prisma.venue.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <main className="min-h-(--min-page-height)">
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="pb-10 sm:py-10">
          <Breadcrumbs
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Sessions", href: "/admin/sessions" },
            ]}
          />

          <h1 className="mt-3 text-3xl font-semibold">Add session</h1>

          <p className="mt-2 flex items-center gap-2 text-sm text-(--color-text-secondary)">
            Create a single session or repeating sessions.
          </p>

          <ButtonLink
            href="/admin/sessions"
            variant="ghost"
            size="custom"
            className="self-start mt-6 p-0 text-sm text-(--color-brand) hover:bg-transparent hover:brightness-130"
          >
            <span className="flex items-center">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Sessions
            </span>
          </ButtonLink>
        </div>

        <NewSessionForm
          venues={venues}
          action={createSessionFromForm}
          error={params?.error}
        />
      </section>
    </main>
  );
}
