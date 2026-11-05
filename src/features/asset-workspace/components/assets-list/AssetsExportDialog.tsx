"use client";

import Image from "next/image";
import { Button } from "@/components/ui/lovable/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/lovable/dialog";
import { DownloadIcon, FileTextIcon, InfoIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { exportCountIssue, EXPORT_COLUMNS } from "../../domain/asset-export";
import type { AssetExportFlow } from "../../hooks/use-asset-export";
import { AssetsFileProgress } from "./AssetsFileProgress";

export function AssetsExportDialog({ flow }: { flow: AssetExportFlow }) {
  const scope = flow.scope;
  if (!scope) return null;
  const issue = exportCountIssue(scope.count);
  const blocked = Boolean(issue) || [401, 403, 404].includes(flow.error?.status ?? 0);

  return (
    <Dialog open onOpenChange={(open) => { if (!open) flow.close(); }}>
      <DialogContent
        className="flex max-h-dvh flex-col gap-0 overflow-hidden rounded-card bg-card p-0 sm:max-w-sm sm:rounded-card [&>button]:size-8"
        onCloseAutoFocus={(event) => { event.preventDefault(); flow.restoreFocus(); }}
        onPointerDownOutside={(event) => { if (flow.pending) event.preventDefault(); }}
      >
        <DialogHeader className="shrink-0 p-4 text-left">
          <div className="flex items-center gap-3 pr-6">
            <Image src="/brand/t1-mark.svg" width={40} height={28} alt="" className="h-6 w-auto shrink-0" />
            <DialogTitle>{flow.pending ? "Preparing asset export…" : "Export Assets"}</DialogTitle>
          </div>
          <DialogDescription>
            {flow.pending ? "Creating your CSV file" : "Confirm which assets to export from your current view."}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 space-y-4 overflow-y-auto px-4 pb-4">
          {flow.pending ? (
            <AssetsFileProgress
              kind="assets"
              description={`Preparing CSV for ${scope.count.toLocaleString("en-GB")} ${scope.request.scope === "selected" ? "selected" : "matching"} assets`}
              stage="Waiting for the asset service…"
            />
          ) : (
            <>
              <section aria-labelledby="asset-export-format" className="space-y-2">
                <h3 id="asset-export-format" className="text-xs font-semibold">Export Format</h3>
                <div className="flex items-start gap-3 rounded-control border border-border p-3">
                  <FileTextIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">CSV (.csv)</p>
                    <p className="text-xs text-muted-foreground">UTF-8 format for Excel and other spreadsheets</p>
                  </div>
                </div>
              </section>
              <div className="flex items-start gap-3 rounded-control bg-info-muted p-3 text-xs leading-relaxed text-foreground">
                <InfoIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
                <div className="min-w-0 space-y-1">
                  <p className="font-semibold">{scope.label}</p>
                  <p className="tabular-nums">{scope.count.toLocaleString("en-GB")} assets</p>
                  <p>The export includes {EXPORT_COLUMNS.length} standard asset columns.</p>
                </div>
              </div>
            </>
          )}
          {(issue || flow.error) && (
            <p role="alert" className="rounded-control bg-error-muted p-3 text-xs leading-relaxed text-foreground">
              {flow.error?.message ?? issue}
            </p>
          )}
        </div>
        <div className={cn("flex shrink-0 flex-wrap items-center gap-3 border-t border-border p-4", flow.pending ? "justify-center" : "justify-between")}>
          <Button variant="outline" size="sm" onClick={flow.close}>Cancel</Button>
          {!flow.pending && (flow.error?.status === 401 ? (
            <Button asChild size="sm">
              <a href="/login">Sign in</a>
            </Button>
          ) : (
            <Button size="sm" disabled={blocked} onClick={() => void flow.download()}>
              {flow.error ? "Retry export" : "Export"}
              <DownloadIcon aria-hidden="true" className="size-4" />
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
