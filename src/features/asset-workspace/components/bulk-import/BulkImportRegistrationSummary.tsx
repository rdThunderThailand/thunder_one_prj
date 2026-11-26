import { Card } from "@/components/ui/Card";
import { InfoIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import type { ImportBatch } from "../../domain/asset-import-types";
import { BulkImportCounts } from "./BulkImportCounts";

export function BulkImportRegistrationSummary({ batch }: { batch: ImportBatch }) {
  const hasErrors = batch.counts.error > 0;
  return (
    <Card className="@container/summary shrink-0 space-y-3 focus-within:border-foreground/20 focus-within:shadow-float motion-reduce:transition-none p-4">
      <h2 className="text-sm font-semibold">Registration Summary</h2>
      {Boolean(batch.editedCount) && (
        <p className="text-xs text-muted-foreground">{batch.editedCount} rows edited</p>
      )}
      <div className={cn("grid gap-3", hasErrors && "@min-5xl/summary:grid-cols-[minmax(0,4fr)_minmax(0,1.4fr)]")}>
        <BulkImportCounts variant="validation" review counts={{ total: batch.totalRows, ...batch.counts }} />
        {hasErrors && (
          <div className="flex items-center gap-2 rounded-control bg-info-muted p-3 text-info">
            <InfoIcon className="size-4 shrink-0" />
            <div className="space-y-1 text-2xs">
              <p className="font-semibold">Rows with errors will not be registered.</p>
              <p>
                You can go back to fix the data or continue with valid rows only.
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
