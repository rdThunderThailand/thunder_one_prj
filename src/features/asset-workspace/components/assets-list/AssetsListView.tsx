"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/lovable/button";
import { assetListQueryString, type AssetListQuery } from "../../services/assets-list-query";
import type { AssetsPageData, AssetListData } from "../../services/assets-list-types";
import { useListUrlState, type ListUrlState } from "../list-page/useListUrlState";
import { AccessDeniedState, EmptyState, LoadingState } from "../states/states";
import { ErrorState } from "../states/ErrorState";
import { AssetsFilters } from "./AssetsFilters";
import { AssetsSummary } from "./AssetsSummary";
import { AssetsTable } from "./AssetsTable";
import { AssetsPagination } from "./AssetsPagination";
import { AssetsPageActions, AssetsSelectionToolbar, AssetsViewControls } from "./AssetsListToolbar";
import { ScanAssetDialog } from "../scan-asset/ScanAssetDialog";

function AssetsListContent({ data, query, url }: { data: AssetListData; query: AssetListQuery; url: ListUrlState }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const pagination = {
    data,
    pending: url.isPending,
    onPage: (page: number) => url.set({ page: String(page) }),
    onPageSize: (size: number) => url.set({ page_size: String(size) }),
  };
  const onSort = (sort: AssetListQuery["sort"]) => url.set({
    sort, direction: query.sort === sort && query.direction === "asc" ? "desc" : "asc",
  });

  return (
    <section
      aria-label="Assets list"
      aria-busy={url.isPending}
      className="rounded-card border border-border bg-card shadow-panel"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2">
        <AssetsSelectionToolbar count={selected.size} clear={() => setSelected(new Set())} />
        <div className="flex flex-wrap items-center gap-3">
          <AssetsPagination {...pagination} compact />
          <AssetsViewControls />
        </div>
      </div>
      {url.isPending ? (
        <div className="p-4">
          <LoadingState rows={Math.min(data.pageSize, 10)} />
        </div>
      ) : data.rows.length === 0 ? (
        <div className="p-6">
          <EmptyState
            title={data.total > 0 ? "No assets on this page" : "No assets found"}
            body={data.total > 0 ? "The results may have changed. Return to the first page." : "There are no assets in this view. Adjust your filters or check your authorized scope."}
            action={data.total > 0 ? <Button size="sm" variant="outline" onClick={() => pagination.onPage(1)}>Go to first page</Button> : undefined}
          />
        </div>
      ) : (
        <AssetsTable
          rows={data.rows}
          query={query}
          selected={selected}
          pending={url.isPending}
          onSort={onSort}
          onSelectAll={(checked) => setSelected(checked ? new Set(data.rows.map((row) => row.id)) : new Set())}
          onSelect={(id, checked) => setSelected((previous) => {
            const next = new Set(previous);
            if (checked) next.add(id);
            else next.delete(id);
            return next;
          })}
        />
      )}
      <div className="border-t border-border p-3">
        <AssetsPagination {...pagination} />
      </div>
    </section>
  );
}

export function AssetsListView({ results, query }: { results: AssetsPageData; query: AssetListQuery }) {
  const url = useListUrlState();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [scanOpen, setScanOpen] = useState(false);
  const scanTriggerRef = useRef<HTMLButtonElement>(null);
  const failedAccess = [results.list, results.summary, results.filters].find((result) => !result.ok && [401, 403].includes(result.status));
  const hasFilters = ["q", "category_id", "location_id", "status", "condition", "custody_type", "custody_id", "import_batch_id"].some((key) => url.get(key));

  return (
    <div className="@container min-w-0 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader title="Assets" subtitle="View and manage all organizational assets" />
        <AssetsPageActions onScan={() => setScanOpen(true)} scanTriggerRef={scanTriggerRef} />
      </div>
      {failedAccess && !failedAccess.ok ? (
        failedAccess.status === 403 ? <AccessDeniedState body={failedAccess.message} /> : (
          <EmptyState
            title="Sign in to view assets"
            body={failedAccess.message}
            action={
              <Button asChild variant="outline" size="sm">
                <a href="/login">Sign in</a>
              </Button>
            }
          />
        )
      ) : (
        <>
          <AssetsSummary result={results.summary} />
          <AssetsFilters result={results.filters} url={url} />
          {(hasFilters || (!results.list.ok && results.list.status === 400)) && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {url.get("import_batch_id") && <span className="break-all">Import batch: {url.get("import_batch_id")}</span>}
              <Button
                size="sm"
                variant="ghost"
                disabled={url.isPending}
                onClick={() => router.push(pathname, { scroll: false })}
              >Clear filters</Button>
            </div>
          )}
          {results.list.ok ? (
            <AssetsListContent key={assetListQueryString(query)} data={results.list.data} query={query} url={url} />
          ) : (
            <ErrorState title="Couldn't load assets" body={results.list.message} />
          )}
        </>
      )}
      {(scanOpen || searchParams.get("scan") === "1") && (
        <ScanAssetDialog triggerRef={scanTriggerRef} onClose={() => {
          setScanOpen(false);
          if (searchParams.has("scan")) {
            const next = new URLSearchParams(searchParams.toString());
            next.delete("scan");
            // Remove only the direct-entry flag; do not reset pagination or filters.
            router.replace(next.size ? `${pathname}?${next}` : pathname, { scroll: false });
          }
        }} />
      )}
    </div>
  );
}
