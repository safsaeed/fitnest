"use client";

import { Button } from "@/components/ui/button";
import { useLoadingForm } from "@/components/ui/loading-form";

type ApiSubmitButtonProps = React.ComponentProps<typeof Button>;

export function ApiSubmitButton({
  disabled,
  children,
  ...props
}: ApiSubmitButtonProps) {
  const isSubmitting = useLoadingForm();

  return (
    <Button
      {...props}
      type="submit"
      disabled={disabled || isSubmitting}
      isLoading={isSubmitting}
    >
      {children}
    </Button>
  );
}
