import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateSession } from "../../actions";
import { SessionForm } from "./session-form";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ButtonLink } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type EditSessionPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function EditSessionPage({
  params,
  searchParams,
}: EditSessionPageProps) {
  const { sessionId } = await params;
  const query = await searchParams;

  const [session, venues] = await Promise.all([
    prisma.session.findUnique({
      where: {
        id: sessionId,
      },
      include: {
        venue: true,
      },
    }),
    prisma.venue.findMany({
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  if (!session) {
    notFound();
  }

  const updateSessionWithId = updateSession.bind(null, session.id);

  return (
    <main className="min-h-(--min-page-height)">
      <section className="mx-auto max-w-5xl px-6 py-8">
        <div className="pb-10 sm:py-10">
          <Breadcrumbs
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Sessions", href: "/admin/sessions" },
            ]}
          />

          <h1 className="mt-3 text-3xl font-semibold">Edit session</h1>

          <p className="mt-2 flex items-center gap-2 text-sm text-(--color-text-secondary)">
            Update session details, capacity and status.
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

        <SessionForm
          session={session}
          venues={venues}
          action={updateSessionWithId}
          submitLabel="Save changes"
          error={query?.error}
        />
      </section>
    </main>
  );
}
