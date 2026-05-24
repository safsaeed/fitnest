import * as React from "react";

type SummaryRowProps = {
  label: string;
  value?: React.ReactNode;
  className?: string;
};

export function SummaryRow({ label, value, className = "" }: SummaryRowProps) {
  return (
    <div
      className={[
        "flex justify-between gap-6 px-2 border bg-white border-gray-200 rounded-md my-2 min-h-9 items-center",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <p className="text-(--color-text-secondary) text-sm">{label}</p>
      <p className="text-right text-sm">{value || "—"}</p>
    </div>
  );
}
