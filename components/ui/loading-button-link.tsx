"use client";

import * as React from "react";
import { ButtonLink } from "@/components/ui/button";

type LoadingButtonLinkProps = React.ComponentProps<typeof ButtonLink>;

export function LoadingButtonLink({
  onClick,
  isLoading,
  children,
  ...props
}: LoadingButtonLinkProps) {
  const [clicked, setClicked] = React.useState(false);
  const loading = isLoading || clicked;

  return (
    <ButtonLink
      {...props}
      isLoading={loading}
      aria-disabled={loading}
      onClick={(event) => {
        setClicked(true);
        onClick?.(event);
      }}
    >
      {children}
    </ButtonLink>
  );
}
