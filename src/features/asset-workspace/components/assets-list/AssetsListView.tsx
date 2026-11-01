"use client";

import { useRef, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { assetListQueryString, readAssetListSearch } from "../../services/assets-list-query";
import { useAssetsListData } from "../../hooks/use-assets-list-data";
import { useAssetsListUrl } from "../../hooks/use-assets-list-url";
import { Button } from "@/components/ui/lovable/button";
import { AssetsFilters } from "./AssetsFilters";
import { AssetsSummary } from "./AssetsSummary";
import { AssetsPageActions } from "./AssetsListToolbar";
import { AssetsListContent } from "./AssetsListContent";
import { AssetsSummaryLoading } from "./AssetsListLoading";
import { AssetsListWorkspace } from "./AssetsListWorkspace";
import { AssetsSectionError } from "./AssetsSectionError";
import { ScanAssetDialog } from "../scan-asset/ScanAssetDialog";

export function AssetsListView({ context }: { context: string }) {
  const url = useAssetsListUrl();
  const parsed = readAssetListSearch(url.search);
  const defaults = readAssetListSearch("");
  if (!defaults.success) throw new Error("Invalid default asset query");
  const query = parsed.success ? parsed.data : defaults.data;
  const { summary, filters, list } = useAssetsListData(context, parsed.success ? parsed.data : null, url.search);
  const denied = list.denied;
  const [scanOpen, setScanOpen] = useState(false);
  const scanTriggerRef = useRef<HTMLButtonElement>(null);
  const hasFilters = ["q", "category_id", "location_id", "status", "condition", "custody_type", "custody_id", "import_batch_id"].some((key) => url.get(key));

  return (
    <AssetsListWorkspace>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader title="Assets" subtitle="View and manage all organizational assets" />
        {!denied && <AssetsPageActions onScan={() => setScanOpen(true)} scanTriggerRef={scanTriggerRef} />}
      </div>
      <div className="space-y-2" aria-busy={summary.pending}>
        {summary.error && (
          <AssetsSectionError title="Couldn’t load asset totals" message={summary.error.message} pending={summary.pending} retry={summary.retry} />
        )}
        {summary.data ? <AssetsSummary result={{ ok: true, data: summary.data }} /> : summary.pending ? <AssetsSummaryLoading /> : null}
      </div>
      <AssetsFilters
        result={filters.data ? { ok: true, data: filters.data } : filters.error}
        loading={filters.pending && !filters.data} url={url}
      />
      {filters.error && (
        <AssetsSectionError title="Couldn’t load filter options" message={filters.error.message} pending={filters.pending} retry={filters.retry} />
      )}
      {(hasFilters || !parsed.success || list.error?.status === 400) && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {url.get("import_batch_id") && <span className="break-all">Import batch: {url.get("import_batch_id")}</span>}
          <Button size="sm" variant="ghost" onClick={url.clear}>Clear filters</Button>
        </div>
      )}
      <AssetsListContent
        resource={list} query={query} url={url}
        requestedKey={parsed.success ? assetListQueryString(query) : `invalid:${url.search}`}
      />
      {!denied && (scanOpen || url.get("scan") === "1") && (
        <ScanAssetDialog
          triggerRef={scanTriggerRef}
          onClose={() => {
            setScanOpen(false);
            if (url.get("scan")) url.closeScan();
          }}
        />
      )}
    </AssetsListWorkspace>
  );
}
