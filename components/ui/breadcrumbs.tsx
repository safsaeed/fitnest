import Link from "next/link";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`text-sm ${className}`}
    >
      <ol className="flex flex-wrap items-center gap-2 text-(--color-text-muted)">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const content =
            item.href && !isLast ? (
              <Link
                href={item.href}
                className="font-medium hover:text-(--color-text-secondary)"
              >
                {item.label}
              </Link>
            ) : (
              <span
                aria-current={isLast ? "page" : undefined}
                className="font-medium text-(--color-brand) pointer-events-none"
              >
                {item.label}
              </span>
            );

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {index > 0 && <span aria-hidden="true" className="pointer-events-none">/</span>}
              {content}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}