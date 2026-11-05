"use client";

import { SpinnerIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { Progress } from "@/components/ui/lovable/progress";
import { formatCount } from "../../domain/asset-import-format";
import { importConfirmProcessed } from "../../domain/asset-import-review";
import type { ImportBatch } from "../../domain/asset-import-types";

export function BulkImportConfirmProgress({
  batch,
  retrying,
  error,
  onRetry,
}: {
  batch: ImportBatch;
  retrying: boolean;
  error?: string;
  onRetry?: () => void;
}) {
  const processed = importConfirmProcessed(batch);
  return (
    <section
      className="mx-auto flex w-full max-w-md flex-col items-center gap-4 rounded-card border border-border bg-card p-6 text-center"
      aria-busy={!onRetry}
    >
      {!onRetry && (
        <SpinnerIcon className="size-8 animate-spin text-primary motion-reduce:animate-none" />
      )}
      <h2 className="text-lg font-bold">Registering assets…</h2>
      <Progress
        value={batch.totalRows ? (processed / batch.totalRows) * 100 : 0}
        aria-label="Registration progress"
      />
      <p role="status" className="text-xs tabular-nums">
        {formatCount(processed)} of {formatCount(batch.totalRows)} rows
        processed
      </p>
      <p className="text-2xs text-muted-foreground">
        Keep this page open. If the connection drops, registration continues
        when it comes back.
      </p>
      {retrying && (
        <p role="status" className="text-xs text-warning">
          Connection lost. Retrying…
        </p>
      )}
      {error && (
        <p role="alert" className="text-xs text-error">
          {error}
        </p>
      )}
      {onRetry && (
        <Button size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </section>
  );
}
