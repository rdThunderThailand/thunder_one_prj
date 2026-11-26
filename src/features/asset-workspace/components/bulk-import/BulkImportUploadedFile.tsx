"use client";

import { Card } from "@/components/ui/Card";
import { useEffect, useId, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/lovable/button";
import { Badge } from "@/components/ui/lovable/badge";
import { Progress } from "@/components/ui/lovable/progress";
import { AlertCircleIcon, CheckCircleIcon, ChevronDownIcon, SpinnerIcon, XIcon } from "@/components/ui/icons";
import type { AssetImportFlow } from "../../hooks/use-asset-import-flow";
import { BulkImportFileBar } from "./BulkImportFileBar";

export function BulkImportUploadedFile({ flow, fileFeedbackId }: {
  flow: AssetImportFlow;
  fileFeedbackId: string;
}) {
  const columnsId = useId();
  const [showColumns, setShowColumns] = useState(false);
  const locked = flow.busy || flow.parsing;
  const file = flow.selectedFile ?? flow.parsed?.file;
  const parsing = flow.parsing;
  // Bring the read result (success or error) into view; at 768px tall it otherwise sits under the footer.
  useEffect(() => {
    if (parsing) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(fileFeedbackId)?.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
  }, [parsing, fileFeedbackId]);
  if (!file) return null;

  return (
    <Card
      id={fileFeedbackId}
      className="space-y-3 focus-within:border-foreground/20 focus-within:shadow-float motion-reduce:transition-none p-4"
      aria-busy={locked}
    >
      <h2 className="text-sm font-semibold">2. Uploaded File</h2>
      <p className="text-xs leading-relaxed text-muted-foreground">
        We read your file and check its format before you continue.
      </p>
      <BulkImportFileBar
        name={file.name}
        sizeBytes={file.size}
        rows={flow.parsed?.rows.length ?? null}
        columns={flow.parsed?.columnCount ?? null}
        action={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Remove file"
            className="max-sm:size-11"
            disabled={locked}
            onClick={() => void flow.clearFile()}
          >
            <XIcon className="h-4 w-4" />
          </Button>
        }
      />
      {flow.parsing ? (
        <p
          role="status"
          className="flex items-center gap-2 text-xs text-muted-foreground"
        >
          <SpinnerIcon className="h-4 w-4 animate-spin motion-reduce:animate-none" />
          <span>Reading file…</span>
        </p>
      ) : flow.busy && flow.progress ? (
        <BulkImportStartProgress
          label={flow.progress.label}
          value={flow.progress.value}
          creating={Boolean(flow.progress.creating)}
        />
      ) : flow.error ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-control bg-error-muted p-3 text-xs text-error"
        >
          <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{flow.error.message}</span>
        </div>
      ) : (
        flow.parsed && (
          <div
            className="flex flex-wrap items-center gap-3 rounded-control bg-success-muted p-3 text-foreground"
            role="status"
          >
            <CheckCircleIcon aria-hidden="true" className="h-5 w-5 shrink-0 text-success" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold">
                File read successfully
              </p>
              <p className="text-xs leading-relaxed">
                {flow.preview
                  ? "File format is valid. Click Next to preview column mapping."
                  : 'File format is valid. Click "Next" to continue.'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              aria-expanded={showColumns}
              aria-controls={columnsId}
              onClick={() => setShowColumns(!showColumns)}
            >
              <span>View Columns</span>
              <ChevronDownIcon
                className={cn("h-4 w-4", showColumns && "rotate-180")}
              />
            </Button>
          </div>
        )
      )}
      {showColumns && flow.parsed && !flow.busy && (
        <div id={columnsId} className="flex flex-wrap gap-1">
          {flow.parsed.headers.map((header, index) => (
            <Badge
              variant="neutral"
              key={index}
              className="max-w-full whitespace-normal break-words"
            >
              {header || "–"}
            </Badge>
          ))}
        </div>
      )}
      {flow.parsed?.reimport && (
        <p className="break-words rounded-control bg-info-muted p-3 text-xs text-info">
          Re-import of {flow.parsed.reimport.originalImportId}: rows
          will be linked to the original import.
        </p>
      )}
    </Card>
  );
}

/** Replaces the success box while Next runs: upload with a percentage, then batch creation with a running bar. */
export function BulkImportStartProgress({ label, value, creating }: { label: string; value: number; creating: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="space-y-2.5 rounded-control bg-accent p-3 text-foreground"
    >
      <div className="flex items-center gap-3">
        <SpinnerIcon
          aria-hidden="true"
          className="h-5 w-5 shrink-0 animate-spin text-accent-foreground motion-reduce:animate-none"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold">
            {label}
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {creating ? "Preparing your rows. This can take a moment for large files." : "Keep this page open until it finishes."}
          </p>
        </div>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          Step {creating ? 2 : 1} of 2
        </span>
      </div>
      <Progress
        value={value}
        animated={creating}
        aria-label={label}
        aria-valuetext={creating ? "In progress" : `${Math.round(value)}%`}
        className="bg-background motion-reduce:[&>div]:animate-none"
      />
    </div>
  );
}
