import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type Column<T> = {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
  width?: string;
};

export function CompactTable<T extends { id: string }>({
  columns,
  rows,
  onRowClick,
  empty,
  className,
}: {
  columns: Column<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  empty?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto rounded-md border border-border bg-surface", className)}>
      <table className="w-full text-[12px]">
        <thead>
          <tr className="border-b border-border bg-surface-muted">
            {columns.map((c) => (
              <th
                key={c.key}
                className={cn(
                  "px-3 h-8 text-left text-[10.5px] font-medium uppercase tracking-[0.06em] text-muted-foreground",
                  c.headerClassName,
                )}
                style={c.width ? { width: c.width } : undefined}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-3 py-8 text-center text-xs text-muted-foreground"
              >
                {empty ?? "Nenhum registro encontrado."}
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr
              key={row.id}
              className={cn(
                "border-b border-border/70 last:border-0 h-[34px] transition-colors",
                onRowClick && "cursor-pointer hover:bg-accent/40",
              )}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((c) => (
                <td key={c.key} className={cn("px-3 align-middle text-foreground/90", c.className)}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
