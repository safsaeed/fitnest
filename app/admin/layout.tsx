import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { ButtonLink } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { logoutAdmin } from "./logout/actions";
import { SubmitButton } from "@/components/ui/submit-button";

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
      <header className="shadow-md sm:shadow-lg bg-white">
        <div className="mx-auto flex items-center justify-between px-6 py-4 pb-2 max-w-6xl">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="flex">
              <Image
                src="/logo.png"
                alt="Logo"
                width={80}
                height={30}
                priority
                className="h-8 w-20"
              />
            </Link>

            <div className="gap-1 items-center hidden sm:flex print:hidden">
              <ButtonLink variant="ghost" href="/admin/venues">
                Venues
              </ButtonLink>
              <ButtonLink variant="ghost" href="/admin/sessions">
                Sessions
              </ButtonLink>
              <ButtonLink variant="ghost" href="/admin/bookings">
                Bookings
              </ButtonLink>
              <ButtonLink variant="ghost" href="/admin/interests">
                Interests
              </ButtonLink>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <p className="hidden text-sm text-(--color-text-secondary) sm:block print:hidden">
              {session.email}
            </p>

            <form action={logoutAdmin} className="print:hidden">
              <SubmitButton variant="secondary">Logout</SubmitButton>
            </form>
          </div>
        </div>

        <nav className="sm:hidden flex px-2 py-2 justify-start items-center print:hidden overflow-x-scroll">
          <ButtonLink variant="ghost" href="/admin/venues">
            Venues
          </ButtonLink>
          <ButtonLink variant="ghost" href="/admin/sessions">
            Sessions
          </ButtonLink>
          <ButtonLink variant="ghost" href="/admin/bookings">
            Bookings
          </ButtonLink>
          <ButtonLink variant="ghost" href="/admin/interests">
            Interests
          </ButtonLink>
        </nav>
      </header>

      {children}
    </>
  );
}
