"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ArrowLeftIcon, ArrowRightIcon, RefreshIcon } from "@/components/ui/icons";
import { Button, buttonVariants } from "@/components/ui/lovable/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/lovable/alert-dialog";
import type { AssetImportFlow } from "../../../hooks/use-asset-import-flow";
import { BulkImportFileBar } from "../BulkImportFileBar";
import { BulkImportMappingCard } from "../BulkImportMappingCard";
import { BulkImportValidationPanel } from "../BulkImportValidationPanel";

export function MapValidateStep({ flow, renderFooter }: {
  flow: AssetImportFlow;
  renderFooter: (content: ReactNode) => ReactNode;
}) {
  const [replace, setReplace] = useState<"replace" | "back" | null>(null);
  const [replaceFailed, setReplaceFailed] = useState(false);
  const hintId = useId();
  const { batch, parsed, options } = flow;
  if (!options || (!batch && !flow.preview)) return null;
  const validated = batch?.status === "validated";
  const canContinue = validated && batch.counts.valid + batch.counts.warning > 0;

  function requestReplace(mode: "replace" | "back") {
    setReplaceFailed(false);
    setReplace(mode);
  }

  return (
    <div className="@container/map-validate flex min-w-0 shrink-0 flex-col gap-3">
      <BulkImportFileBar
        name={batch?.sourceFile?.name ?? parsed?.name ?? "Source file not available"}
        sizeBytes={batch?.sourceFile?.sizeBytes ?? parsed?.sizeBytes ?? null}
        rows={batch?.totalRows ?? parsed?.rows.length ?? null}
        columns={parsed?.columnCount ?? null}
        action={
          <Button variant="outline" size="sm" disabled={flow.busy} onClick={() => requestReplace("replace")}>
            <RefreshIcon className="size-4" />
            <span>Replace File</span>
          </Button>
        }
      />
      {flow.error && (
        <p role="alert" className="rounded-control bg-error-muted p-3 text-xs text-error">
          {flow.error.message}
        </p>
      )}
      <div className={cn(
        "grid gap-3 @min-4xl/map-validate:grid-cols-[minmax(0,7fr)_minmax(0,6fr)]",
        validated && "items-start",
      )}>
        <BulkImportMappingCard flow={flow} />
        <BulkImportValidationPanel key={batch?.id ?? "preview"} flow={flow} />
      </div>
      <AlertDialog open={replace !== null} onOpenChange={(open) => {
        if (!open && !flow.busy) setReplace(null);
      }}>
        <AlertDialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>{replace === "back" ? "Go back to Upload?" : "Replace the file?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {replace === "back" ? "The current check will be removed."
                : "Current results will be removed. No asset has been created."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {replaceFailed && flow.error && (
            <p role="alert" className="text-xs text-error">{flow.error.message}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={flow.busy}>Keep this file</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              disabled={flow.busy}
              onClick={async (event) => {
                event.preventDefault();
                setReplaceFailed(false);
                if (await flow.replaceFile()) setReplace(null);
                else setReplaceFailed(true);
              }}
            >
              Replace File
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {renderFooter(
        <>
          <Button variant="outline" size="sm" className="min-w-20 max-sm:h-10" disabled={flow.busy} onClick={() => requestReplace("back")}>
            <ArrowLeftIcon className="size-4" />
            <span>Back</span>
          </Button>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-3">
            {validated && !canContinue && (
              <p id={hintId} className="max-w-64 text-2xs text-error">
                No rows can be registered. Fix the file and replace it.
              </p>
            )}
            <Button
              size="sm"
              className="min-w-24 max-sm:h-10"
              disabled={!canContinue || flow.busy}
              aria-describedby={flow.preview ? "bulk-upload-preview-notice" : validated && !canContinue ? hintId : undefined}
              onClick={flow.showReview}
            >
              <span>Next</span>
              <ArrowRightIcon className="size-4" />
            </Button>
          </div>
        </>,
      )}
    </div>
  );
}
