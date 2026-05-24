import * as React from "react";
import { Card } from "./card";

type AdminListProps = {
  children: React.ReactNode;
  className?: string;
};

export function AdminList({ children, className = "" }: AdminListProps) {
  return (
    <div className={["grid gap-4", className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}

type AdminListCardProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
};

export function AdminListCard({
  children,
  className = "",
  ...props
}: AdminListCardProps) {
  return (
    <Card className={[className].filter(Boolean).join(" ")} {...props}>
      {children}
    </Card>
  );
}

type AdminListCardHeaderProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
};

export function AdminListCardHeader({
  title,
  subtitle,
  badge,
  actions,
}: AdminListCardHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          {badge}
        </div>

        {subtitle && (
          <div className="mt-2 text-sm text-(--color-text-secondary)">
            {subtitle}
          </div>
        )}
      </div>

      {actions && <div className="flex shrink-0 gap-x-2 gap-y-4 flex-wrap">{actions}</div>}
    </div>
  );
}

type AdminListMetaProps = {
  children: React.ReactNode;
  className?: string;
};

export function AdminListMeta({
  children,
  className = "",
}: AdminListMetaProps) {
  return (
    <dl
      className={[
        "mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </dl>
  );
}

export function AdminListMetaItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-(--color-text-muted)">
        {label}
      </dt>
      <dd className="mt-1">{value || "—"}</dd>
    </div>
  );
}
