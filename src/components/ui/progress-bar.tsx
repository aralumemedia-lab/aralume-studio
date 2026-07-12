import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  tone = "info",
  className,
}: {
  value: number;
  tone?: "info" | "ok" | "attention" | "warning" | "critical";
  className?: string;
}) {
  const bg =
    tone === "ok"
      ? "bg-ok"
      : tone === "attention"
        ? "bg-attention"
        : tone === "warning"
          ? "bg-warning"
          : tone === "critical"
            ? "bg-critical"
            : "bg-info";
  return (
    <div className={cn("h-1.5 w-full rounded-full bg-muted overflow-hidden", className)}>
      <div
        className={cn("h-full rounded-full transition-all", bg)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
