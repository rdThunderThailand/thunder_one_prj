"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { AssetsImportBatchFilter } from "./AssetsImportBatchFilter";
import { ScanAssetDialog } from "../scan-asset/ScanAssetDialog";
import { filteredAssetExport } from "../../domain/asset-export";
import { startAssetExport } from "../lifecycle/export-handoff";
import { useAssetLabels } from "../../hooks/use-asset-labels";
import { useAssetsSelection } from "../../hooks/use-assets-selection";
import { AssetLabelsDialog } from "../asset-labels/AssetLabelsDialog";
import { useCategoryFilterLabel } from "../../hooks/use-category-filter-label";

export function AssetsListView({ context }: { context: string }) {
  const url = useAssetsListUrl();
  const parsed = readAssetListSearch(url.search);
  const defaults = readAssetListSearch("");
  if (!defaults.success) throw new Error("Invalid default asset query");
  const query = parsed.success ? parsed.data : defaults.data;
  const { summary, filters, list } = useAssetsListData(context, parsed.success ? parsed.data : null, url.search);
  const missingCategoryOption = Boolean(parsed.success && filters.data && query.category_id
    && !filters.data.categories.some((category) => category.id === query.category_id));
  const selectedCategory = useCategoryFilterLabel(context, query.category_id, missingCategoryOption);
  const denied = list.denied;
  const [scanOpen, setScanOpen] = useState(false);
  const scanTriggerRef = useRef<HTMLButtonElement>(null);
  const hasFilters = ["q", "category_id", "location_id", "status", "condition", "custody_type", "custody_id", "import_batch_id"].some((key) => url.get(key));
  // Arriving with a filter (e.g. from an Overview tile) starts with the totals folded so the filtered rows get the room.
  const [folded, setFolded] = useState(hasFilters);
  const summaryRef = useRef<HTMLDivElement>(null);
  const requestedKey = parsed.success ? assetListQueryString(query) : `invalid:${url.search}`;
  const exportReady = parsed.success && !list.pending && !list.error && Boolean(list.data) && list.dataKey === requestedKey;
  const labels = useAssetLabels(context, `${requestedKey}:${exportReady ? "ready" : "unavailable"}`);
  const selection = useAssetsSelection(`${context}:${requestedKey}`, list.data?.rows ?? []);
  const actionsPending = labels.phase === "loading" || labels.phase === "generating";
  const router = useRouter();
  const listSearch = parsed.success ? assetListQueryString(query, { omitDefaultSort: true }) : "";
  const from = listSearch ? `/asset-workspace/assets?${listSearch}` : "/asset-workspace/assets";

  /** FE 05: Export opens the export page; the selection or the list filters go with it (E1). */
  function openExport(ids?: string[]) {
    if (!exportReady || !list.data) return;
    if (ids) { startAssetExport(router.push, { from, ids }); return; }
    try {
      const request = filteredAssetExport(query, list.data.total).request;
      const filters = request.scope === "filtered" ? request.filters as Record<string, string> : {};
      startAssetExport(router.push, { from, filters: Object.keys(filters).length ? filters : undefined });
    } catch { toast.error("The export scope could not be prepared. Refresh the list and try again."); }
  }

  /** FE 07: scrolling the rows folds the totals away so the table gets their room; back at the top they return. */
  function onRowsScroll(rows: HTMLDivElement, wheelUp = false) {
    // Scrolling up at the top reopens them, also when the rows are too short to scroll.
    if (rows.scrollTop === 0 && (wheelUp || rows.scrollHeight > rows.clientHeight)) setFolded(false);
    // Fold only if the rows still overflow once the totals hide, or the taller box snaps to the top and reopens them.
    else if (rows.scrollTop > 24 && rows.scrollHeight - rows.clientHeight > (summaryRef.current?.offsetHeight ?? 0) + 24) setFolded(true);
  }

  function openLabels(trigger: HTMLButtonElement | null) {
    if (!exportReady) return false;
    const candidates = (list.data?.rows ?? []).filter((row) => selection.selected.has(row.id))
      .map((row) => ({ id: row.id, name: row.name, assetTag: row.asset_code, status: row.status, serialNumber: row.serial_number }));
    return labels.open(candidates, trigger);
  }

  return (
    <AssetsListWorkspace>
      <div className="space-y-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <PageHeader title="Assets" subtitle="View and manage all organizational assets" />
          {!denied && (
            <AssetsPageActions
              context={context}
              onScan={() => setScanOpen(true)}
              scanTriggerRef={scanTriggerRef}
              onExport={() => openExport()}
              exportDisabled={!exportReady}
              onLabels={openLabels}
              labelsDisabled={!exportReady || actionsPending}
            />
          )}
        </div>
      </div>
      <div
        ref={summaryRef} inert={folded} aria-busy={summary.pending}
        className={`grid transition-[grid-template-rows,opacity,margin] duration-200 ease-out motion-reduce:transition-none ${folded ? "-mb-3 grid-rows-[0fr] opacity-0" : "grid-rows-[1fr]"}`}
      >
        <div className="min-h-0 space-y-2 overflow-hidden">
          {summary.error && (
            <AssetsSectionError title="Couldn’t load asset totals" message={summary.error.message} pending={summary.pending} retry={summary.retry} />
          )}
          {summary.data ? <AssetsSummary result={{ ok: true, data: summary.data }} status={url.get("status")} onStatus={(status) => url.set({ status })} /> : summary.pending ? <AssetsSummaryLoading /> : null}
        </div>
      </div>
      <AssetsFilters
        result={filters.data ? { ok: true, data: filters.data } : filters.error}
        loading={filters.pending && !filters.data} url={url}
        selectedCategory={selectedCategory}
      />
      {filters.error && (
        <AssetsSectionError title="Couldn’t load filter options" message={filters.error.message} pending={filters.pending} retry={filters.retry} />
      )}
      {(hasFilters || !parsed.success || list.error?.status === 400) && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {parsed.success && query.import_batch_id && (
            <AssetsImportBatchFilter context={context} batchId={query.import_batch_id} />
          )}
          <Button size="sm" variant="ghost" onClick={url.clear}>Clear filters</Button>
        </div>
      )}
      <AssetsListContent
        resource={list} query={query} url={url} filtered={hasFilters}
        requestedKey={requestedKey}
        onExportSelected={(ids) => openExport(ids)}
        exportPending={actionsPending}
        selection={selection}
        onLabels={openLabels}
        onRowsScroll={onRowsScroll}
      />
      <AssetLabelsDialog flow={labels} />
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
