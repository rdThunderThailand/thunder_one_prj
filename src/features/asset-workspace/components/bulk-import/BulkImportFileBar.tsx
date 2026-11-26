import type { ReactNode } from "react";
import { FileTextIcon } from "@/components/ui/icons";
import { formatBytes, formatCount } from "../../domain/asset-import-format";

export function BulkImportFileBar({
  name,
  sizeBytes,
  rows,
  columns,
  action,
}: {
  name: string;
  sizeBytes: number | null;
  rows: number | null;
  columns: number | null;
  action: ReactNode;
}) {
  return (
    <div className="flex min-w-0 shrink-0 items-center gap-3 rounded-control border border-border bg-card p-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success-muted text-success">
        <FileTextIcon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="wrap-anywhere text-sm font-semibold sm:truncate" title={name}>
          {name}
        </p>
        <p className="mt-1 wrap-anywhere text-2xs tabular-nums text-muted-foreground sm:text-xs">
          {sizeBytes !== null && formatBytes(sizeBytes)}
          {rows !== null && `${sizeBytes !== null ? " • " : ""}${formatCount(rows)} rows`}
          {columns !== null && ` • ${formatCount(columns)} columns`}
        </p>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}
