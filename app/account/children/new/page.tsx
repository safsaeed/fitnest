import { createParentChild } from "../actions";
import { ChildForm } from "../child-form";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";

type NewChildPageProps = {
  searchParams?: Promise<{
    error?: string;
    returnTo?: string;
  }>;
};

function getSafeReturnTo(value?: string) {
  if (!value) {
    return null;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  if (value.includes("://")) {
    return null;
  }

  return value;
}

export default async function NewChildPage({
  searchParams,
}: NewChildPageProps) {
  const params = await searchParams;
  const returnTo = getSafeReturnTo(params?.returnTo);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <PageHeader
          title="Add child"
          description="Save child details so future bookings are quicker."
        />

        {returnTo ? (
          <Alert variant="warning">
            After saving, you’ll return to your booking.
          </Alert>
        ) : null}
      </div>

      <ChildForm
        action={createParentChild}
        submitLabel="Save child"
        error={params?.error}
        returnTo={returnTo}
      />
    </div>
  );
}
