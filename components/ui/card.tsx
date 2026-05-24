type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
};

export function Card({
  children,
  className = "",
  disabled = false,
  ...props
}: CardProps) {
  return (
    <div
      aria-disabled={disabled || undefined}
      className={[
        "w-full h-fit rounded-lg border border-gray-100 bg-white p-4 sm:p-8 shadow-md duration-150",
        disabled
          ? " opacity-60 cursor-not-allowed"
          : "focus-within:-translate-y-px focus-within:shadow-lg hover:-translate-y-px hover:shadow-lg",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <div className={disabled ? "pointer-events-none" : ""}>{children}</div>
    </div>
  );
}
