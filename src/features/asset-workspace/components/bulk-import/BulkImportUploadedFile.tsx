"use client";

import { useId, useState } from "react";
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
  if (!file) return null;

  return (
    <section
      id={fileFeedbackId}
      className="space-y-3 rounded-card border border-border bg-card p-4"
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
                  ? "File format is valid. Click Next to continue."
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
      {showColumns && flow.parsed && (
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
      {flow.progress && (
        <div className="space-y-2" role="status">
          <Progress
            value={flow.progress.value}
            aria-label={flow.progress.label}
          />
          <p className="text-2xs text-muted-foreground">
            {flow.progress.label}
          </p>
        </div>
      )}
    </section>
  );
}
