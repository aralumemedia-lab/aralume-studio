import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Card({
  className,
  children,
  padded = true,
}: {
  className?: string;
  children: ReactNode;
  padded?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-border bg-surface shadow-[0_1px_0_0_rgb(0_0_0_/_0.02)]",
        padded && "p-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3 mb-3", className)}>
      <div className="min-w-0">
        <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
          {title}
        </div>
        {subtitle && <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  tone,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "ok" | "attention" | "warning" | "critical" | "info";
  icon?: ReactNode;
}) {
  const toneClass =
    tone === "ok"
      ? "text-ok"
      : tone === "attention"
        ? "text-attention"
        : tone === "warning"
          ? "text-warning"
          : tone === "critical"
            ? "text-critical"
            : tone === "info"
              ? "text-info"
              : "text-foreground";
  return (
    <Card className="min-w-0">
      <div className="flex items-start justify-between">
        <div className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </div>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className={cn("mt-1.5 text-2xl font-semibold tabular-nums leading-none", toneClass)}>
        {value}
      </div>
      {hint && <div className="mt-2 text-[11px] text-muted-foreground">{hint}</div>}
    </Card>
  );
}

export function SectionHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-4 mb-3", className)}>
      <div className="min-w-0">
        <h2 className="text-[13.5px] font-semibold tracking-tight text-foreground">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <div className="text-sm font-medium text-foreground">{title}</div>
      {description && <div className="text-xs text-muted-foreground max-w-sm">{description}</div>}
    </div>
  );
}

export function LoadingState({ label = "Carregando" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-8 text-xs text-muted-foreground">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-info" />
      {label}...
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-critical-soft bg-critical-soft/40 px-3 py-2 text-xs text-critical">
      {message}
    </div>
  );
}
