"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/lovable/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/lovable/dialog";
import { ChevronLeftIcon, ChevronRightIcon, DownloadIcon, PrintIcon } from "@/components/ui/icons";
import { LABEL_FORMATS, labelFormatName } from "../../domain/asset-labels";
import type { AssetLabelsFlow } from "../../hooks/use-asset-labels";
import { AssetLabelPreview, type LabelPreviewStatus } from "./AssetLabelPreview";
import { AssetLabelsProgress } from "./AssetLabelsProgress";
import { AssetLabelsReady } from "./AssetLabelsReady";

export function AssetLabelsDialog({ flow }: { flow: AssetLabelsFlow }) {
  const [preview, setPreview] = useState({ labels: flow.labels, format: flow.format, index: 0, status: "loading" as LabelPreviewStatus });
  if (preview.labels !== flow.labels) setPreview({ labels: flow.labels, format: flow.format, index: 0, status: "loading" });
  else if (preview.format !== flow.format) setPreview({ ...preview, format: flow.format, status: "loading" });
  const current = preview.labels === flow.labels && preview.format === flow.format ? preview
    : { labels: flow.labels, format: flow.format, index: preview.labels === flow.labels ? preview.index : 0, status: "loading" };

  function updatePreviewStatus(status: LabelPreviewStatus) {
    setPreview((previous) => {
      if (previous.labels !== flow.labels || previous.index !== current.index || previous.format !== flow.format || previous.status === status) return previous;
      return { ...previous, status };
    });
  }

  if (!flow.phase) return null;
  const loading = flow.phase === "loading";
  const generating = flow.phase === "generating";
  const ready = flow.phase === "ready";
  const count = flow.scope.length || flow.labels.length;
  const retryable = flow.scope.length > 0 && flow.error && (flow.error.status === 0 || flow.error.status >= 500);
  return (
    <Dialog open onOpenChange={(open) => { if (!open) flow.close(); }}>
      <DialogContent
        className="flex max-h-dvh flex-col gap-0 overflow-hidden rounded-card bg-card p-0 sm:max-w-lg sm:rounded-card [&>button]:size-8"
        onCloseAutoFocus={(event) => { event.preventDefault(); flow.restoreFocus(); }}
        onPointerDownOutside={(event) => { if (loading || generating) event.preventDefault(); }}
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
          {flow.phase === "preview" && (
            <fieldset className="space-y-2">
              <legend className="text-xs font-medium text-foreground">Code type</legend>
              <div className="grid grid-cols-2 gap-2">
                {LABEL_FORMATS.map((format) => (
                  <label
                    key={format}
                    className={
                      "flex min-h-10 cursor-pointer items-center gap-2 rounded-control border p-3 text-xs focus-within:ring-2 focus-within:ring-ring " +
                      (flow.format === format ? "border-primary bg-accent text-accent-foreground" : "border-border bg-card text-foreground hover:bg-muted")
                    }
                  >
                    <input
                      type="radio"
                      name="asset-label-format"
                      value={format}
                      checked={flow.format === format}
                      onChange={() => flow.setFormat(format)}
                      className="size-4 shrink-0 accent-primary"
                      aria-describedby="asset-label-format-help"
                    />
                    <span className="font-semibold">{labelFormatName(format)}</span>
                  </label>
                ))}
              </div>
              <p id="asset-label-format-help" className="min-h-12 text-xs leading-relaxed text-muted-foreground sm:min-h-10">
                {flow.format === "qr" ? "Opens the Asset Profile when scanned with a phone camera." : "Encodes the Asset Tag for compatible barcode scanners."}
                {" "}Applies to all selected assets in this PDF.
              </p>
            </fieldset>
          )}
          {(loading || generating) && (
            <AssetLabelsProgress
              completed={flow.completed}
              total={generating ? flow.labels.length : count}
              preparation={loading ? { ...flow.preparation, preview: false } : undefined}
            />
          )}
          {flow.phase === "preview" && flow.labels[current.index] && (
            <div className="space-y-4">
              <AssetLabelPreview key={flow.labels[current.index].id} label={flow.labels[current.index]} format={flow.format} onStatus={updatePreviewStatus} />
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
          {ready && flow.file && <AssetLabelsReady filename={flow.file.filename} size={flow.file.blob.size} count={flow.labels.length} format={flow.format} />}
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
            {flow.phase === "preview" && <Button size="sm" disabled={current.status !== "ready" || flow.error?.code === "INVALID_TAG"} onClick={() => void flow.generate()}>Generate PDF</Button>}
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
