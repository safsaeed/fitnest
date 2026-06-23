import * as React from "react";
import { ArrowLeft } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type AuthPageProps = {
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
};

export function AuthPage({ title, description, children }: AuthPageProps) {
  return (
    <main className="flex min-h-(--min-page-height) items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
      <div className="w-full max-w-md">
        <ButtonLink
          href="/"
          variant="ghost"
          size="custom"
          className="mb-4 p-0 text-sm hover:bg-transparent"
        >
          <span className="flex gap-1 items-center">
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to home
          </span>
        </ButtonLink>

        <Card className="p-6 sm:p-8">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="mt-2 text-sm text-(--color-text-secondary)">
            {description}
          </p>
          {children}
        </Card>
      </div>
    </main>
  );
}
