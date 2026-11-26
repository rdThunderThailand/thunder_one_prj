"use client";

import { Card } from "@/components/ui/Card";
import { RefreshIcon, SpinnerIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { ignoredHeaders, missingRequired } from "../../domain/asset-import-mapping";
import type { AssetImportFlow } from "../../hooks/use-asset-import-flow";
import { BulkImportMappingTable } from "./BulkImportMappingTable";

export function BulkImportMappingCard({ flow }: { flow: AssetImportFlow }) {
  const { parsed, mapping, options, rowsSent, busy } = flow;
  if (!options) return null;
  const missing = parsed ? missingRequired(mapping, options.columns) : [];

  return (
    <Card className="flex min-w-0 flex-col gap-3 focus-within:border-foreground/20 focus-within:shadow-float motion-reduce:transition-none p-4">
      <div className="space-y-1">
        <h2 className="flex min-h-8 items-center text-sm font-semibold">1. Map Columns</h2>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Match the columns from your file to ThunderOne asset fields. Unmapped columns will be ignored.
        </p>
      </div>
      {parsed ? (
        <BulkImportMappingTable
          headers={parsed.headers}
          sampleRow={parsed.rows[0]?.cells ?? []}
          mapping={mapping}
          columns={options.columns}
          disabled={busy || rowsSent}
          onChange={flow.setMapping}
        />
      ) : flow.restoringFile ? (
        <p role="status" className="flex items-center gap-2 rounded-control bg-muted p-3 text-xs text-muted-foreground">
          <SpinnerIcon className="size-4 animate-spin motion-reduce:animate-none" />
          <span>Restoring your file…</span>
        </p>
      ) : flow.restoreFailed ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-control bg-error-muted p-3 text-xs text-error">
          <p>Your file could not be restored. Try again, or select it again with Replace File.</p>
          <Button size="sm" variant="outline" disabled={busy} onClick={flow.retryFileRestore}>
            <RefreshIcon className="size-4" />
            <span>Try Again</span>
          </Button>
        </div>
      ) : (
        <p className="rounded-control bg-info-muted p-3 text-xs text-info">
          Select the file again to change the mapping.
        </p>
      )}
      {missing.length > 0 && (
        <p role="alert" className="rounded-control bg-error-muted p-3 text-xs text-error">
          Map the required fields: {missing.map((key) => options.columns.find((column) => column.key === key)?.label).join(", ")}.
        </p>
      )}
      {parsed && (
        <p className="wrap-anywhere text-xs text-muted-foreground">
          Ignored columns: {ignoredHeaders(parsed.headers, mapping).join(", ") || "None"}
        </p>
      )}
      {rowsSent && (
        <p className="text-xs text-muted-foreground">Change the mapping with Replace File.</p>
      )}
    </Card>
  );
}
