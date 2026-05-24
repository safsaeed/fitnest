import Link from "next/link";
import * as React from "react";

type ButtonVariant = "primary" | "secondary" | "destructive" | "ghost";
type ButtonSize = "sm" | "md" | "lg" | "custom";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-(--color-brand-border) bg-(--color-brand) text-white hover:bg-(--color-brand-hover)",
  secondary:
    "border border-(--color-brand-border) bg-white text-(--color-brand) hover:bg-(--color-brand-soft)",
  destructive: "bg-(--color-danger) text-white hover:bg-(--color-danger-hover)",
  ghost: "text-(--color-brand) hover:bg-(--color-brand-soft)",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-4 py-3 text-sm",
  custom: "",
};

const baseClasses =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-50";

function getButtonClasses({
  variant,
  size,
  className = "",
}: {
  variant: ButtonVariant;
  size: ButtonSize;
  className?: string;
}) {
  return [baseClasses, variantClasses[variant], sizeClasses[size], className]
    .filter(Boolean)
    .join(" ");
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="absolute h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  isLoading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={getButtonClasses({ variant, size, className })}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      aria-label={isLoading ? "Loading" : props["aria-label"]}
      {...props}
    >
      {isLoading ? <Spinner /> : null}{" "}
      <span className={`${isLoading ? "opacity-0" : ""}`}>{children}</span>
    </button>
  );
}

type ButtonLinkProps = React.ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  isLoading?: boolean;
};

export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  isLoading = false,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={getButtonClasses({ variant, size, className })}
      aria-busy={isLoading}
      aria-label={isLoading ? "Loading" : props["aria-label"]}
      {...props}
    >
      {isLoading ? <Spinner /> : null}{" "}
      <span className={`${isLoading ? "opacity-0" : ""}`}>{children}</span>
    </Link>
  );
}
