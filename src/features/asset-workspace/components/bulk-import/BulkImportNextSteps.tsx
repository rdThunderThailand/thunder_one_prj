"use client";

import { Card } from "@/components/ui/Card";
import type { ComponentType } from "react";
import Link from "next/link";
import { ChevronRightIcon, DownloadIcon, FileTextIcon, RefreshIcon, SpinnerIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { cn } from "@/lib/utils";
import { formatCount } from "../../domain/asset-import-format";
import type { ImportBatch } from "../../domain/asset-import-types";

const TILE = "h-auto min-h-20 w-full justify-start gap-3 whitespace-normal rounded-control border border-border p-3 text-left";

function TileBody({ icon: Icon, spinning = false, title, detail }: {
  icon: ComponentType<{ className?: string }>;
  spinning?: boolean;
  title: string;
  detail: string;
}) {
  return (
    <>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-info-muted text-primary">
        {spinning ? (
          <SpinnerIcon className="size-5 animate-spin motion-reduce:animate-none" />
        ) : (
          <Icon className="size-5" />
        )}
      </span>
      <span className="min-w-0 flex-1 space-y-1">
        <span className="block text-xs font-semibold text-primary">{title}</span>
        <span className="block text-2xs font-normal text-muted-foreground">{detail}</span>
      </span>
      <ChevronRightIcon className="size-4 shrink-0 text-primary" />
    </>
  );
}

export function BulkImportNextSteps({
  batch,
  assetsHref,
  busy,
  onDownloadResult,
  onReimport,
}: {
  batch: ImportBatch;
  assetsHref: string;
  busy: string | null;
  onDownloadResult: () => void;
  onReimport: () => void;
}) {
  const { created, createdWithWarning, notRegistered } = batch.counts;
  const registered = created + createdWithWarning;
  return (
    <Card className="shrink-0 space-y-3 focus-within:border-foreground/20 focus-within:shadow-float motion-reduce:transition-none p-4">
      <h2 className="text-sm font-semibold">Next Steps</h2>
      <div
        className={cn(
          "grid gap-3 @min-xl/result:grid-cols-2",
          registered > 0 && notRegistered > 0 && "@min-4xl/result:grid-cols-3",
        )}
      >
        {registered > 0 && (
          <Button asChild variant="ghost" className={TILE}>
            <Link href={assetsHref}>
              <TileBody
                icon={FileTextIcon}
                title="View Registered Assets"
                detail={`See the ${formatCount(registered)} assets that were created (${formatCount(created)} ready + ${formatCount(createdWithWarning)} with warnings)`}
              />
            </Link>
          </Button>
        )}
        <Button variant="ghost" className={TILE} disabled={Boolean(busy)} onClick={onDownloadResult}>
          <TileBody
            icon={DownloadIcon}
            spinning={busy === "result"}
            title="Download Full Result File"
            detail={`Get the complete result for all ${formatCount(batch.totalRows)} rows`}
          />
        </Button>
        {notRegistered > 0 && (
          <Button variant="ghost" className={TILE} disabled={Boolean(busy)} onClick={onReimport}>
            <TileBody
              icon={RefreshIcon}
              spinning={busy === "reimport"}
              title="Fix Errors and Re-import"
              detail="Download the error file, fix the data and register again"
            />
          </Button>
        )}
      </div>
    </Card>
  );
}
