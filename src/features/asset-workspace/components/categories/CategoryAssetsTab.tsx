import { useEffect, useRef } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/lovable/button";
import type { AssetCategoryDetail } from "../../domain/asset-category";
import { useCategoryAssetsData } from "../../hooks/use-category-assets-data";
import type { useCategoryAssetsUrl } from "../../hooks/use-category-assets-url";
import { AccessDeniedState, EmptyState } from "../states/states";
import { ErrorState } from "../states/ErrorState";
import { AssetsSectionError } from "../assets-list/AssetsSectionError";
import { AssetsPagination } from "../assets-list/AssetsPagination";
import { CategoryAssetsFilters } from "./CategoryAssetsFilters";
import { CategoryAssetsTable } from "./CategoryAssetsTable";
import { CategoryAssetsPaginationLoading, CategoryAssetsRowsLoading } from "./CategoryAssetsLoading";

export function CategoryAssetsTab({ context, category, url }: {
  context: string; category: AssetCategoryDetail; url: ReturnType<typeof useCategoryAssetsUrl>;
}) {
  const query = url.parsed.success ? url.parsed.data : null;
  const resource = useCategoryAssetsData(context, query, url.search);
  const { list, filters } = resource;
  const scroll = useRef<HTMLDivElement>(null);
  useEffect(() => { scroll.current?.scrollTo({ top: 0 }); }, [resource.key]);
  useEffect(() => {
    if (!list.pending && !list.error && list.data && list.dataKey === resource.key && list.data.page > Math.max(1, list.data.totalPages)) {
      url.set({ page: String(Math.max(1, list.data.totalPages)) }, true);
    }
  }, [list.pending, list.error, list.data, list.dataKey, resource.key, url]);
  const filtered = Boolean(query?.q || query?.status || query?.location_id || query?.condition);
  const denied = list.denied ?? filters.denied;
  let content;
  if (!query || list.error?.status === 400) {
    content = <EmptyState title="These filters are invalid" body="Clear the filters to reload assets for this category."
      action={<Button variant="outline" size="sm" onClick={url.clear}>Clear filters</Button>} />;
  } else if (denied?.status === 401) {
    content = <EmptyState title="Sign in to view assets" body={denied.message} action={
      <Button asChild variant="outline" size="sm">
        <Link href="/login">Sign in</Link>
      </Button>
    } />;
  } else if (denied) content = <AccessDeniedState body={denied.message} />;
  else if (list.pending) content = <CategoryAssetsRowsLoading />;
  else if (list.error) content = <ErrorState title="Couldn't load category assets" body={list.error.message} onRetry={list.retry} />;
  else if (!list.data?.rows.length) {
    content = <EmptyState title={filtered ? "No assets match these filters" : "No assets in this category"}
      body={filtered ? "Try a different search or clear the filters." : "This category and its child categories have no assets yet."}
      action={filtered ? <Button variant="outline" size="sm" onClick={url.clear}>Clear filters</Button> : undefined} />;
  } else content = <CategoryAssetsTable rows={list.data.rows} />;

  return (
    <Card role="region" aria-labelledby="category-assets-title" aria-busy={list.pending}
      className="@container/assets-results flex min-w-0 flex-col focus-within:border-foreground/20 focus-within:shadow-float motion-reduce:transition-none group-data-[bounded=true]/categories-workspace:min-h-0 group-data-[bounded=true]/categories-workspace:flex-1">
      <div data-category-controls className="shrink-0 space-y-3 p-4">
        <div className="space-y-1">
          <h2 id="category-assets-title" className="text-sm font-semibold">Assets in this Category</h2>
          <p className="break-words text-xs leading-relaxed text-muted-foreground">Assets assigned to the category “{category.name}” and all of its child categories.</p>
        </div>
        {!denied && <CategoryAssetsFilters query={query} options={filters.data} disabled={filters.pending || Boolean(filters.error)} onChange={url.set} />}
        {filters.error && !denied && (
          <AssetsSectionError title="Filter options unavailable" message="Assets can still be searched. Retry to load status, location and condition options."
            pending={filters.pending} retry={filters.retry} />
        )}
        {filtered && !denied && <Button variant="ghost" size="sm" onClick={url.clear}>Clear filters</Button>}
      </div>
      <div ref={scroll} tabIndex={0} role="region" aria-label="Category asset results"
        className="min-w-0 overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring group-data-[bounded=true]/categories-workspace:min-h-0 group-data-[bounded=true]/categories-workspace:flex-1 group-data-[bounded=true]/categories-workspace:overflow-auto">
        {content}
      </div>
      {list.pending && !denied && query && <CategoryAssetsPaginationLoading />}
      {!list.pending && !list.error && !denied && list.data && query && (
        <footer data-category-controls className="shrink-0 border-t border-border p-3">
          <AssetsPagination data={list.data} pending={false} onPage={(page) => url.set({ page: String(page) })}
            onPageSize={(size) => url.set({ pageSize: String(size) })} />
        </footer>
      )}
    </Card>
  );
}
