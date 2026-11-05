import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/lovable/button";
import { PlusIcon } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/Skeleton";
import type { AssetsListResource } from "../../hooks/use-assets-list-data";
import type { AssetsListUrlState } from "../../hooks/use-assets-list-url";
import type { AssetListQuery } from "../../services/assets-list-query";
import { AccessDeniedState, EmptyState } from "../states/states";
import { AssetsTable } from "./AssetsTable";
import { AssetsPagination } from "./AssetsPagination";
import { AssetsSelectionToolbar, AssetsSortControl, AssetsViewControls } from "./AssetsListToolbar";
import { AssetsTableLoading } from "./AssetsListLoading";
import { AssetsSectionError } from "./AssetsSectionError";

export function AssetsListContent({ resource, query, requestedKey, url, filtered, onExportSelected, exportPending }: {
  resource: AssetsListResource; query: AssetListQuery; requestedKey: string; url: AssetsListUrlState; filtered: boolean;
  onExportSelected: (ids: string[], trigger: HTMLButtonElement | null) => void;
  exportPending: boolean;
}) {
  const { data, pending, error, retry, dataKey } = resource;
  const scroll = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState({ query: requestedKey, ids: new Set<string>() });
  const selected = new Set([...selection.ids].filter((id) => data?.rows.some((row) => row.id === id)));
  if (selection.query !== requestedKey || selected.size !== selection.ids.size) {
    setSelection({ query: requestedKey, ids: selection.query !== requestedKey ? new Set() : selected });
  }
  const frozen = pending || Boolean(error);
  const pagination = data ? { data, pending: frozen,
    onPage: (page: number) => url.set({ page: String(page) }),
    onPageSize: (size: number) => url.set({ pageSize: String(size) }) } : null;
  useEffect(() => { if (!pending && !error) scroll.current?.scrollTo({ top: 0 }); }, [dataKey, pending, error]);

  return (
    <section
      data-assets-table aria-label="Assets list" aria-busy={pending}
      className="flex min-w-0 flex-col overflow-hidden rounded-card border border-border bg-card shadow-panel group-data-[bounded=true]/assets-workspace:min-h-0 group-data-[bounded=true]/assets-workspace:flex-1"
    >
      <div data-assets-controls className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-3 py-2">
        <div className="min-w-0 flex-1 overflow-x-auto">
          <AssetsSelectionToolbar
            count={frozen ? 0 : selected.size}
            clear={() => setSelection({ query: requestedKey, ids: new Set() })}
            onExport={(trigger) => onExportSelected([...selected], trigger)}
            exportDisabled={frozen || exportPending || dataKey !== requestedKey}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
        ref={scroll} data-assets-scroll tabIndex={0} aria-label="Scrollable assets table"
        className="min-w-0 overflow-x-auto overscroll-contain focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-data-[bounded=true]/assets-workspace:min-h-0 group-data-[bounded=true]/assets-workspace:flex-1 group-data-[bounded=true]/assets-workspace:overflow-y-auto"
      >
        {!data ? pending ? <AssetsTableLoading /> : error?.status === 403 ? (
          <AccessDeniedState body={error.message} />
        ) : error?.status === 401 ? (
          <EmptyState title="Sign in to view assets" body={error.message} action={
            <Button asChild variant="outline" size="sm">
              <a href="/login">Sign in</a>
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
          <AssetsTable rows={data.rows} selected={frozen ? new Set() : selected} pending={frozen}
            onSelectAll={(checked) => setSelection({ query: requestedKey, ids: checked ? new Set(data.rows.map((row) => row.id)) : new Set() })}
            onSelect={(id, checked) => setSelection((previous) => {
              const ids = new Set(previous.ids);
              if (checked) ids.add(id); else ids.delete(id);
              return { query: requestedKey, ids };
            })} />
        )}
      </div>
      <div data-assets-controls className="shrink-0 border-t border-border px-3 py-2">
        {pagination ? <AssetsPagination {...pagination} /> : <Skeleton className="h-8 w-full" />}
      </div>
    </section>
  );
}
