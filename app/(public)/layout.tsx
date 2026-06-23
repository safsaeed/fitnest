import Link from "next/link";
import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import {
  NavigationLinks,
  type NavigationItem,
} from "@/components/ui/navigation-links";
import { User } from "lucide-react";

const publicNavigationItems: NavigationItem[] = [
  { href: "/", label: "Home" },
  { href: "/memberships", label: "Memberships" },
  { href: "/book", label: "Book" },
  { href: "/about-us", label: "About us" },
];

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 shadow-md backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex" aria-label="FitNest Studios home">
              <Image
                src="/logo.png"
                alt="FitNest Studios"
                width={89}
                height={32}
                priority
                className="block"
              />
            </Link>

            <nav
              aria-label="Main navigation"
              className="hidden items-center gap-2 rounded-lg bg-(--color-brand-soft) p-1 lg:flex"
            >
              <NavigationLinks items={publicNavigationItems} />
            </nav>
          </div>

          <ButtonLink href="/account" variant="secondary">
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              My account
            </span>
          </ButtonLink>
        </div>

        <nav
          aria-label="Main navigation"
          className="flex items-center gap-1 overflow-x-auto bg-(--color-brand-soft) px-2 py-2 lg:hidden"
        >
          <NavigationLinks items={publicNavigationItems} />
        </nav>
      </header>

      {children}

      <footer className="border-t border-gray-100 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-6 text-sm text-(--color-text-muted) sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} FitNest Studios. All rights reserved.
          </p>

          <nav className="flex flex-wrap gap-4 text-(--color-text-secondary)">
            <Link href="/terms" className="hover:text-(--color-brand)">
              Terms & Conditions
            </Link>

            <a
              href="mailto:contact@fitneststudios.co.uk"
              className="hover:text-(--color-brand)"
            >
              Contact
            </a>
          </nav>
        </div>
      </footer>
    </>
  );
}
