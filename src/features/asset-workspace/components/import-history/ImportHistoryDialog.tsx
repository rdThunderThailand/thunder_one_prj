"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/lovable/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/lovable/dialog";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { HISTORY_PAGE_SIZE } from "../../domain/asset-import-history";
import type { AssetImportHistoryFlow } from "../../hooks/use-asset-import-history";
import { EmptyState, LoadingState } from "../states/states";
import { ImportHistoryTable } from "./ImportHistoryTable";

export function ImportHistoryDialog({ flow }: { flow: AssetImportHistoryFlow }) {
  if (!flow.open) return null;
  const total = flow.data?.total ?? 0;
  const start = flow.data?.batches.length ? (flow.page - 1) * HISTORY_PAGE_SIZE + 1 : 0;
  const end = start ? start + (flow.data?.batches.length ?? 0) - 1 : 0;
  return (
    <Dialog open onOpenChange={(open) => { if (!open) flow.close(); }}>
      <DialogContent className="flex max-h-dvh flex-col gap-0 overflow-hidden rounded-card bg-card p-0 sm:max-w-3xl sm:rounded-card [&>button]:size-8"
        onCloseAutoFocus={(event) => { event.preventDefault(); flow.restoreFocus(); }}>
        <DialogHeader className="shrink-0 p-4 text-left">
          <div className="flex items-center gap-3 pr-6">
            <Image src="/brand/t1-mark.svg" width={40} height={28} alt="" className="h-6 w-auto shrink-0" />
            <DialogTitle>Import History</DialogTitle>
          </div>
          <DialogDescription>View all bulk import transactions.</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 overflow-y-auto px-4 pb-4" aria-busy={flow.pending}>
          {flow.pending ? <LoadingState rows={5} /> : flow.error ? (
            <div className="space-y-3 rounded-control bg-error-muted p-4">
              <p role="alert" className="text-xs leading-relaxed">{flow.error.message}</p>
              {flow.error.status === 401 ? (
                <Button asChild size="sm">
                  <Link href="/login">Sign in</Link>
                </Button>
              ) : flow.error.status !== 403 && <Button size="sm" variant="outline" onClick={flow.retry}>Retry</Button>}
            </div>
          ) : flow.data?.batches.length ? <ImportHistoryTable data={flow.data} onView={flow.close} />
            : <div className="py-6"><EmptyState title="No finished imports yet" body="Completed, partially completed and failed imports will appear here." /></div>}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border p-4">
          <Button variant="outline" size="sm" onClick={flow.close}>Close</Button>
          {(flow.data || flow.pending) && (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs tabular-nums text-muted-foreground">
                {flow.pending ? "Loading imports…" : `Showing ${start}–${end} of ${total.toLocaleString("en-GB")}`}
              </p>
              <nav aria-label="Import History pages" className="flex items-center gap-2">
                <Button variant="outline" size="icon-sm" disabled={flow.pending || flow.page <= 1} aria-label="Previous imports page" onClick={() => flow.changePage(flow.page - 1)}>
                  <ChevronLeftIcon className="size-4" />
                </Button>
                <span className="text-xs tabular-nums">
                  {flow.pending ? `Page ${flow.page}` : `${flow.page} / ${Math.max(1, Math.ceil(total / HISTORY_PAGE_SIZE))}`}
                </span>
                <Button variant="outline" size="icon-sm" disabled={flow.pending || flow.page * HISTORY_PAGE_SIZE >= total} aria-label="Next imports page" onClick={() => flow.changePage(flow.page + 1)}>
                  <ChevronRightIcon className="size-4" />
                </Button>
              </nav>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
