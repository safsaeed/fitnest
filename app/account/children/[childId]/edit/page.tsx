import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getParentSession } from "@/lib/parent-auth";
import { ChildForm } from "../../child-form";
import { updateParentChild } from "../../actions";
import { PageHeader } from "@/components/ui/page-header";

type EditChildPageProps = {
  params: Promise<{
    childId: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function EditChildPage({
  params,
  searchParams,
}: EditChildPageProps) {
  const session = await getParentSession();

  if (!session) {
    redirect("/account/login");
  }

  const { childId } = await params;
  const query = await searchParams;

  const child = await prisma.parentChild.findFirst({
    where: {
      id: childId,
      parentUserId: session.parentUserId,
      isActive: true,
    },
  });

  if (!child) {
    notFound();
  }

  const updateAction = updateParentChild.bind(null, child.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit child"
        description="Update saved child details for future bookings."
      />

      <ChildForm
        child={child}
        action={updateAction}
        submitLabel="Update child"
        error={query?.error}
      />
    </div>
  );
}
