export function ChildRegisterCard({
  childName,
  ageAtSession,
  parentName,
  parentPhone,
  allergies,
  medicalNotes,
}: {
  childName: string;
  ageAtSession: number | "-";
  parentName: string;
  parentPhone: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  allergies: string | null;
  medicalNotes: string | null;
}) {
  const cleanAllergies = normaliseNote(allergies);
  const cleanMedicalNotes = normaliseNote(medicalNotes);

  const hasAllergies = cleanAllergies !== "None";
  const hasMedicalNotes = cleanMedicalNotes !== "None";

  return (
    <article className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-(--color-text-primary)">
            {childName}
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-(--color-brand-soft) px-3 py-1 text-xs font-medium text-(--color-brand)">
              Age {ageAtSession}
            </span>

            {hasAllergies && (
              <span className="rounded-full bg-(--color-danger-soft) px-3 py-1 text-xs font-medium text-(--color-danger)">
                Allergy alert
              </span>
            )}

            {hasMedicalNotes && (
              <span className="rounded-full bg-(--color-danger-soft) px-3 py-1 text-xs font-medium text-(--color-danger)">
                Medical note
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        <RegisterInfoBlock
          label={"Parent"}
          name={parentName}
          phone={parentPhone}
        />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <RegisterNoteBlock
          label="Allergies"
          value={cleanAllergies}
          important={hasAllergies}
        />

        <RegisterNoteBlock
          label="Medical notes"
          value={cleanMedicalNotes}
          important={hasMedicalNotes}
        />
      </div>
    </article>
  );
}

function normaliseNote(value: string | null) {
  const trimmed = value?.trim();

  if (!trimmed || trimmed.toLowerCase() === "none") {
    return "None";
  }

  return trimmed;
}

function normalisePhone(value: string | null) {
  return value?.replace(/\D/g, "") || "";
}

function RegisterInfoBlock({
  label,
  name,
  phone,
}: {
  label: string;
  name: string;
  phone: string | null;
}) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-(--color-text-secondary)">
        {label}
      </p>

      <p className="mt-2 font-semibold text-(--color-text-primary)">
        {name || "—"}
      </p>

      {phone ? (
        <a
          href={`tel:${normalisePhone(phone)}`}
          className="mt-1 block text-sm text-(--color-brand) hover:underline"
        >
          {phone}
        </a>
      ) : (
        <p className="mt-1 text-sm text-(--color-text-secondary)">—</p>
      )}
    </div>
  );
}

function RegisterNoteBlock({
  label,
  value,
  important = false,
}: {
  label: string;
  value: string;
  important?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        important
          ? "border-(--color-warning) bg-(--color-warning-soft)"
          : "border-gray-100 bg-gray-50"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-(--color-text-muted)">
          {label}
        </p>
      </div>

      <p className="mt-2 text-sm font-semibold text-(--color-text-primary)">
        {value}
      </p>
    </div>
  );
}
