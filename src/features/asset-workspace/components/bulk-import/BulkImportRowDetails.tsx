"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  FileTextIcon,
  RefreshIcon,
  SpinnerIcon,
  WarningTriangleIcon,
  XCircleIcon,
} from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/lovable/dialog";
import { Skeleton } from "@/components/ui/lovable/skeleton";
import { formatBangkokDateTime, formatCount } from "../../domain/asset-import-format";
import { rowFieldChecks, rowHasExtraMessages, rowIssueCounts } from "../../domain/asset-import-row-details";
import type { ImportBatch, ImportRow } from "../../domain/asset-import-types";
import { downloadBlob } from "../../services/asset-import-template";
import { ErrorState } from "../states/ErrorState";
import { BulkImportRowDetailsTables } from "./BulkImportRowDetailsTables";
import { ImportMessageList, ImportResultBadge } from "./BulkImportRowMessages";

const RESULT_TEXT = {
  created: "This row was registered.",
  created_with_warning: "This row was registered. Its warnings were approved during Review & Confirm.",
  not_registered: "This row was not registered. Check the details below and fix the data in your file.",
};

const plural = (count: number, word: string) => `${formatCount(count)} ${word}${count === 1 ? "" : "s"}`;

function InfoCell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="text-2xs text-muted-foreground">{label}</p>
      <div className="wrap-anywhere text-xs font-semibold">{children}</div>
    </div>
  );
}

function IssueCard({ tone, title, body }: { tone: "error" | "warning"; title: string; body: string }) {
  const Icon = tone === "error" ? XCircleIcon : WarningTriangleIcon;
  return (
    <div className={`flex items-center gap-3 rounded-control border p-3 ${
      tone === "error" ? "border-error/30 bg-error-muted/40" : "border-warning/30 bg-warning-muted/40"
    }`}>
      <Icon className={`size-6 shrink-0 ${tone === "error" ? "text-error" : "text-warning"}`} />
      <div className="min-w-0">
        <p className={`text-xs font-semibold ${tone === "error" ? "text-error" : "text-warning"}`}>{title}</p>
        <p className="text-2xs">{body}</p>
      </div>
    </div>
  );
}

function RowBody({ row, batch }: { row: ImportRow; batch?: ImportBatch }) {
  const { errors, warnings } = rowIssueCounts(row);
  const registered = row.result !== "not_registered";
  return (
    <>
      <div className="grid grid-cols-2 gap-3 rounded-control border border-border bg-muted/40 p-3 @min-2xl/details:grid-cols-4">
        <InfoCell label="File Name">
          <span className="flex items-center gap-2">
            <FileTextIcon className="size-4 shrink-0 text-success" />
            {batch?.sourceFile?.name ?? "not available"}
          </span>
        </InfoCell>
        <InfoCell label="Import ID">{batch?.batchCode ?? "–"}</InfoCell>
        <InfoCell label="Row Number">{row.rowIndex}</InfoCell>
        <InfoCell label="Row Status"><ImportResultBadge result={row.result} /></InfoCell>
      </div>
      <BulkImportRowDetailsTables rowIndex={row.rowIndex} checks={rowFieldChecks(row)} />
      {rowHasExtraMessages(row) && (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Messages</h3>
          {row.errorMessage && !row.messages.some((message) => message.message === row.errorMessage) && (
            <p className="text-xs">{row.errorMessage}</p>
          )}
          {row.messages.some((message) => message.field === "row") && (
            <ImportMessageList row={{ ...row, messages: row.messages.filter((message) => message.field === "row") }} />
          )}
        </section>
      )}
      {(errors > 0 || warnings > 0 || row.override || row.createdAsset || row.originalRowIndex !== null) && (
        <div className="grid gap-3 @min-2xl/details:grid-cols-2">
          {errors > 0 && (
            <IssueCard tone="error" title={`${plural(errors, "Error")} must be fixed`} body="Fix the data in your file and import again." />
          )}
          {warnings > 0 && (
            <IssueCard
              tone="warning"
              title={registered ? `${plural(warnings, "Warning")} approved` : errors ? `${plural(warnings, "Warning")} (optional to fix)` : `${plural(warnings, "Warning")} not approved`}
              body={registered ? "The asset was created with these warnings." : errors ? "You can update this value if needed." : "This row was not registered because its warning was not approved."}
            />
          )}
          {(row.override || row.createdAsset || row.originalRowIndex !== null) && (
            <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-control border border-border bg-muted/40 p-3 only:col-span-full">
              {row.createdAsset && (
                <InfoCell label="Created asset">
                  <Link href={`/asset-workspace/assets/${row.createdAsset.id}`} className="inline-flex min-h-8 items-center text-primary underline underline-offset-4">
                    {row.createdAsset.assetTag} · {row.createdAsset.name}
                  </Link>
                </InfoCell>
              )}
              {row.override && (
                <InfoCell label="Override">
                  <span className="block whitespace-pre-wrap">{row.override.reason ?? "–"}</span>
                  <span className="block text-2xs font-normal text-muted-foreground">
                    {row.override.by?.name ?? "Unknown"} · {formatBangkokDateTime(row.override.at)} (Bangkok)
                  </span>
                </InfoCell>
              )}
              {row.originalRowIndex !== null && (
                <InfoCell label="Original row">{row.originalRowIndex}</InfoCell>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}

export function BulkImportRowDetails({
  row, batch, position, loading, error, canPrevious, canNext, onStep, onRetry, onClose, onReimport, reimporting = false,
}: {
  row: ImportRow | null;
  batch?: ImportBatch;
  position?: { index: number; total: number };
  loading: boolean;
  error?: string;
  canPrevious: boolean;
  canNext: boolean;
  onStep: (delta: 1 | -1) => void;
  onRetry: () => void;
  onClose: () => void;
  onReimport?: () => void;
  reimporting?: boolean;
}) {
  function downloadRow() {
    if (!row) return;
    const blob = new Blob([JSON.stringify(row, null, 2)], { type: "application/json" });
    downloadBlob(blob, `${batch?.batchCode ?? "import"}-row-${row.rowIndex}.json`);
  }
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-6xl flex-col gap-0 rounded-card bg-card p-0 sm:rounded-card [&>button]:inline-flex [&>button]:size-10 [&>button]:items-center [&>button]:justify-center">
        <header className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-border p-4 pr-14 sm:px-6 sm:pr-14">
          <div className="min-w-0 space-y-1">
            <DialogTitle className="text-xl">Row Details</DialogTitle>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {row && (
                <span>
                  Row {row.rowIndex}
                  {position && ` · ${formatCount(position.index)} of ${formatCount(position.total)}`}
                </span>
              )}
              {row && <ImportResultBadge result={row.result} />}
            </div>
            <DialogDescription className="text-xs">
              {row?.result ? RESULT_TEXT[row.result] : "Source values and registration result."}
            </DialogDescription>
          </div>
          <div className="flex items-center rounded-control border border-border">
            <Button size="icon" variant="ghost" aria-label="Previous row" disabled={!canPrevious} onClick={() => onStep(-1)}>
              <ChevronLeftIcon className="size-4" />
            </Button>
            <span className="min-w-16 border-x border-border px-2 text-center text-xs font-semibold tabular-nums">
              {row ? `Row ${row.rowIndex}` : "…"}
            </span>
            <Button size="icon" variant="ghost" aria-label="Next row" disabled={!canNext} onClick={() => onStep(1)}>
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </header>
        <div className="@container/details min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 sm:px-6">
          {row ? (
            <RowBody row={row} batch={batch} />
          ) : loading ? (
            <div role="status" aria-label="Loading row" className="space-y-3">
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton key={index} className="h-9 motion-reduce:animate-none" />
              ))}
            </div>
          ) : (
            <ErrorState title="Couldn’t load this row" body={error ?? "This row is no longer available."} onRetry={onRetry} />
          )}
        </div>
        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border p-4 sm:px-6">
          <Button size="sm" variant="outline" disabled={!row} onClick={downloadRow}>
            <DownloadIcon className="size-4" />
            <span>Download Row (JSON)</span>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" className="min-w-20" onClick={onClose}>Close</Button>
            {row?.result === "not_registered" && onReimport && (
              <Button size="sm" disabled={reimporting} onClick={onReimport}>
                <span>Edit in File &amp; Re-import</span>
                {reimporting ? (
                  <SpinnerIcon className="size-4 animate-spin motion-reduce:animate-none" />
                ) : (
                  <RefreshIcon className="size-4" />
                )}
              </Button>
            )}
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
