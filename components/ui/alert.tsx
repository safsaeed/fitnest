import * as React from "react";

type AlertVariant = "error" | "success" | "warning";

type AlertProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: AlertVariant;
  children: React.ReactNode;
};

const variantClasses: Record<AlertVariant, string> = {
  error: "border-(--color-danger-hover) bg-(--color-danger-soft) text-(--color-danger)",
  success: "border-(--color-success-hover) bg-(--color-success-soft) text-(--color-success)",
  warning: "border-(--color-warning-hover) bg-(--color-warning-soft) text-(--color-warning)",
};

export function Alert({
  variant = "warning",
  className = "",
  children,
  ...props
}: AlertProps) {
  return (
    <div
      className={[
        "rounded-md border px-4 py-3 text-sm",
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
