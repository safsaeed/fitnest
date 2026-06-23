import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentParentUser } from "@/lib/parent-auth";
import { logoutParent } from "./logout/actions";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  NavigationLinks,
  type NavigationItem,
} from "@/components/ui/navigation-links";

const accountNavigationItems: NavigationItem[] = [
  { href: "/", label: "Home" },
  { href: "/account", label: "Account", exact: true },
  { href: "/account/children", label: "Children" },
  { href: "/account/bookings", label: "Bookings" },
  { href: "/account/membership", label: "Membership" },
  { href: "/account/profile", label: "Profile" },
];

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const parentUser = await getCurrentParentUser();

  if (!parentUser) {
    redirect("/account/login");
  }

  return (
    <main className="min-h-screen bg-(--color-background)">
      <header className="sticky top-0 z-40 bg-white/95 shadow-md backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex">
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
              aria-label="Account navigation"
              className="hidden items-center gap-2 rounded-lg bg-(--color-brand-soft) p-1 lg:flex"
            >
              <NavigationLinks items={accountNavigationItems} />
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <p className="hidden text-sm text-(--color-text-secondary) lg:block">
              {parentUser.email}
            </p>

            <form action={logoutParent}>
              <SubmitButton variant="secondary">Logout</SubmitButton>
            </form>
          </div>
        </div>

        <nav
          aria-label="Account navigation"
          className="flex items-center gap-1 overflow-x-auto bg-(--color-brand-soft) px-2 py-2 lg:hidden"
        >
          <NavigationLinks items={accountNavigationItems} />
        </nav>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
    </main>
  );
}
