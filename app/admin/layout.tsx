import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";
import { logoutAdmin } from "./logout/actions";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  NavigationLinks,
  type NavigationItem,
} from "@/components/ui/navigation-links";

const adminNavigationItems: NavigationItem[] = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/venues", label: "Venues" },
  { href: "/admin/sessions", label: "Sessions" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/interests", label: "Interests" },
  { href: "/admin/parents", label: "Parents" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 shadow-md backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="flex">
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
              aria-label="Admin navigation"
              className="hidden items-center gap-2 rounded-lg bg-(--color-brand-soft) p-1 print:hidden lg:flex"
            >
              <NavigationLinks items={adminNavigationItems} />
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <p className="hidden text-sm text-(--color-text-secondary) print:hidden lg:block">
              {session.email}
            </p>

            <form action={logoutAdmin} className="print:hidden">
              <SubmitButton variant="secondary">Logout</SubmitButton>
            </form>
          </div>
        </div>

        <nav
          aria-label="Admin navigation"
          className="flex items-center gap-1 overflow-x-auto bg-(--color-brand-soft) px-2 py-2 print:hidden lg:hidden"
        >
          <NavigationLinks items={adminNavigationItems} />
        </nav>
      </header>

      {children}
    </>
  );
}
