import Link from "next/link";
import Image from "next/image";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="h-15 shadow-md sticky top-0 z-5 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-4 px-6 py-4">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="Logo"
              width={80}
              height={30}
              priority
              className="h-8 w-20"
            />
          </Link>
        </div>
      </header>

      {children}

      <footer className="border-t border-gray-100 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-6 text-sm text-(--color-text-muted) sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} FitNest Studios. All rights reserved.
          </p>

          <nav className="flex flex-wrap gap-4 text-(--color-text-secondary)">
            <Link target="_blank" href="/terms" className="hover:text-(--color-brand)">
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
