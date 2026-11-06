"use client";

import Link from "next/link";
import { ArrowRightIcon, CheckCircleIcon, DownloadIcon, SpinnerIcon, XCircleIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { cn } from "@/lib/utils";
import { formatBangkokDateTime, formatCount } from "../../domain/asset-import-format";
import type { ImportBatch } from "../../domain/asset-import-types";

export function BulkImportResultBanner({
  batch,
  onSourceFile,
  sourceMissing,
  busy,
  assetsHref,
  animate = false,
}: {
  batch: ImportBatch;
  onSourceFile: () => void;
  sourceMissing: boolean;
  busy: string | null;
  assetsHref: string;
  animate?: boolean;
}) {
  const failed = batch.status === "failed";
  const registered = batch.counts.created + batch.counts.createdWithWarning;
  return (
    <section
      className={cn(
        "grid shrink-0 items-center gap-4 rounded-card border p-4 @min-5xl/result:grid-cols-[minmax(0,1fr)_auto_minmax(0,20rem)]",
        failed
          ? "border-error/30 bg-error-muted/40"
          : "border-success/30 bg-success-muted/40",
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex size-14 shrink-0 items-center justify-center rounded-full",
              animate && "animate-ring-in",
              failed
                ? "bg-error text-error-foreground"
                : "bg-success text-success-foreground",
            )}
          >
            {failed ? (
              <XCircleIcon className="size-7" />
            ) : (
              <CheckCircleIcon className="size-7" />
            )}
          </span>
          <div className="min-w-0 space-y-1">
            <h2 className="text-lg font-bold">
              {failed ? "No Assets Registered" : "Bulk Registration Complete"}
            </h2>
            <p className="text-xs">
              {batch.status === "completed"
                ? `All ${formatCount(batch.totalRows)} rows were registered.`
                : failed
                  ? "No assets were registered."
                  : `${formatCount(registered)} of ${formatCount(batch.totalRows)} rows were registered.`}
            </p>
            <p className="text-2xs text-muted-foreground">
              The system has processed {formatCount(batch.totalRows)} rows from
              your file.
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {registered > 0 && (
          <Button asChild size="sm">
            <Link href={assetsHref}>
              <span>View Registered Assets</span>
              <ArrowRightIcon className="size-4" />
            </Link>
          </Button>
        )}
        <Button asChild size="sm" variant="outline">
          <Link href="/asset-workspace/assets/register">
            Register More Assets
          </Link>
        </Button>
      </div>
      <dl className="grid min-w-0 border-border @min-5xl/result:border-l @min-5xl/result:pl-4 content-start grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-3 gap-y-2 text-2xs">
        <dt className="text-muted-foreground">Import ID</dt>
        <dd className="wrap-anywhere font-semibold">{batch.batchCode}</dd>
        <dt className="text-muted-foreground">Imported by</dt>
        <dd className="wrap-anywhere">{batch.createdBy.name}</dd>
        <dt className="text-muted-foreground">Date &amp; Time</dt>
        <dd>{formatBangkokDateTime(batch.createdAt)} (Bangkok)</dd>
        <dt className="text-muted-foreground">Source File</dt>
        <dd className="min-w-0">
          {sourceMissing || !batch.sourceFile ? (
            <span>not available</span>
          ) : (
            <Button
              size="sm"
              variant="link"
              disabled={Boolean(busy)}
              onClick={onSourceFile}
              className="h-auto min-h-8 max-w-full justify-start whitespace-normal wrap-anywhere p-0 text-left text-2xs"
            >
              {busy === "source" ? (
                <SpinnerIcon className="size-3 shrink-0 animate-spin motion-reduce:animate-none" />
              ) : (
                <DownloadIcon className="size-3 shrink-0" />
              )}
              <span>{batch.sourceFile.name}</span>
            </Button>
          )}
        </dd>
        {batch.original && (
          <>
            <dt className="text-muted-foreground">Re-import of</dt>
            <dd className="wrap-anywhere">{batch.original.batchCode}</dd>
          </>
        )}
      </dl>
    </section>
  );
}
