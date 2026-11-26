"use client";

import { useState, type ReactNode } from "react";
import { ChevronLeftIcon, ChevronRightIcon, RefreshIcon, SpinnerIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/lovable/sheet";
import { Skeleton } from "@/components/ui/lovable/skeleton";
import { formatCount } from "../../domain/asset-import-format";
import type { ImportBatch, ImportRow } from "../../domain/asset-import-types";
import { ErrorState } from "../states/ErrorState";
import { BulkImportRowBody } from "./BulkImportRowBody";
import { ImportResultBadge } from "./BulkImportRowMessages";

const RESULT_TEXT = {
  created: "This row was registered.",
  created_with_warning: "This row was registered. Its warnings were approved during Review & Confirm.",
  not_registered: "This row was not registered. Check the details below and fix the data in your file.",
};

function formatIssues(count: number) {
  return count === 0 ? "No issues" : `${formatCount(count)} ${count === 1 ? "issue" : "issues"}`;
}

function editedAgo(editedAt: string, now: number) {
  const minutes = Math.min(0, Math.round((Date.parse(editedAt) - now) / 60000));
  if (minutes === 0) return "just now";
  const [value, unit] = minutes > -60 ? [minutes, "minute"] : minutes > -1440 ? [Math.round(minutes / 60), "hour"] : [Math.round(minutes / 1440), "day"];
  return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(value, unit as Intl.RelativeTimeFormatUnit);
}

export function BulkImportRowDetails({
  row, batch, position, loading, error, canPrevious, canNext, onStep, onRetry, onClose, onReimport, reimporting = false, body, footer, editAction, returnFocus, description, issueCount,
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
  body?: ReactNode;
  footer?: ReactNode;
  editAction?: ReactNode;
  returnFocus?: () => void;
  description?: string;
  issueCount?: number;
}) {
  const [now] = useState(() => Date.now());
  return (
    <Sheet open onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent onCloseAutoFocus={returnFocus ? (event) => { event.preventDefault(); returnFocus(); } : undefined} side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl motion-reduce:animate-none motion-reduce:transition-none [&>button]:inline-flex [&>button]:size-11 [&>button]:items-center [&>button]:justify-center">
        <header className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-border p-4 pr-14 sm:px-6 sm:pr-14">
          <div className="min-w-0 space-y-1">
            <SheetTitle className="text-base">Row Details</SheetTitle>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {row && (
                <span>
                  Row {row.rowIndex}
                  {position && ` · ${formatCount(position.index)} of ${formatCount(position.total)}`}
                </span>
              )}
              {row && <ImportResultBadge result={row.result} />}
              {row && !row.result && <span className="text-xs text-muted-foreground">{formatIssues(issueCount ?? row.messages.length)}</span>}
            </div>
            {row?.editedAt && (
              <p className="text-xs text-muted-foreground">
                Edited by {row.editedBy?.name ?? "Unknown"} · {editedAgo(row.editedAt, now)}
              </p>
            )}
            {editAction}
            <SheetDescription className="text-xs">
              {row?.result ? RESULT_TEXT[row.result] : description ?? "Source values and registration result."}
            </SheetDescription>
          </div>
          <div className="flex items-center rounded-control border border-border">
            <Button size="icon" variant="ghost" className="min-h-11 min-w-11" aria-label="Previous row" disabled={!canPrevious} onClick={() => onStep(-1)}>
              <ChevronLeftIcon className="size-4" />
            </Button>
            <span className="min-w-16 border-x border-border px-2 text-center text-xs font-semibold tabular-nums">
              {row ? `Row ${row.rowIndex}` : "…"}
            </span>
            <Button size="icon" variant="ghost" className="min-h-11 min-w-11" aria-label="Next row" disabled={!canNext} onClick={() => onStep(1)}>
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </header>
        <div className="@container/details min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 sm:px-6">
          {row ? (
            body ?? <BulkImportRowBody row={row} batch={batch} />
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
        <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border p-4 sm:px-6">
          {footer ?? <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" className="min-h-11 min-w-20" onClick={onClose}>Close</Button>
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
          </div>}
        </footer>
      </SheetContent>
    </Sheet>
  );
}
