export function StaffingAgeGroupCard({
  label,
  count,
  ratio,
  fraction,
}: {
  label: string;
  count: number;
  ratio: string;
  fraction: number;
}) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-(--color-text-primary)">{label}</h3>

          <p className="mt-1 text-sm text-(--color-text-secondary)">
            Ratio {ratio}
          </p>
        </div>

        <span className="rounded-full bg-(--color-brand-soft) px-3 py-1 text-sm font-medium text-(--color-brand)">
          {count}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-(--color-text-muted)">
            Children
          </p>
          <p className="mt-1 text-lg font-semibold text-(--color-text-primary)">
            {count}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-(--color-text-muted)">
            Staff fraction
          </p>
          <p className="mt-1 text-lg font-semibold text-(--color-text-primary)">
            {fraction.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
