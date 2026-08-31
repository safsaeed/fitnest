import Link from "next/link";

export type StatusViewValue = "active" | "inactive" | "all";

type StatusViewNavItem = {
  value: StatusViewValue;
  label: string;
  count: number;
  href: string;
};

type StatusViewNavProps = {
  ariaLabel: string;
  activeValue: StatusViewValue;
  items: StatusViewNavItem[];
};

export function StatusViewNav({
  ariaLabel,
  activeValue,
  items,
}: StatusViewNavProps) {
  return (
    <nav aria-label={ariaLabel} className="mb-6">
      <p className="mb-2 text-sm font-medium text-(--color-text-secondary)">
        View
      </p>

      <div className="inline-flex max-w-full flex-wrap gap-1 rounded-xl border border-(--color-brand-border) bg-white p-1">
        {items.map((item) => {
          const isActive = item.value === activeValue;

          return (
            <Link
              key={item.value}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-(--color-brand) text-white"
                  : "text-(--color-text-secondary) hover:bg-(--color-brand-soft) hover:text-(--color-brand)"
              }`}
            >
              {item.label}
              <span
                className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-(--color-brand-soft) text-(--color-brand)"
                }`}
              >
                {item.count}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
