"use client";

import Image from "next/image";
import { Button } from "@/components/ui/lovable/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/lovable/dialog";
import { FileTextIcon } from "@/components/ui/icons";
import type { AssetsListTemplateFlow } from "../../hooks/use-assets-list-template";
import { AssetsFileProgress } from "./AssetsFileProgress";

const STAGES = {
  settings: { label: "Loading the latest import settings…", completed: 0 },
  references: { label: "Loading category and location references…", completed: 1 },
  workbook: { label: "Building your Excel workbook…", completed: 2 },
};

export function AssetsTemplateDownloadDialog({ flow }: { flow: AssetsListTemplateFlow }) {
  if (!flow.pending && !flow.error) return null;
  return (
    <Dialog open onOpenChange={(open) => { if (!open) flow.cancel(); }}>
      <DialogContent
        className="flex max-h-dvh flex-col gap-0 overflow-hidden rounded-card bg-card p-0 sm:max-w-sm sm:rounded-card [&>button]:size-8"
        onCloseAutoFocus={(event) => { event.preventDefault(); flow.restoreFocus(); }}
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <DialogHeader className="shrink-0 p-4 text-left">
          <div className="flex items-center gap-3 pr-6">
            <Image src="/brand/t1-mark.svg" width={40} height={28} alt="" className="h-6 w-auto shrink-0" />
            <DialogTitle>{flow.pending ? "Preparing import template…" : "Template not ready"}</DialogTitle>
          </div>
          <DialogDescription>Excel template for bulk asset registration</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 overflow-y-auto px-4 pb-4">
          {flow.stage && (
            <AssetsFileProgress
              kind="template"
              description="Creating asset-import-template.xlsx"
              stage={STAGES[flow.stage].label}
              steps={{ completed: STAGES[flow.stage].completed, total: 3 }}
            />
          )}
          {flow.error && (
            <div className="space-y-3 py-4 text-center">
              <FileTextIcon aria-hidden="true" className="mx-auto size-8 text-muted-foreground" />
              <p role="alert" className="rounded-control bg-error-muted p-3 text-xs leading-relaxed text-foreground">
                {flow.error}
              </p>
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap justify-center gap-3 border-t border-border p-4">
          <Button variant="outline" size="sm" onClick={flow.cancel}>{flow.pending ? "Cancel" : "Close"}</Button>
          {flow.error && <Button size="sm" onClick={() => void flow.download()}>Retry</Button>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
