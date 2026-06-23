import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getParentSession } from "@/lib/parent-auth";
import { deactivateParentChild } from "./actions";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { SubmitButton } from "@/components/ui/submit-button";

type AccountChildrenPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
  }).format(date);
}

export default async function AccountChildrenPage({
  searchParams,
}: AccountChildrenPageProps) {
  const session = await getParentSession();

  if (!session) {
    redirect("/account/login");
  }

  const params = await searchParams;

  const children = await prisma.parentChild.findMany({
    where: {
      parentUserId: session.parentUserId,
      isActive: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Saved children"
        description="Add children once, then reuse their details when booking."
        actions={
          <ButtonLink
          href="/account/children/new"
          >
            Add child
          </ButtonLink>
        }
      />

      {params?.error === "not-found" && (
        <Alert variant="error">
          This child profile could not be found.
        </Alert>
      )}

      {children.length === 0 ? (
        <Card className="p-8 text-center">
          <h2 className="text-lg font-semibold">
            No saved children yet
          </h2>
          <p className="mt-2 text-sm text-(--color-text-secondary)">
            Save your child details to make future bookings quicker.
          </p>

          <ButtonLink
            href="/account/children/new"
            className="mt-5"
          >
            Add your first child
          </ButtonLink>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {children.map((child) => (
            <Card key={child.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">
                    {[child.firstName, child.lastName]
                      .filter(Boolean)
                      .join(" ")}
                  </h2>

                  <p className="mt-1 text-sm text-(--color-text-secondary)">
                    Date of birth: {formatDate(child.dateOfBirth)}
                  </p>
                </div>

                <ButtonLink
                  href={`/account/children/${child.id}/edit`}
                  variant="secondary"
                  size="sm"
                >
                  Edit
                </ButtonLink>
              </div>

              <div className="mt-4 space-y-2 text-sm text-(--color-text-secondary)">
                <p>
                  <span className="font-medium text-(--color-text-primary)">Allergies:</span>{" "}
                  {child.allergies || "—"}
                </p>

                <p>
                  <span className="font-medium text-(--color-text-primary)">
                    Medical notes:
                  </span>{" "}
                  {child.medicalNotes || "—"}
                </p>
              </div>

              <form
                action={deactivateParentChild.bind(null, child.id)}
                className="mt-4"
              >
                <SubmitButton variant="ghost" size="custom" className="p-0 text-(--color-danger) hover:bg-transparent">
                  Remove child
                </SubmitButton>
              </form>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
