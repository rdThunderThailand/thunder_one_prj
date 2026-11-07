"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/lovable/button";
import { PlusIcon } from "@/components/ui/icons";
import type { CategoryListQuery, CategorySortKey } from "../../domain/asset-category";
import { categoryListView } from "../../domain/category-list";
import { useCategoryListData } from "../../hooks/use-category-list-data";
import { useCategoryListUrl } from "../../hooks/use-category-list-url";
import { AccessDeniedState, EmptyState, LoadingState } from "../states/states";
import { ErrorState } from "../states/ErrorState";
import { CategoriesFilters } from "./CategoriesFilters";
import { CategoriesPagination } from "./CategoriesPagination";
import { CategoriesTable } from "./CategoriesTable";
import { CategoriesWorkspace } from "./CategoriesWorkspace";

const defaults: CategoryListQuery = { q: "", sort: "default", direction: "asc", page: 1, pageSize: 10, expanded: [] };

export function CategoriesListView({ context }: { context: string }) {
  const url = useCategoryListUrl();
  const resource = useCategoryListData(context);
  const query = url.parsed.success ? url.parsed.data : defaults;
  const view = useMemo(() => categoryListView(resource.data ?? [], query), [resource.data, query]);
  const denied = resource.error?.status === 403;
  const scroll = useRef<HTMLDivElement>(null);

  useEffect(() => { scroll.current?.scrollTo({ top: 0 }); }, [url.search]);

  useEffect(() => {
    if (resource.data && url.parsed.success && query.page !== view.page) {
      url.set({ page: String(view.page) }, true);
    }
  }, [resource.data, query.page, view.page, url]);

  function sort(key: CategorySortKey) {
    url.set({ sort: key, direction: query.sort === key && query.direction === "asc" ? "desc" : "asc" });
  }

  function toggle(id: string) {
    const expanded = new Set(query.expanded);
    if (expanded.has(id)) expanded.delete(id);
    else expanded.add(id);
    // Expansion is URL state too, so a reload can reproduce the same paged tree.
    url.set({ expanded: [...expanded].join(",") || undefined, page: String(view.page) });
  }

  const add = (
    <Button asChild size="sm" variant="primary" className="max-sm:h-10">
      <Link href="/asset-workspace/categories/new">
        <PlusIcon aria-hidden="true" className="size-4" />
        Add Category
      </Link>
    </Button>
  );

  let content;
  if (!url.parsed.success) {
    content = (
      <EmptyState
        title="These category filters are invalid"
        body="Clear the filters to return to the category list."
        action={
          <Button variant="outline" size="sm" onClick={url.clear}>Clear filters</Button>
        }
      />
    );
  } else if (resource.pending) {
    content = <LoadingState rows={5} />;
  } else if (resource.error?.status === 401) {
    content = (
      <EmptyState
        title="Sign in to view categories"
        body={resource.error.message}
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
        }
      />
    );
  } else if (denied) {
    content = <AccessDeniedState body={resource.error?.message} />;
  } else if (resource.error) {
    content = <ErrorState title="Couldn't load categories" body={resource.error.message} onRetry={resource.retry} />;
  } else if (!view.rows.length) {
    content = (
      <EmptyState
        title={view.filtered ? "No categories match these filters" : "No categories yet"}
        body={view.filtered ? "Try another name, status, or parent category." : "Add a category to start organizing your assets."}
        action={view.filtered ? (
          <Button variant="outline" size="sm" onClick={url.clear}>Clear filters</Button>
        ) : add}
      />
    );
  } else {
    content = <CategoriesTable rows={view.rows} query={query} onSort={sort} onToggle={toggle} />;
  }

  return (
    <CategoriesWorkspace>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader title="Categories" subtitle="Organize and manage asset categories." />
        {!denied && resource.error?.status !== 401 && add}
      </div>
      {!denied && resource.error?.status !== 401 && (
        <CategoriesFilters
          query={query}
          parents={view.parentOptions}
          disabled={resource.pending || Boolean(resource.error)}
          onChange={url.set}
        />
      )}
      {view.filtered && url.parsed.success && !resource.pending && !resource.error && (
        <Button variant="ghost" size="sm" className="self-start" onClick={url.clear}>
          Clear filters
        </Button>
      )}
      <Card
        data-category-results
        role="region"
        aria-label="Categories list"
        aria-busy={resource.pending}
        className="@container/categories-results flex min-w-0 flex-col overflow-hidden focus-within:border-foreground/20 focus-within:shadow-float motion-reduce:transition-none group-data-[bounded=true]/categories-workspace:min-h-0 group-data-[bounded=true]/categories-workspace:flex-1 group-data-[bounded=true]/categories-workspace:shrink"
      >
        <div
          ref={scroll}
          role="region"
          aria-label="Category results"
          tabIndex={0}
          className="relative min-w-0 overflow-x-auto overscroll-contain focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring group-data-[bounded=true]/categories-workspace:min-h-0 group-data-[bounded=true]/categories-workspace:flex-1 group-data-[bounded=true]/categories-workspace:overflow-auto"
        >
          {view.rows.length && !resource.pending && !resource.error && url.parsed.success ? content : (
            <div className="p-4">{content}</div>
          )}
        </div>
        {!resource.pending && !resource.error && url.parsed.success && resource.data && (
          <CategoriesPagination
            {...view}
            rows={view.rows.length}
            onPage={(page) => url.set({ page: String(page) })}
            onPageSize={(size) => url.set({ pageSize: String(size) })}
          />
        )}
      </Card>
    </CategoriesWorkspace>
  );
}
