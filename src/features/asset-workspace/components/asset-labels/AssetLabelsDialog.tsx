"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/lovable/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/lovable/dialog";
import { ChevronLeftIcon, ChevronRightIcon, DownloadIcon, PrintIcon } from "@/components/ui/icons";
import { Checkbox } from "@/components/ui/lovable/checkbox";
import { LABEL_FIELD_NAMES, LABEL_FIELDS, LABEL_FORMATS, type LabelFormat } from "../../domain/asset-labels";
import type { AssetLabelsFlow } from "../../hooks/use-asset-labels";
import { AssetLabelPreview, type LabelPreviewStatus } from "./AssetLabelPreview";
import { AssetLabelsProgress } from "./AssetLabelsProgress";
import { AssetLabelsReady } from "./AssetLabelsReady";

const FORMAT_SHORT: Record<LabelFormat, string> = { qr: "QR Code", barcode: "Barcode", both: "QR + Barcode" };
const FORMAT_HELP: Record<LabelFormat, string> = {
  both: "Recommended. QR opens the Asset Profile; the Code128 barcode encodes the Asset Tag.",
  qr: "Opens the Asset Profile when scanned with a phone camera.",
  barcode: "Code128 of the Asset Tag, for compatible barcode scanners.",
};

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
        className={`flex max-h-dvh flex-col gap-0 overflow-hidden rounded-card bg-card p-0 sm:rounded-card ${flow.phase === "preview" ? "sm:max-w-2xl" : "sm:max-w-lg"} [&>button]:size-8`}
        onCloseAutoFocus={(event) => { event.preventDefault(); flow.restoreFocus(); }}
        onPointerDownOutside={(event) => { if (loading || generating) event.preventDefault(); }}
      >
        <DialogHeader className="shrink-0 p-4 text-left">
          <div className="flex items-center gap-3 pr-6">
            <Image src="/brand/t1-mark.svg" width={40} height={28} alt="" className="h-6 w-auto shrink-0" />
            <DialogTitle>{generating ? "Generating Labels…" : ready ? "Labels Ready" : "Print / Download Asset Labels"}</DialogTitle>
          </div>
          <DialogDescription>
            {count ? `${count.toLocaleString("en-GB")} selected ${count === 1 ? "asset" : "assets"}` : "Generate labels for explicitly selected assets."}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 space-y-4 overflow-y-auto px-4 pb-4">
          {(loading || generating) && (
            <AssetLabelsProgress
              completed={flow.completed}
              total={generating ? flow.labels.length : count}
              preparation={loading ? { ...flow.preparation, preview: false } : undefined}
            />
          )}
          {flow.phase === "preview" && flow.labels[current.index] && (
            <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_15rem]">
              <div className="space-y-4 text-xs">
                <fieldset className="space-y-2">
                  <legend className="mb-2 font-medium text-foreground">Label type</legend>
                  <div className="grid grid-cols-3 gap-1 rounded-control bg-muted p-1">
                    {LABEL_FORMATS.map((format) => (
                      <label
                        key={format}
                        className={
                          "flex min-h-8 cursor-pointer items-center justify-center rounded-control px-2 text-center font-medium transition-colors focus-within:ring-2 focus-within:ring-ring " +
                          (flow.format === format ? "bg-card text-foreground shadow-control" : "text-muted-foreground hover:text-foreground")
                        }
                      >
                        <input
                          type="radio"
                          name="asset-label-format"
                          value={format}
                          checked={flow.format === format}
                          onChange={() => flow.setFormat(format)}
                          aria-describedby="asset-label-format-help"
                          className="sr-only"
                        />
                        {FORMAT_SHORT[format]}
                      </label>
                    ))}
                  </div>
                  <p id="asset-label-format-help" className="min-h-8 leading-relaxed text-muted-foreground">{FORMAT_HELP[flow.format]}</p>
                </fieldset>
                <fieldset className="space-y-2">
                  <legend className="mb-2 font-medium text-foreground">Include</legend>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {LABEL_FIELDS.map((field) => (
                      <label key={field} className="flex min-h-6 cursor-pointer items-center gap-2 text-foreground">
                        <Checkbox
                          className="rounded-xs"
                          aria-label={LABEL_FIELD_NAMES[field]}
                          checked={flow.fields[field]}
                          onCheckedChange={(checked) => flow.setField(field, checked === true)}
                        />
                        {LABEL_FIELD_NAMES[field]}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Size</span> 50 × 30 mm, one label per page
                </p>
              </div>
              <div className="space-y-2">
                <AssetLabelPreview key={flow.labels[current.index].id} label={flow.labels[current.index]} format={flow.format} fields={flow.fields} onStatus={updatePreviewStatus} />
                {flow.labels.length > 1 && (
                  <nav aria-label="Label previews" className="flex items-center justify-center gap-3">
                    <Button variant="ghost" size="icon-sm" aria-label="Previous label" disabled={current.index === 0} onClick={() => setPreview({ ...current, index: current.index - 1, status: "loading" })}>
                      <ChevronLeftIcon className="size-4" />
                    </Button>
                    <span className="text-xs tabular-nums text-muted-foreground">{current.index + 1} / {flow.labels.length}</span>
                    <Button variant="ghost" size="icon-sm" aria-label="Next label" disabled={current.index + 1 === flow.labels.length} onClick={() => setPreview({ ...current, index: current.index + 1, status: "loading" })}>
                      <ChevronRightIcon className="size-4" />
                    </Button>
                  </nav>
                )}
              </div>
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
