"use client";

import { Card } from "@/components/ui/Card";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AlertCircleIcon, CheckCircleIcon, ClipboardIcon, DownloadIcon, SpinnerIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { formatCount } from "../../domain/asset-import-format";
import { missingRequired } from "../../domain/asset-import-mapping";
import { requestErrorText } from "../../domain/asset-import-messages";
import type { AssetImportFlow } from "../../hooks/use-asset-import-flow";
import { ImportApiError } from "../../services/asset-import-api";
import { downloadBlob } from "../../services/asset-import-template";
import { BulkImportCounts } from "./BulkImportCounts";
import { BulkImportGuideSheet } from "./BulkImportGuideSheet";
import { BulkImportRowsTable } from "./BulkImportRowsTable";
import { BulkImportStartProgress } from "./BulkImportUploadedFile";
import { BulkImportValidationProgress } from "./BulkImportValidationProgress";

export function BulkImportValidationPanel({ flow }: {
  flow: AssetImportFlow;
}) {
  const [downloading, setDownloading] = useState(false);
  const alive = useRef(false);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);
  const { batch, parsed, options, preview } = flow;
  if (!options) return null;
  const totalRows = batch?.totalRows ?? parsed?.rows.length ?? 0;
  const running = flow.busy && Boolean(flow.progress);
  const missingLabels = missingRequired(flow.mapping, options.columns)
    .map((key) => options.columns.find((column) => column.key === key)?.label ?? key);
  const requiredMissing = missingLabels.length > 0;

  async function downloadErrors() {
    if (!batch || downloading || flow.busy) return;
    setDownloading(true);
    try {
      const file = await flow.api.downloadFile(batch.id, "error", batch.batchCode);
      if (!alive.current) return;
      downloadBlob(file.blob, file.filename);
    } catch (error) {
      if (!alive.current) return;
      if (error instanceof ImportApiError && [404, 409].includes(error.status)) flow.reload();
      toast.error(error instanceof ImportApiError
        ? requestErrorText(error.code, error.status) : "The file could not be downloaded. Try again.");
    } finally {
      if (alive.current) setDownloading(false);
    }
  }

  return (
    <Card
      className="@container/validate flex min-w-0 flex-col gap-3 focus-within:border-foreground/20 focus-within:shadow-float motion-reduce:transition-none p-4"
      aria-busy={running}
    >
      <div className="space-y-1">
        <div className="flex min-h-8 flex-wrap items-center justify-between gap-x-2">
          <h2 className="text-sm font-semibold">2. Validate Data</h2>
          <BulkImportGuideSheet options={options}>
            <Button variant="link" size="sm" className="px-0 text-xs">
              View validation rules
            </Button>
          </BulkImportGuideSheet>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">We check the data using ThunderOne rules.</p>
      </div>
      {flow.remapping && flow.progress ? (
        <div className="flex flex-1 flex-col justify-center gap-3 py-6">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Preparing a new check with the same file. You can change the mapping when it is ready.
          </p>
          <BulkImportStartProgress
            label={flow.progress.label}
            value={flow.progress.value}
            creating={Boolean(flow.progress.creating)}
          />
        </div>
      ) : running && flow.progress ? (
        <BulkImportValidationProgress progress={flow.progress} />
      ) : batch?.status === "validated" ? (
        <>
          <BulkImportCounts variant="validation" counts={{ total: batch.totalRows, ...batch.counts }} />
          <BulkImportRowsTable
            key={batch.id}
            api={flow.api}
            batchId={batch.id}
            batch={batch}
            variant="validate"
            keptPages={flow.keptPages}
            onReloadBatch={flow.reload}
            editor={{ context: flow.context, mapping: flow.mapping, options,
              disabled: flow.busy || flow.confirmation !== null || batch.createdBy.id !== flow.context.split(":")[1],
              onSaved: flow.applyRowEdit, onReview: flow.showReview }}
            toolbar={batch.counts.error > 0 ? (
              <Button size="sm" variant="outline" disabled={downloading || flow.busy} onClick={() => void downloadErrors()}>
                {downloading ? (
                  <SpinnerIcon className="size-4 animate-spin motion-reduce:animate-none" />
                ) : (
                  <DownloadIcon className="size-4" />
                )}
                <span>Download Error File</span>
              </Button>
            ) : undefined}
          />
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
          <ClipboardIcon className="size-8 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            {preview
              ? "Review your column mapping here. Validation requires an enabled backend; your file has not been sent."
              : "Check the mapping on the left, then validate. After you validate, the mapping can't change."}
          </p>
          {!preview && parsed && (
            <p
              className={`flex items-center gap-1.5 text-xs ${requiredMissing ? "text-error" : "text-success"}`}
            >
              {requiredMissing ? (
                <AlertCircleIcon aria-hidden="true" className="size-4 shrink-0" />
              ) : (
                <CheckCircleIcon aria-hidden="true" className="size-4 shrink-0" />
              )}
              <span>
                {requiredMissing ? `Map ${missingLabels.join(", ")} to validate` : "All required fields are mapped"}
              </span>
            </p>
          )}
          <Button
            size="sm"
            disabled={preview || !parsed || requiredMissing || flow.busy}
            aria-describedby={preview ? "bulk-upload-preview-notice" : undefined}
            onClick={() => void flow.runValidation()}
          >
            Validate {formatCount(totalRows)} rows
          </Button>
        </div>
      )}
    </Card>
  );
}
