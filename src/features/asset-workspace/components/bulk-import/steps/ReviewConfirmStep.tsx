"use client";

import { Card } from "@/components/ui/Card";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeftIcon,
} from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { formatCount } from "../../../domain/asset-import-format";
import type {
  ConfirmMode,
} from "../../../domain/asset-import-types";
import type { AssetImportFlow } from "../../../hooks/use-asset-import-flow";
import { ImportApiError } from "../../../services/asset-import-api";
import {
  readImportSession,
  saveImportSession,
} from "../../../services/asset-import-session";
import { importReviewSelection } from "../../../domain/asset-import-review";
import { BulkImportRegistrationSummary } from "../BulkImportRegistrationSummary";
import { BulkImportRegistrationOptions } from "../BulkImportRegistrationOptions";
import { BulkImportConfirmProgress } from "../BulkImportConfirmProgress";
import { BulkImportFileBar } from "../BulkImportFileBar";
import { BulkImportCorrectedDownload } from "../BulkImportCorrectedDownload";
import { BulkImportReviewFooter } from "../BulkImportReviewFooter";
import { BulkImportReviewDialogs } from "../BulkImportReviewDialogs";
import { BulkImportRowsTable } from "../BulkImportRowsTable";

export function ReviewConfirmStep({
  flow,
  renderFooter,
}: {
  flow: AssetImportFlow;
  renderFooter: (content: ReactNode) => ReactNode;
}) {
  const [mode, setMode] = useState<ConfirmMode>(() =>
    flow.batch
      ? (readImportSession(flow.batch.id).state?.confirmation?.mode ?? readImportSession(flow.batch.id).state?.mode ?? "ready_and_warnings")
      : "ready_and_warnings",
  );
  const [reason, setReason] = useState(() => flow.batch
    ? readImportSession(flow.batch.id).state?.confirmation?.override_reason ?? "" : "");
  const [touched, setTouched] = useState(false);
  const [dialog, setDialog] = useState<"confirm" | "mapping" | null>(null);
  const reasonId = useId();
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  const reasonRequestError = flow.error instanceof ImportApiError && flow.error.code === "VALIDATION";
  useEffect(() => {
    if (reasonRequestError) reasonRef.current?.focus();
  }, [reasonRequestError, flow.error]);
  const { batch, options } = flow;
  if (!batch || !options) return null;
  const { valid, warning, error } = batch.counts;
  const frozen = flow.confirmation !== null;
  const reviewMode = flow.confirmation?.mode ?? mode;
  const reviewReason = flow.confirmation?.override_reason ?? reason;
  const selection = importReviewSelection(batch.counts, reviewMode, reviewReason, options.serialOverride.maxLength);
  const { warnings: selectedWarnings, toRegister, needsReason, invalidReason: missingReason } = selection;
  const requestValidation = needsReason && reasonRequestError;
  const reasonError = needsReason && ((touched && missingReason) || requestValidation);
  const processing = batch.status === "processing" || flow.confirming;
  const creator = batch.createdBy.id === flow.context.split(":")[1];

  function changeMode(next: ConfirmMode) {
    setMode(next);
    if (!batch) return;
    const saved = readImportSession(batch.id).state;
    if (saved) saveImportSession(batch.id, { ...saved, mode: next });
  }

  return (
    <div className="@container/review flex min-w-0 flex-1 shrink-0 flex-col gap-3">
      {processing ? (
        <BulkImportConfirmProgress
          batch={batch}
          retrying={flow.retrying}
          error={
            flow.error instanceof ImportApiError && flow.error.status === 503
              ? "Bulk import is not available right now."
              : flow.error?.message
          }
          onRetry={
            flow.busy || !creator ? undefined : () => void flow.confirm(reviewMode, reviewReason)
          }
        />
      ) : (
        <>
          <BulkImportFileBar
            name={batch.sourceFile?.name ?? "Source file not available"}
            sizeBytes={batch.sourceFile?.sizeBytes ?? null}
            rows={batch.totalRows}
            columns={flow.parsed?.columnCount ?? null}
            action={
              <Button
                variant="outline"
                size="sm"
                disabled={flow.busy || !creator || frozen}
                onClick={() => setDialog("mapping")}
              >
                <ArrowLeftIcon className="size-4" />
                <span>Edit Mapping</span>
              </Button>
            }
          />
          {!creator && (
            <p role="status" className="rounded-control bg-info-muted p-3 text-xs text-info">
              Only the person who started this import can confirm it.
            </p>
          )}
          {flow.error && !requestValidation && (
            <p
              role="alert"
              className="rounded-control bg-error-muted p-3 text-xs text-error"
            >
              {flow.error instanceof ImportApiError && flow.error.status === 503
                ? "Bulk import is not available right now." : flow.error.message}
            </p>
          )}
          <BulkImportRegistrationSummary batch={batch} />
          <BulkImportCorrectedDownload api={flow.api} batch={batch} mapping={flow.mapping} disabled={flow.busy} />
          <div className="grid flex-1 grid-rows-[auto_1fr] gap-3 @min-5xl/review:grid-cols-[minmax(0,1fr)_20rem] @min-5xl/review:grid-rows-[1fr]">
            <BulkImportRegistrationOptions
              counts={batch.counts}
              mode={reviewMode}
              reason={reviewReason}
              onMode={changeMode}
              onReason={setReason}
              maxLength={options.serialOverride.maxLength}
              disabled={flow.busy || frozen || !creator}
              reasonId={reasonId}
              reasonRef={reasonRef}
              reasonError={reasonError}
              onBlur={() => setTouched(true)}
            />
            <Card className="flex min-w-0 flex-col gap-3 focus-within:border-foreground/20 focus-within:shadow-float motion-reduce:transition-none p-4">
              <h2 className="text-sm font-semibold">
                Preview Assets ({formatCount(toRegister)} rows will be
                registered)
              </h2>
              <BulkImportRowsTable
                key={batch.id}
                api={flow.api}
                batchId={batch.id}
                batch={batch}
                variant="review"
                keptPages={flow.keptPages}
                onReloadBatch={flow.reload}
                editor={{ context: flow.context, mapping: flow.mapping, options,
                  disabled: flow.busy || frozen || !creator, onSaved: flow.applyRowEdit, onReview: flow.showReview }}
              />
            </Card>
          </div>
        </>
      )}
      <BulkImportReviewDialogs {...{ dialog, setDialog, batch, toRegister, error, reviewMode, warning,
        flow, creator, missingReason, mode, reason, setTouched }} />
      {renderFooter(
        <BulkImportReviewFooter {...{ flow, processing, frozen, toRegister, missingReason, creator,
          reasonId, valid, selectedWarnings, reviewMode, reviewReason, setTouched, setDialog }} />,
      )}
    </div>
  );
}
