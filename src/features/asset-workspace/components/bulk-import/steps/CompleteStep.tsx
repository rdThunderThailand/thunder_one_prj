"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeftIcon, ArrowRightIcon, DownloadIcon, SpinnerIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { cn } from "@/lib/utils";
import type { AssetImportFlow } from "../../../hooks/use-asset-import-flow";
import { useAssetImportFiles } from "../../../hooks/use-asset-import-files";
import { BulkImportCounts } from "../BulkImportCounts";
import { BulkImportErrorFileDialog } from "../BulkImportErrorFileDialog";
import { BulkImportRowsTable } from "../BulkImportRowsTable";
import { BulkImportResultBanner } from "../BulkImportResultBanner";
import { BulkImportNextSteps } from "../BulkImportNextSteps";

const ENTER = "animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-both duration-500 motion-reduce:animate-none";

export function CompleteStep({ flow, renderFooter }: {
  flow: AssetImportFlow;
  renderFooter: (content: ReactNode) => ReactNode;
}) {
  const { busy, sourceMissing, download, sourceFile, errorFileChoice, setErrorFileChoice } = useAssetImportFiles(flow);
  const batch = flow.batch;
  if (!batch) return null;
  const assetsHref = `/asset-workspace/assets?import_batch_id=${batch.id}`;
  // Only arriving from a live registration animates, not a later reload of this page.
  const enter = (delay: string) => flow.justRegistered && cn(ENTER, delay);

  return (
    <div className="@container/result flex shrink-0 flex-col gap-3">
      <div className={cn(enter("[animation-delay:0ms]"))}>
        <BulkImportResultBanner
          batch={batch}
          onSourceFile={sourceFile}
          sourceMissing={sourceMissing}
          busy={busy}
          assetsHref={assetsHref}
          animate={flow.justRegistered}
        />
      </div>
      <div className={cn(enter("[animation-delay:120ms]"))}>
        <BulkImportCounts variant="result" batch={batch} animate={flow.justRegistered} />
      </div>
      <section
        className={cn("flex min-w-0 flex-col rounded-card border border-border bg-card p-4", enter("[animation-delay:240ms]"))}
        aria-label="Import results"
      >
        <BulkImportRowsTable
          key={batch.id}
          api={flow.api}
          batchId={batch.id}
          batch={batch}
          variant="result"
          onReloadBatch={flow.reload}
          initialTab={batch.counts.notRegistered ? "not_registered" : "all"}
          onReimport={() => setErrorFileChoice({ reimport: true })}
          reimporting={Boolean(busy)}
          toolbar={
            batch.counts.notRegistered > 0 ? (
              <Button
                size="sm"
                variant="outline"
                disabled={Boolean(busy)}
                onClick={() => setErrorFileChoice({ reimport: false })}
              >
                {busy === "error" ? (
                  <SpinnerIcon className="size-4 animate-spin motion-reduce:animate-none" />
                ) : (
                  <DownloadIcon className="size-4" />
                )}
                <span>Download Error File</span>
              </Button>
            ) : undefined
          }
        />
      </section>
      <div className={cn(enter("[animation-delay:360ms]"))}>
        <BulkImportNextSteps
          batch={batch}
          assetsHref={assetsHref}
          busy={busy}
          onDownloadResult={() => download("result")}
          onReimport={() => setErrorFileChoice({ reimport: true })}
        />
      </div>
      {errorFileChoice && (
        <BulkImportErrorFileDialog
          reimport={errorFileChoice.reimport}
          rowCount={batch.counts.notRegistered}
          busy={Boolean(busy)}
          onDownload={(format) => download("error", errorFileChoice.reimport, format)}
          onClose={() => setErrorFileChoice(null)}
        />
      )}
      {renderFooter(
        <>
          <Button variant="outline" size="sm" className="max-sm:h-10" asChild>
            <Link href="/asset-workspace/assets">
              <ArrowLeftIcon className="size-4" />
              <span>Back to Assets</span>
            </Link>
          </Button>
          <Button size="sm" className="max-sm:h-10" asChild>
            <Link href="/asset-workspace/assets/register">
              <span>Register More Assets</span>
              <ArrowRightIcon className="size-4" />
            </Link>
          </Button>
        </>,
      )}
    </div>
  );
}
