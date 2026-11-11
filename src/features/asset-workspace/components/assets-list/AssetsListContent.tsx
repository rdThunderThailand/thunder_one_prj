import { Card } from "@/components/ui/Card";
import { useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/lovable/button";
import { PlusIcon } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/Skeleton";
import type { AssetsListResource } from "../../hooks/use-assets-list-data";
import type { AssetsListUrlState } from "../../hooks/use-assets-list-url";
import type { AssetListQuery } from "../../services/assets-list-query";
import { AccessDeniedState, EmptyState } from "../states/states";
import { AssetsTable } from "./AssetsTable";
import { AssetsCompactList } from "./AssetsCompactList";
import { AssetsPagination } from "./AssetsPagination";
import { AssetsSelectionToolbar, AssetsSortControl, AssetsViewControls } from "./AssetsListToolbar";
import { AssetsTableLoading } from "./AssetsListLoading";
import { AssetsSectionError } from "./AssetsSectionError";
import type { AssetsSelection } from "../../hooks/use-assets-selection";

export function AssetsListContent({ resource, query, requestedKey, url, filtered, onExportSelected, exportPending, selection, onLabels }: {
  resource: AssetsListResource; query: AssetListQuery; requestedKey: string; url: AssetsListUrlState; filtered: boolean;
  onExportSelected: (ids: string[], trigger: HTMLButtonElement | null) => void;
  exportPending: boolean;
  selection: AssetsSelection;
  onLabels: (trigger: HTMLButtonElement | null) => boolean;
}) {
  const { data, pending, error, retry, dataKey } = resource;
  const scroll = useRef<HTMLDivElement>(null);
  const { selected } = selection;
  const frozen = pending || Boolean(error);
  const pagination = data ? { data, pending: frozen,
    onPage: (page: number) => url.set({ page: String(page) }),
    onPageSize: (size: number) => url.set({ pageSize: String(size) }) } : null;
  useEffect(() => { if (!pending && !error) scroll.current?.scrollTo({ top: 0 }); }, [dataKey, pending, error]);

  return (
    <Card role="region"
      data-assets-table aria-label="Assets list" aria-busy={pending}
      className="@container/assets-results flex min-w-0 flex-col overflow-hidden focus-within:border-foreground/20 focus-within:shadow-float motion-reduce:transition-none group-data-[bounded=true]/assets-workspace:min-h-0 group-data-[bounded=true]/assets-workspace:flex-1"
    >
      <div data-assets-controls className="flex shrink-0 flex-wrap items-center gap-2 px-3 py-2">
        <div className="min-w-0 flex-1 basis-48">
          <AssetsSelectionToolbar
            count={frozen ? 0 : selected.size}
            clear={selection.clear}
            onLabels={onLabels}
            onExport={(trigger) => onExportSelected([...selected], trigger)}
            exportDisabled={frozen || exportPending || dataKey !== requestedKey}
          />
        </div>
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 @min-4xl/assets-results:justify-end">
          <AssetsSortControl value={query.sort} pending={pending} onChange={(sort) => url.set({ sort })} />
          {pagination && <AssetsPagination {...pagination} compact />}
          <AssetsViewControls />
        </div>
      </div>
      {(pending || error) && (
        <div data-assets-controls className="shrink-0 space-y-2 border-t border-border px-3 py-2">
          {pending && <p role="status" className="text-xs text-muted-foreground">{data ? "Updating assets — showing previous results until the new request finishes." : "Loading assets…"}</p>}
          {error && <AssetsSectionError title={data ? "Couldn’t update assets — showing previous results" : "Couldn’t load assets"} message={error.message} pending={pending} retry={retry} />}
        </div>
      )}
      <div
        ref={scroll} data-assets-scroll tabIndex={0} aria-label="Assets results"
        className="relative min-w-0 overscroll-contain focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-data-[bounded=true]/assets-workspace:min-h-0 group-data-[bounded=true]/assets-workspace:flex-1 group-data-[bounded=true]/assets-workspace:overflow-y-auto"
      >
        {!data ? pending ? <AssetsTableLoading /> : error?.status === 403 ? (
          <AccessDeniedState body={error.message} />
        ) : error?.status === 401 ? (
          <EmptyState title="Sign in to view assets" body={error.message} action={
            <Button asChild variant="outline" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
          } />
        ) : (
          <p className="p-6 text-xs text-muted-foreground">Asset results are unavailable. Retry the request above.</p>
        ) : data.rows.length === 0 ? (
          <div className="p-6">
            <EmptyState title={data.total > 0 ? "No assets on this page" : "No assets found"}
              body={data.total > 0 ? "The results may have changed. Return to the first page." : filtered ? "There are no assets in this view. Adjust your filters or check your authorized scope." : "This organization has no assets in your authorized scope yet."}
              action={data.total > 0 ? <Button size="sm" variant="outline" disabled={frozen} onClick={() => url.set({ page: "1" })}>Go to first page</Button> : filtered ? undefined : (
                <Button asChild size="sm" variant="primary">
                  <Link href="/asset-workspace/assets/register">
                    <PlusIcon className="size-4" />
                    Register Asset
                  </Link>
                </Button>
              )} />
          </div>
        ) : (
          <>
            <div className="hidden @min-4xl/assets-results:block">
              <AssetsTable
                rows={data.rows}
                selected={frozen ? new Set() : selected}
                pending={frozen}
                onSelectAll={selection.selectAll}
                onSelect={selection.select}
              />
            </div>
            <div className="@min-4xl/assets-results:hidden">
              <AssetsCompactList
                rows={data.rows}
                selected={frozen ? new Set() : selected}
                pending={frozen}
                onSelectAll={selection.selectAll}
                onSelect={selection.select}
              />
            </div>
          </>
        )}
      </div>
      <div data-assets-controls className="shrink-0 border-t border-border px-3 py-2">
        {pagination ? <AssetsPagination {...pagination} /> : <Skeleton className="h-8 w-full" />}
      </div>
    </Card>
  );
}
