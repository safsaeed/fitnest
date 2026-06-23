"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavigationItem = {
  href: string;
  label: string;
  exact?: boolean;
};

type NavigationLinksProps = {
  items: readonly NavigationItem[];
};

function isActivePath(
  pathname: string,
  { href, exact = href === "/" }: NavigationItem,
) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function NavigationLinks({ items }: NavigationLinksProps) {
  const pathname = usePathname();

  return items.map((item) => {
    const isActive = isActivePath(pathname, item);

    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={isActive ? "page" : undefined}
        className={[
          "inline-flex shrink-0 items-center justify-center rounded-md px-3 py-2 text-sm font-semibold transition",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-brand)",
          isActive
            ? "bg-(--color-brand) text-white shadow-sm"
            : "text-(--color-text-secondary) hover:bg-white hover:text-(--color-brand)",
        ].join(" ")}
      >
        {item.label}
      </Link>
    );
  });
}
