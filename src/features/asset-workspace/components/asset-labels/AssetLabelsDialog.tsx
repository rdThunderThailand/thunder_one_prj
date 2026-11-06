"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/lovable/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/lovable/dialog";
import { ChevronLeftIcon, ChevronRightIcon, DownloadIcon, PrintIcon } from "@/components/ui/icons";
import type { AssetLabelsFlow } from "../../hooks/use-asset-labels";
import { AssetLabelPreview, type LabelPreviewStatus } from "./AssetLabelPreview";
import { AssetLabelsProgress } from "./AssetLabelsProgress";
import { AssetLabelsReady } from "./AssetLabelsReady";

export function AssetLabelsDialog({ flow }: { flow: AssetLabelsFlow }) {
  const [preview, setPreview] = useState({ labels: flow.labels, index: 0, status: "loading" as LabelPreviewStatus });
  if (preview.labels !== flow.labels) setPreview({ labels: flow.labels, index: 0, status: "loading" });
  const current = preview.labels === flow.labels ? preview : { labels: flow.labels, index: 0, status: "loading" };

  function updatePreviewStatus(status: LabelPreviewStatus) {
    setPreview((previous) => {
      if (previous.labels !== flow.labels || previous.index !== current.index || previous.status === status) return previous;
      return { ...previous, status };
    });
  }

  if (!flow.phase) return null;
  const loading = flow.phase === "loading";
  const preparing = loading || (flow.phase === "preview" && current.status === "loading");
  const generating = flow.phase === "generating";
  const ready = flow.phase === "ready";
  const count = flow.scope.length || flow.labels.length;
  const retryable = flow.scope.length > 0 && flow.error && (flow.error.status === 0 || flow.error.status >= 500);
  return (
    <Dialog open onOpenChange={(open) => { if (!open) flow.close(); }}>
      <DialogContent
        className="flex max-h-dvh flex-col gap-0 overflow-hidden rounded-card bg-card p-0 sm:max-w-lg sm:rounded-card [&>button]:size-8"
        onCloseAutoFocus={(event) => { event.preventDefault(); flow.restoreFocus(); }}
        onPointerDownOutside={(event) => { if (preparing || generating) event.preventDefault(); }}
      >
        <DialogHeader className="shrink-0 p-4 text-left">
          <div className="flex items-center gap-3 pr-6">
            <Image src="/brand/t1-mark.svg" width={40} height={28} alt="" className="h-6 w-auto shrink-0" />
            <DialogTitle>{generating ? "Generating Labels…" : ready ? "Labels Ready" : "Print / Download Asset Labels"}</DialogTitle>
          </div>
          <DialogDescription>
            {count ? `${count.toLocaleString("en-GB")} selected ${count === 1 ? "asset" : "assets"} · one 50 × 30 mm label per PDF page` : "Generate labels for explicitly selected assets."}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 space-y-4 overflow-y-auto px-4 pb-4">
          {(preparing || generating) && (
            <AssetLabelsProgress
              completed={flow.completed}
              total={generating ? flow.labels.length : count}
              preparation={preparing ? { ...flow.preparation, preview: current.status === "ready" } : undefined}
            />
          )}
          {flow.phase === "preview" && flow.labels[current.index] && (
            <div className={preparing ? "hidden" : "space-y-4"}>
              <AssetLabelPreview key={flow.labels[current.index].id} label={flow.labels[current.index]} onStatus={updatePreviewStatus} />
              <nav aria-label="Label previews" className="flex items-center justify-center gap-3">
                <Button variant="outline" size="icon-sm" aria-label="Previous label" disabled={current.index === 0} onClick={() => setPreview({ ...current, index: current.index - 1, status: "loading" })}>
                  <ChevronLeftIcon className="size-4" />
                </Button>
                <span className="text-xs tabular-nums">{current.index + 1} / {flow.labels.length}</span>
                <Button variant="outline" size="icon-sm" aria-label="Next label" disabled={current.index + 1 === flow.labels.length} onClick={() => setPreview({ ...current, index: current.index + 1, status: "loading" })}>
                  <ChevronRightIcon className="size-4" />
                </Button>
              </nav>
            </div>
          )}
          {ready && flow.file && <AssetLabelsReady filename={flow.file.filename} size={flow.file.blob.size} count={flow.labels.length} />}
          {flow.error && (
            <div role="alert" className="space-y-2 rounded-control bg-error-muted p-3 text-xs leading-relaxed text-foreground">
              <p>{flow.error.message}</p>
              {flow.error.assetNames.length > 0 && (
                <ul className="list-disc space-y-1 pl-4">
                  {flow.error.assetNames.map((name, index) => <li key={index} className="wrap-anywhere">{name}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border p-4">
          <Button variant="outline" size="sm" onClick={flow.close}>{ready || flow.phase === "error" ? "Close" : "Cancel"}</Button>
          <div className="flex flex-wrap gap-2">
            {flow.error?.status === 401 && (
              <Button asChild size="sm">
                <Link href="/login">Sign in</Link>
              </Button>
            )}
            {flow.phase === "error" && retryable && <Button size="sm" onClick={flow.retry}>Retry</Button>}
            {flow.phase === "preview" && <Button size="sm" disabled={current.status !== "ready"} onClick={() => void flow.generate()}>Generate PDF</Button>}
            {ready && (
              <>
                <Button variant="outline" size="sm" onClick={flow.print}>
                  <PrintIcon aria-hidden="true" className="size-4" />
                  Print
                </Button>
                <Button size="sm" onClick={flow.download}>
                  <DownloadIcon aria-hidden="true" className="size-4" />
                  Download
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
